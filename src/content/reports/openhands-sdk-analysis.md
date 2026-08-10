---
title: "OpenHands Software Agent SDK 구조 분석"
summary: "실행 경로·이벤트 모델·컨텍스트 압축을 코드 수준에서 분석"
proves: "오픈소스 에이전트 분석 · 리서치 역량"
date: 2026-08-10
order: 1
---

**분석 대상**: [OpenHands/software-agent-sdk](https://github.com/OpenHands/software-agent-sdk)
**기준 커밋**: `d2845a6` (2026-08-10) · Python 3.13 · 4개 패키지 구성
**분석 관점**: LLM Agent Harness의 구성요소별 설계 — Planning / Memory / Tool Use / Loop / Evaluation / Meta-Harness

---

## 1. 패키지 구성

| 패키지 | 역할 |
|---|---|
| `openhands-sdk` | 코어. Agent, Conversation, Event, Tool, Skill, Context/Condenser, Security, Critic, Subagent, Hooks, MCP |
| `openhands-tools` | 실제 Tool 구현체. terminal, file_editor, apply_patch, grep, glob, browser_use, task_tracker, planning_file_editor, workflow, delegate, gemini 계열 |
| `openhands-agent-server` | REST/WS 서버, 영속화, 텔레메트리, VSCode·Canvas 확장, OpenAI 호환 엔드포인트 |
| `openhands-workspace` | 실행 환경 추상화. docker / apptainer / remote_api / cloud |

**설계 관찰**: 코어 SDK가 Tool 구현체와 실행 환경을 모두 분리해 의존하지 않는다. `openhands-sdk`는 Tool을 **이름으로 등록·해석**하고(Registry), 실행 환경은 `Workspace` 추상으로 받는다. 하네스 코어를 런타임 세부에서 떼어낸 구조.

---

## 2. 기반 구조: 추가 전용 이벤트 로그와 View

하네스 전체가 두 개념 위에 서 있다.

**① 추가 전용(append-only) 이벤트 로그**
모든 상태 변화가 `Event`로 기록된다. LLM에 보낼 수 있는 것은 `LLMConvertibleEvent`를 상속한다. 핵심 쌍은 `Action`(입력 스키마) / `Observation`(출력 스키마)이며, 둘 다 `Schema` 기반으로 `extra="forbid"`, `frozen=True`다.

> 설계 의도(`context/condenser/README.md`): *"환경을 잃어버려도 무슨 일이 있었는지에 대한 거의 완벽한 기록이 남는다. 디버깅에 훌륭하다."*

**② View — LLM이 지금 보는 것**
로그가 추가 전용이므로 "잊기"가 불가능하다. 그래서 `Condensation` 이벤트를 **툼스톤(tombstone)** 으로 남기고, `View`가 이를 적용해 "현재 LLM에 유효한 이벤트 집합"을 계산한다. README는 이 패턴을 Cassandra·Kafka의 툼스톤에 직접 비유한다.

**왜 중요한가**: 컨텍스트 관리를 "메시지 배열 자르기"가 아니라 **로그 + 투영(projection)** 문제로 재정의했다. 재현성(로그 보존)과 컨텍스트 예산(View 축소)을 동시에 만족시키는 방식이다.

---

## 3. Agent Harness 구성요소별 분석

### Planning
계획을 **컨텍스트가 아니라 외부 상태로 빼낸다.**
- `TaskTrackerTool`, `planning_file_editor`, `workflow`, `task` 툴이 별도로 존재
- 계획을 파일로 편집·조회하게 만들어, 컨텍스트가 압축돼도 계획이 사라지지 않는다

**핵심 판단**: 계획을 대화 히스토리에 두면 압축의 첫 희생물이 된다. 파일로 외부화하면 압축과 무관하게 살아남고, 재시작 후에도 이어진다.

### Memory
`context/condenser` — `LLMSummarizingCondenser`가 기본 전략.
- 트리거: `max_size`(기본 240 이벤트) 또는 `max_tokens` 초과, 혹은 명시적 요청
- 전략: View의 앞쪽 절반을 요약 이벤트 하나로 대체. 요약도 다음 압축에서 다시 요약됨 (재귀). 요약의 형태는 산문이 아니라 **이름 붙은 슬롯으로의 구조화된 상태 투영** — 4.4절 참조
- `keep_first`(기본 2): 앞부분 최소 보존 이벤트 수
- `minimum_progress`(기본 0.1): 압축 비율이 이보다 낮으면 하지 않음 — **무의미한 압축 방지**
- **soft / hard 트리거 구분**: 자원 상한 때문인 경우(soft)는 실패하면 다음 스텝에 재시도. 컨텍스트 초과로 진행 자체가 불가한 경우(hard)는 `hard_context_reset`으로 전량 요약. 실패 시 `hard_context_reset_context_scaling`(0.8)으로 목표를 줄여 최대 5회 재시도

README가 밝힌 **네 가지 트레이드오프**를 명시적으로 균형 잡는다: 호출당 비용 / 프롬프트 캐시 / 초기 컨텍스트 보존 / 최근 컨텍스트 보존. 특히 *"압축은 프롬프트 캐시를 파괴하지만, 자주 압축하면 캐시 재구축 비용이 낮게 유지된다"* 는 서술은 캐시 경제까지 계산에 넣었다는 뜻이다.

### Tool Use
세 층으로 나뉜다.

**스키마** (`tool/schema.py`): `Action` / `Observation` 쌍. `to_mcp_schema()` / `from_mcp_schema()` 로 **MCP와 양방향 변환**. 즉 자체 툴과 MCP 툴이 같은 타입 체계에 들어온다.

**레지스트리** (`tool/registry.py`): `register_tool` / `resolve_tool` / `list_registered_tools`. 주목할 것은 **`UsabilityChecker`** — 툴이 "현재 환경에서 자신이 사용 가능한지"를 스스로 판정한다. `is_tool_usable(name)`은 등록 여부 **와** 사용 가능 여부를 함께 본다.

**정책**: `allowed_tools`(스킬 단위 툴 제한), `filter_tools_regex`, `include_default_tools`, `tool_concurrency_limit`, `parallel_executor`(병렬 실행).

> **직접 대응**: 온디바이스 환경에서 같은 문제를 다룰 때도, "플러그인별 capability를 조회한 뒤 지원되는 값만 적용하는 Tool 계약"으로 같은 문제를 풀 수 있다. `UsabilityChecker`와 독립적으로 같은 결론에 도달한 셈이다.

### Loop
`LocalConversation.run()`이 실제 루프다. 상태 기계로 구현돼 있다.

상태 8종 (`ConversationExecutionStatus`): `IDLE`, `RUNNING`, `PAUSED`, `WAITING_FOR_CONFIRMATION`, `FINISHED`, `ERROR`, `STUCK`, `DELETING`. 종료 상태는 `FINISHED` / `ERROR` / `STUCK` 3종.

루프 한 바퀴에서 검사하는 것:
1. `PAUSED` / `STUCK` → 중단
2. `FINISHED` → **stop hook이 종료를 거부할 수 있다.** 거부 시 피드백 메시지를 환경 발화로 주입하고 `RUNNING`으로 되돌려 계속 진행
3. stuck 패턴 검사 → 걸리면 nudge 후 continue
4. `WAITING_FOR_CONFIRMATION` 해제 (= 사용자 승인)
5. `agent.step()` 호출

**설계 관찰 두 가지**
- 승인 게이트가 루프 안에 있다. 확인 모드에서 첫 호출은 액션을 만들고 멈추며, 두 번째 호출이 실행한다 — 승인이 별도 경로가 아니라 루프의 정상 상태다.
- `FINISHED`를 즉시 종료로 처리하지 않는다. 코드 주석이 이유를 밝힌다: 에이전트가 끝냈다고 선언한 직후 사용자가 동시에 메시지를 보내면 그 메시지가 유실되기 때문. **동시성 때문에 종료 조건을 일부러 느슨하게 뒀다.**

### Evaluation
두 갈래로 존재한다.

**① Critic — 점수 기반 반복 개선** (`critic/`)
- `CriticBase.evaluate(events) → CriticResult(score, message, metadata)`
- `should_refine(result)` → 개선을 계속할지 판정
- `get_followup_prompt(result, iteration)` → 개선 요청 프롬프트 생성
- `IterativeRefinementConfig`로 반복 제어
- 구현체: `agent_finished`, `empty_patch`(패치가 비었는지), `pass_critic`, `api`

즉 **평가가 루프에 되먹임되는 구조**다. 평가 → 점수 → 개선 프롬프트 → 재실행.

**② StuckDetector — 한계 감지** (`conversation/stuck_detector.py`)
5가지 정체 패턴을 임계값과 함께 탐지한다:

| 패턴 | 기본 임계값 |
|---|---|
| action–observation 반복 | 4회 |
| action–error 반복 | (설정) |
| 에이전트 독백 (사용자 입력 없이 반복 발화) | (설정) |
| 교대 action–observation 패턴 | (설정) |
| 컨텍스트 윈도우 오류 | — |

스캔 창은 최근 20개 이벤트로 제한하고(대용량 로그 전량 로드 방지), 마지막 사용자 메시지 이후만 본다. 같은 오류에 대해 nudge를 반복 발행하지 않도록 `_last_nudged_error_event_id`로 중복을 막는다.

> **이것이 "Agent의 성능과 한계를 체계적으로 측정" 이라는 과제에 가장 가까운 부분이다.** 벤치마크가 사후 측정이라면 StuckDetector는 런타임 한계 감지다.

### Meta-Harness
**하네스가 코드가 아니라 데이터로 정의된다.** 이 SDK의 가장 특징적인 부분.

`subagent/schema.py`의 `AgentDefinition`은 **마크다운 프론트매터에서 에이전트를 정의**한다:
`name`, `description`, `model`, `color`, `tools`, `skills`, `system_prompt`, `level`, `when_to_use_examples`(`<example>` 태그에서 추출), `hooks`, `permission_mode`(미지정 시 부모 상속), **max iterations**, **per-run cost budget (USD)**, condenser 설정, MCP 서버, profile store.

즉 새 에이전트를 만들려면 코드가 아니라 마크다운 파일을 추가한다. 툴 제한·권한 모드·반복 상한·비용 예산까지 선언적으로 지정된다. `plugin/`, `profiles/`, `marketplace/`가 이 선언적 정의의 배포·공유를 담당한다.

---

## 4. 실행 경로 심층 분석

> 3절이 "무엇이 어디에 있는가"라면 이 절은 "실제로 어떻게 흐르는가"다. 구조도만으로는 하네스를 개선할 수 없고, 깨지는 지점은 이 층에만 있다.

### 4.1 Tool 실행 경로 — LLM 응답에서 Observation까지

`agent.step()` 한 번의 흐름:

```
LLM completion (security_risk 파라미터 포함)
  → ActionEvent 배치 생성 (tool call 하나당 1개)
  → _requires_user_confirmation() 판정
  → [승인 필요] WAITING_FOR_CONFIRMATION 으로 멈춤, 액션은 미실행 보관
  → [실행 가능] _execute_actions(tool_runner) → ObservationEvent
```

**위험도를 별도 분석 패스로 뽑지 않는다.** `llm_security_analyzer=True`가 기본으로 강제되고(`kwargs.setdefault`), 위험도는 LLM completion 시 **OpenAI 포맷의 `security_risk` 파라미터로 인라인 수집**된다. 즉 모델이 tool call을 만들면서 자기 위험도를 함께 신고한다. 추가 LLM 호출이 없어 저렴한 대신, **안전 판정이 모델의 자기 신고에 의존**한다.

`_requires_user_confirmation()`의 규칙:
- 단일 `FinishAction`, 단일 `ThinkAction`은 **절대** 확인하지 않는다 (부작용이 없으므로)
- security analyzer가 없으면 모든 위험도가 `UNKNOWN`
- `any(policy.should_confirm(risk) for risk in risks)` — **배치 중 하나라도 걸리면 배치 전체가 대기**한다. 개별 승인이 아니라 배치 승인

승인 모드의 구현이 특이하다. 첫 `run()`은 액션을 만들고 실행하지 않은 채 멈추며, **다음 `run()` 호출 자체가 암묵적 승인**이다. 별도 approve API가 아니다.

실행기는 `tool_runner` 콜러블로 주입되어 교체 가능하고, `tool_concurrency_limit`과 `parallel_executor`로 배치 내 병렬 실행을 제어한다.

### 4.2 Skill 주입 경로 — 카탈로그와 본문의 분리

`AgentContext._partition_skills()`가 스킬을 두 갈래로 나눈다:

| 갈래 | 조건 | 주입 방식 |
|---|---|---|
| **repo-context** | 레거시 포맷 + `trigger=None` | **본문 전체**가 항상 시스템 메시지에 포함 |
| **available-skills** | AgentSkills 포맷 또는 트리거 보유 | 시스템 메시지에는 **목록만**, 트리거 시 본문 주입 |

즉 시스템 프롬프트는 스킬 **카탈로그**를 들고 있고 본문은 필요할 때 온다. 여기에 스킬 내부의 `references/`·`scripts/` 분리가 한 겹 더 얹혀 **2단 점진적 공개**가 된다:

```
시스템 프롬프트: 스킬 목록(이름 + description)
  → 트리거 매칭 시: SKILL.md 본문
    → 본문이 지시할 때: references/*.md, scripts/*
```

`disable_model_invocation`이 이 분기를 제어한다. 켜지면 목록에도 오르지 않고 트리거 시 주입만 된다. `PathTrigger`는 이 플래그가 강제되므로 결과적으로 **"모델이 호출할 수 없고, 해당 경로의 파일을 건드릴 때 자동 주입되는 규칙"** 이 된다. 기능(모델이 부르는 것)과 규칙(자동으로 걸리는 것)을 같은 스킬 체계 안에서 구분한 방식.

### 4.3 이벤트 모델 — 두 개의 식별자

압축 가능성이 전부 이 두 식별자에 걸려 있다.

- **`llm_response_id`**: 한 LLM 응답이 여러 tool call을 담으면, 각 call은 개별 `ActionEvent`로 쪼개지지만 **같은 `llm_response_id`를 공유**한다
- **`tool_call_id`**: observation이 자신의 action과 연결되는 키

### 4.4 컨텍스트 압축의 실제 메커니즘

**① 망각은 삭제가 아니라 툼스톤 기록이다**

`Condensation` 이벤트가 담는 것: `forgotten_event_ids`(집합), `summary`, `summary_offset`, `llm_response_id`.

`Condensation.apply()`는 두 단계다:
1. `forgotten_event_ids`에 없는 이벤트만 남긴다
2. 요약 메타데이터가 있으면, **제거가 끝난 뒤의** 리스트에 `summary_offset` 위치로 요약 이벤트를 끼워넣는다

요약 이벤트는 메인 이벤트 스토어에 저장되지 않는다. `{condensation_id}-summary`라는 결정적 ID로 **매번 동적 생성**된다. 그리고 `CondensationSummaryEvent.to_llm_message()`가 반환하는 것은 **`role="user"`** 다 — 요약이 시스템이나 어시스턴트가 아니라 **사용자 발화로 되돌아온다.**

**②' 무엇이 남는가 — 압축의 실제 형태**

압축의 결과물은 산문 요약이 아니다. `context/condenser/prompts/summarizing_prompt.j2` 단 하나의 프롬프트가 전 과정을 지배하며, **이름 붙은 슬롯으로의 상태 투영**을 지시한다.

```
USER_CONTEXT   : 사용자 요구·목표·명확화 사항
TASK_TRACKING  : 활성 작업의 ID와 상태  ← "PRESERVE TASK IDs" (대문자 강조)
COMPLETED      : 완료 작업 + 간단한 결과
PENDING        : 남은 작업
CURRENT_STATE  : 현재 변수·데이터 구조·관련 상태

# 코드 작업일 때 추가
CODE_STATE / TESTS / CHANGES / DEPS / VERSION_CONTROL_STATUS
```

주목할 지시 세 가지:

1. ***"You will be given a list of events ... which will include previous summaries"*** — 요약이 다시 요약된다. 재귀 구조이므로 초기 컨텍스트는 사라지지 않고 **점진적으로 열화**된다. README가 말한 "초기 컨텍스트 보존"의 실체가 이것이다.

2. ***"If the events being summarized contain ANY task-tracking, you MUST include a TASK_TRACKING section"*** + *"preserve exact task IDs and statuses"* — 압축이 **계획을 잃지 않도록 명시적으로 못 박는다.** 3절의 Planning 분석과 이어지는 지점이다. 계획은 ① 파일로 외부화되고 ② 압축 프롬프트에서 보존이 강제된다 — **이중 보호**다.

3. ***"Adapt tracking format to match the actual task type"*** + 코드 작업 / 비코드 작업 두 개의 few-shot 예시 — 프롬프트 자체가 작업 유형에 조건적이다.

이벤트는 Jinja 루프로 `<EVENT>` 태그에 감싸 전달된다.

> **설계 판단**: 압축을 "요약"으로 두면 무엇이 사라질지 통제할 수 없다. 슬롯을 고정하면 **무엇이 반드시 남아야 하는지를 계약으로 만들 수 있다.** 특히 task ID 보존을 강제한 것은, 압축 후에도 에이전트가 진행 중이던 작업을 이어갈 수 있게 하는 최소 조건을 프롬프트 수준에서 보장한 것이다.

정리하면 압축의 3분할 구조는 이렇다:

| 구간 | 처리 |
|---|---|
| **앞부분** (`keep_first`, 기본 2) | 무손실 보존 |
| **중간** (앞쪽 절반의 나머지) | `summarizing_prompt.j2`로 LLM이 구조화 요약 → 요약 이벤트 1개로 대체 (재귀적으로 재요약됨) |
| **뒷부분** (뒤쪽 절반) | 무손실 보존 — 현재 작업을 이어가는 데 필요 |

**② 그런데 아무 지점에서나 자를 수 없다** ← 이 절의 핵심

`View.from_events()`는 이벤트를 하나씩 append해 압축을 발생 순서대로 적용한 뒤, `enforce_properties()`를 호출한다. 불변조건 4개가 걸려 있다:

| 불변조건 | 내용 | 위반 시 동작 |
|---|---|---|
| `ToolCallMatchingProperty` | action과 observation은 쌍이어야 한다 | 짝 없는 action 제거 |
| `ToolLoopAtomicityProperty` | action/observation 쌍이 사이에 아무것도 없이 연속된 구간은 원자적 | 일부만 지우면 **구간 전체**를 지운다 |
| `BatchAtomicityProperty` | 같은 `llm_response_id`를 공유하는 이벤트는 원자적 | 하나를 잊으면 **배치 전체**를 잊는다 |
| `ObservationUniquenessProperty` | `tool_call_id`당 observation은 최대 1개 | 중복 observation 폐기 |

`ToolLoopAtomicityProperty`의 독스트링이 이유를 명시한다:

> *"thinking이 활성화된 Anthropic 모델에서 중요하다. 이들은 tool loop의 첫 요소에 thinking 블록이 있기를 기대하고 **체크섬으로 위치가 올바른지 검증**하므로, 그런 구성에서 tool loop의 어떤 요소를 제거하면 전체를 제거해야 한다."*

`BatchAtomicityProperty`의 이유도 명확하다: 원래 메시지를 재구성하려면 같은 배치의 이벤트가 모두 있어야 한다.

그래서 압축은 임의 인덱스가 아니라 **`ManipulationIndices`** — "이벤트를 안전하게 조작할 수 있는 인덱스 집합" — 의 원소에서만 일어난다. 각 property가 `manipulation_indices()`로 자신이 허용하는 절단면을 신고하고, 그 교집합이 실제 가능한 절단면이 된다.

**③ 이 제약이 나머지 설계를 전부 설명한다**

| 설계 요소 | 이 제약에서 나온 이유 |
|---|---|
| README의 *"압축이 구조를 위반할 수밖에 없는 경우가 있다"* | 불변조건 때문에 원하는 만큼 자를 수 없음 |
| `minimum_progress` = 0.1 | 절단면 제약으로 조금만 잘리면 압축이 무의미 → 아예 안 함 |
| soft / hard 트리거 구분 | soft(자원 상한)는 실패해도 다음 스텝 재시도. hard(컨텍스트 초과)는 **다음 스텝이 존재하지 않으므로** 전량 요약 필요 |
| `hard_context_reset_context_scaling` = 0.8, 최대 5회 | 전량 요약도 구조 제약으로 실패할 수 있어 목표를 줄여가며 재시도 |
| `keep_first` = 2 | 앞부분 절단면이 불변조건에 걸리는 걸 회피 |

**④ 하네스 엔지니어링 관점의 교훈**

여기서 얻는 결론이 이 분석의 가장 중요한 부분이다. **provider의 매우 구체적인 구현 세부(Anthropic thinking 블록의 체크섬 검증)가 컨텍스트 관리 알고리즘의 불변조건으로 올라온다.**

컨텍스트 압축은 "토큰을 줄이는 알고리즘" 문제가 아니다. **provider 계약에 종속된 제약 만족(constraint satisfaction) 문제**다. 그래서 이 SDK는 압축 전략(`Condenser`)과 구조 제약(`View properties`)을 별개 모듈로 분리했고, 압축이 실패할 수 있다는 것을 정상 경로로 받아들이는 설계(soft/hard 구분)를 택했다.

**압축을 직접 구현할 때 반드시 먼저 정해야 할 것**: 우리 모델·provider에서 절단 불가 단위는 무엇인가. 이걸 정하지 않고 "앞쪽 절반 요약"부터 구현하면 API가 거부하는 메시지 배열을 만들게 된다.

---

## 5. Skill 규격 상세 — SKILL.md

온디바이스 환경에서 Skill 규격을 설계할 때 참고할 만한 부분이므로 별도로 정리한다.

**타입 3종**: `repo`(저장소 전역) / `knowledge`(트리거 기반) / `agentskills`(AgentSkills 표준 포맷)

**트리거 3종** (`skills/trigger.py`):
- `KeywordTrigger(keywords)` — 사용자 발화에 키워드가 **완전 토큰**으로 등장하면 활성 (부분 문자열 매칭 아님)
- `TaskTrigger(triggers)` — 특정 작업 유형에 활성, 프롬프트 수정 가능
- `PathTrigger(paths)` — 에이전트가 **glob에 매칭되는 경로의 파일을 건드릴 때** 활성 (gitignore 스타일 `**` 시맨틱). 이른바 "rules"

**Skill 모델 필드** (13개): `name`, `content`, `trigger`, `source`, `mcp_tools`, `inputs`(파라미터 메타데이터), `is_agentskills_format`, `version`, `description`, `license`, `compatibility`, `metadata`, `allowed_tools`, `disable_model_invocation`, `resources`

**리소스 구조** (`SkillResources`): `skill_root` 하위에 `scripts/` `references/` `assets/` — 스킬 본문은 짧게 두고 세부는 참조 파일로 분리하는 **점진적 공개(progressive disclosure)** 구조.

**세부 규칙 몇 가지** (설계 의도가 드러나는 부분)
- `PathTrigger` 규칙은 `disable_model_invocation`이 강제된다 — 경로 규칙은 **주입만 하고 모델이 호출하지는 못한다**. 규칙과 호출 가능 기능을 구분한 것
- 스킬이 MCP 서버를 **번들로 가질 수 있다** (`mcp_tools`) — 스킬이 지식뿐 아니라 실행 능력까지 반입
- `allowed_tools`로 스킬 단위 툴 화이트리스트 지정 (공백 구분 문자열 또는 리스트 모두 허용)
- 변수가 있는 스킬은 누락 변수를 되묻는 프롬프트가 자동 추가됨
- `` !`command` `` 인라인 블록을 렌더 시점에 실행 (`render_content_with_commands`)
- `.cursorrules`, `AGENTS.md` 같은 **서드파티 규칙 파일도 스킬로 흡수**
- 이름 충돌은 로드 순서 기반 dedup (`seen_names`)

---

## 6. 온디바이스 Android Agent Runtime 관점의 도입 판단

> 이 절이 분석의 실질이다. "무엇을 봤다"가 아니라 "무엇을 가져오고 무엇을 버렸는가".

### 채택할 것

| 항목 | 이유 |
|---|---|
| **Action / Observation 이벤트 쌍 + 추가 전용 로그** | 재현성과 사후 분석이 하네스 개선의 전제. Android에서는 ObjectBox·Room으로 구현 가능 |
| **Tool usability 판정** | 플러그인 설치 여부·버전·capability가 단말마다 다른 온디바이스 환경에서 필수. 3절의 Tool 계약 관찰과 같은 결론 |
| **Risk 판정과 승인 정책의 분리** | `SecurityRisk`(무엇이 위험한가)와 `ConfirmationPolicy`(언제 물을 것인가)를 분리하면 정책만 교체 가능. 설정 변경처럼 되돌리기 어려운 작업이 많은 온디바이스에서 특히 유효 |
| **StuckDetector** | 온디바이스는 배터리·발열·토큰 비용이 직접적이라 정체 감지 가치가 서버보다 크다. 임계값 설정형 5패턴 구조를 그대로 참고 가능 |
| **Skill 리소스 분리 (점진적 공개)** | 컨텍스트 예산이 더 빡빡한 온디바이스에 그대로 유효 |
| **선언적 에이전트 정의의 반복 상한·비용 예산** | 무한 루프와 비용 폭주를 선언으로 막는 방식 |

### 변형해서 가져올 것

| 항목 | 변형 이유 |
|---|---|
| **Condenser** | 요약을 LLM 호출로 수행한다. 온디바이스에서 압축마다 추가 추론은 지연·전력 부담이 크다 → 규칙 기반 요약 또는 소형 온디바이스 모델, 혹은 서버 위임으로 대체 검토. 단 `minimum_progress`·soft/hard 트리거 구분은 그대로 유효 |
| **선언적 정의의 배포 경로** | 파일시스템 기반 마크다운 로딩을 전제한다. Android에서는 APK 리소스 또는 ContentProvider를 통한 배포로 바꿔야 함 |
| **MCP** | stdio/HTTP MCP 서버를 단말에서 띄우는 건 현실적이지 않다 → ContentProvider IPC가 같은 역할(외부 능력 편입)을 대신. 다만 **MCP 스키마와의 양방향 변환 발상**은 유지할 가치가 있음 |
| **Workspace 샌드박스** | Docker·Apptainer 전제. Android는 앱 샌드박스와 권한 모델이 이미 격리를 제공하므로 그 층으로 대체 |

### 채택하지 않을 것

| 항목 | 이유 |
|---|---|
| **Remote Conversation / Agent Server** | 온디바이스 단독 실행이 목적이면 불필요한 복잡도 |
| **이벤트 로그 전량 영구 보존** | 모바일 저장 공간 제약. 보존 기간·용량 상한과 폐기 정책이 먼저 필요 |
| **LLM 기반 security analyzer** | 액션마다 위험도 판정용 추가 LLM 호출은 온디바이스에서 비현실적 → 정적 규칙 + capability 화이트리스트로 대체 |

---

## 7. 비판적 관찰 — 이 설계의 한계

1. **압축은 프롬프트 캐시를 파괴한다.** README가 스스로 인정하는 트레이드오프이며, "자주 압축해 재구축 비용을 낮게 유지"는 완화일 뿐 해소가 아니다. 캐시 요금 구조가 다른 제공자에서는 최적점이 달라진다.

2. **요약이 `role="user"`로 되돌아온다.** `CondensationSummaryEvent.to_llm_message()`가 user 메시지를 반환한다. 구현상 자연스러운 선택이지만(system은 고정, assistant는 tool call 짝 문제), 결과적으로 **에이전트 자신의 과거 행적이 사용자 발화로 위장**된다. 모델이 "사용자가 이렇게 말했다"와 "내가 이렇게 했다"를 구분하지 못할 수 있고, 지시와 기록이 같은 역할에 섞인다. 프롬프트 인젝션 관점에서도 검토가 필요한 지점이다.

3. **압축 품질이 단일 프롬프트에 전적으로 의존한다.** `summarizing_prompt.j2` 하나가 모든 압축을 담당하며, 슬롯 누락이나 task ID 유실을 검증하는 장치가 없다. 요약이 재귀적으로 재요약되므로 **한 번의 누락이 이후 모든 압축에 전파된다.** Critic이 있는데 압축 결과에는 적용되지 않는다 — 압축 자체를 평가하는 루프가 빠져 있다.

4. **StuckDetector는 표면 패턴만 본다.** 반복·독백·교대 패턴은 잡지만, **매번 다른 잘못된 행동을 하며 목표에서 멀어지는 경우**는 탐지하지 못한다. 진짜 어려운 실패는 반복이 아니라 방향 이탈이다. 이건 Critic 쪽 책임으로 넘어가 있으나, Critic 구현체가 `empty_patch`·`agent_finished` 수준이라 목표 정렬을 평가하지는 않는다.

5. **위험도를 LLM이 예측한다.** `SecurityRisk`가 예측값이므로 틀릴 수 있고, `UNKNOWN`의 처리를 정책(`confirm_unknown`)에 위임한다. 안전 판단을 확률적 구성요소에 의존하는 구조라, 되돌릴 수 없는 작업에는 정적 규칙이 함께 필요하다.

6. **Skill 규격이 비대해지고 있다.** 필드 13개에 `disable_model_invocation` 같은 예외 플래그가 붙어 있고, `PathTrigger`는 그 플래그를 강제한다. 트리거 종류와 스킬 타입이 늘면서 규격 자체의 복잡도가 올라가는 중이다. 규격 설계 시 **트리거 축과 권한 축을 처음부터 분리**하는 편이 나았을 가능성이 있다.

7. **이름 충돌 해소가 로드 순서에 의존한다.** `seen_names` 기반 dedup은 우선순위가 암묵적이다. 여러 출처(홈 디렉토리·저장소·서드파티)에서 스킬을 모으는 구조에서는 명시적 우선순위 선언이 안전하다.

---

## 8. 요약

이 SDK의 핵심은 세 가지 결정으로 압축된다.

1. **상태를 추가 전용 로그로 두고, LLM이 보는 것은 그 로그의 투영(View)으로 계산한다.** 재현성과 컨텍스트 예산을 분리해서 다룰 수 있게 만든 선택.
2. **하네스를 코드가 아니라 데이터로 정의한다.** 에이전트·스킬·툴 제한·권한·반복 상한·비용 예산이 모두 선언이다. 확장이 배포 문제로 환원된다.
3. **루프에 안전장치를 정상 상태로 편입한다.** 승인 대기와 정체 감지가 예외 처리가 아니라 상태 기계의 정식 상태다.

Agent Harness를 설계할 때 실제로 어려운 부분은 LLM 호출이 아니라 **잊기(압축)·멈추기(정체 감지)·묻기(승인)** 세 가지이고, 이 SDK는 그 세 가지를 각각 독립 모듈로 분리해 두었다.

---

### 분석 재현
```bash
git clone --depth 1 https://github.com/OpenHands/software-agent-sdk.git
# 기준 커밋: d2845a6 (2026-08-10)
# 핵심 경로: openhands-sdk/openhands/sdk/{agent,conversation,context,skills,tool,security,critic,subagent,hooks}
```
