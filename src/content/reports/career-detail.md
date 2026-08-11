---
title: "경력 상세 — 5년, 13개 프로젝트"
summary: "삼성전자 MX사업부 5년의 프로젝트별 역할·수행업무·정량 성과 전체 기록"
proves: "5년 실무 경력 전체"
date: 2026-08-11
order: 0
---

**이동현 · Android / AI Agent Engineer**
삼성전자 MX사업부 · 2021.09 ~ 현재 (약 5년)

> 미출시·사내 전용 프로젝트는 코드네임 대신 일반명으로 표기했습니다. 회사 영업비밀 보호를 위해 아키텍처는 "무엇을 왜 어떻게 풀었는가" 수준으로 다뤘고, 프로젝트별 역할은 **주도**(설계 방향을 직접 결정) / **담당**(정해진 범위를 전담해 완결) / **참여**(팀 작업 일부를 분담) 세 단계로 표기했습니다.

---

## 요약

5년간 AWS 기반 데이터 파이프라인, 생성형 AI 검증 플랫폼, Android 네이티브 앱, React Native 기반 생성형 앱 플랫폼까지 여러 영역을 옮겨 다니며 그때그때 필요한 기술 스택을 새로 습득해 왔습니다. Python·PySpark, TypeScript·React, Kotlin·Android, React Native·Expo까지 — 프로젝트 성격에 맞춰 스택을 바꾸는 데 어려움이 없다는 점이 강점입니다.

2026년 2월 자연어 기반 생성형 앱 플랫폼에서 Agent 개발 규칙·아키텍처 불변 조건·검증 루프를 포함한 하네스 엔지니어링 실무에 참여했고, 이어서 Android 네이티브 AI Agent Runtime(Agent Loop, Tool Registry·Policy·Executor, Skill 규격)의 정해진 개발 범위를 전담해 구현했습니다. 최근에는 기능 탐색부터 계약 생성·승인·연동 코드 생성·실기기 검증까지 자동화하는 DevKit의 workflow와 Contract 규격을 직접 설계·개발해 Agent 연동 작업 자체를 표준화하고 있습니다.

Agent Runtime의 Skill 규격을 만들 때는 오픈소스 에이전트 분석을 근거로 삼았습니다. OpenHands SDK를 상세히 분석해 구조를 벤치마킹하고, 이를 반영해 담당 범위였던 Skill 규격을 설계했습니다. (상세: [OpenHands SDK 구조 분석](/reports/openhands-sdk-analysis))

이전에는 대규모 데이터 파이프라인 운영과 생성형 AI·온디바이스 AI 검증 자동화 도구를 만들며 AI 기능을 측정 가능한 대상으로 만드는 일을 해왔습니다. 데이터·평가 인프라부터 제품 UI, 네이티브 브리지, 오류 복구까지 end-to-end로 다룰 수 있다는 점이 강점입니다.

---

## 핵심 역량

**Agent Runtime & Harness 엔지니어링**
- Agent Loop, Conversation 상태 관리, Tool Registry·Policy·Executor 설계 및 구현
- 자연어 의도·함수·파라미터·제약·예시를 정의하는 Skill 규격과 Registry 설계
- capability를 조회해 지원되는 값만 적용하는 Tool 계약 설계로 실행 안전성 확보
- Tool 실행 취소·상태 복원, 사용자 승인 흐름 등 실패 복구와 human-in-the-loop 구조 설계
- Agent 개발 규칙·아키텍처 불변 조건·검증 루프를 포함한 하네스 엔지니어링 실무 참여
- OpenHands SDK 상세 분석을 통한 오픈소스 에이전트 구조 벤치마킹

**Agent 평가 및 Benchmark 구축**
- 온디바이스 AI 기능의 테스트 실행 → Ground Truth 대조 → 점수 계산 → 리포트 생성 전 과정을 자동화한 검증 도구를 처음부터 설계·개발
- 복수 단말 대상 테스트 분배·실행 상태 관리로 병렬 평가 환경 구성
- LLM 기반 결과 평가(LLM-as-judge)와 다중 모델 비교, 다국어 자동화 검증 프로세스 구축
- 정확도·응답 시간·토큰·비용 기준의 모델 및 경쟁 서비스 비교 평가
- 동일 baseline 기반의 결정적(deterministic) 검증 자동화와 실기기 E2E 검증

**AI 제품화 및 멀티 플랫폼 개발**
- LLM 출력을 실제 제품 UI(Android Widget, 동적 렌더링, 생성형 앱)로 연결
- Rule → 분류 모델 → LLM을 단계적으로 적용하는 Safety Filter 설계 및 검증
- Android Native, React Native, Web(React/TS), Python GUI 전반의 제품 개발
- React Native ↔ Android Native Module 설계, JS bundle·asset 동적 실행 런타임 개발
- SSE 기반 비동기 작업의 진행 상태·중단·재연결·상태 복원 구조 설계

**데이터 및 인프라**
- Airflow·PySpark·EMR 기반 대규모 로그 파이프라인 개발·운영 및 비용 최적화
- 데이터 Schema 변경 대응, 개인정보 필드 정제, Cross-account 데이터 이관 설계
- 운영 장애 원인 분석과 복구, CI 기반 배포 자동화

---

## 프로젝트 이력

> 최신순.

### Agent 연동 자동화 DevKit
**2026.08 ~ 현재** · 역할: **주도** · Java, CLI, YAML/JSON Schema, ADB, Android Instrumentation, HTML/CSS/JS

플러그인의 사용자 기능을 조사해 Agent 계약 후보로 만들고, 담당자 승인부터 Android 연결 코드 생성과 실기기 검증까지 하나의 흐름으로 자동화하는 DevKit을 개발했습니다. 플러그인마다 반복되던 수작업 Agent 연동을 규격화해 재사용 가능한 파이프라인으로 만든 작업으로, 5단계 workflow(Onboard·Approve·Integrate·Verify·E2E)와 Contract 규격 설계를 직접 결정했습니다.

**수행업무**
- 플러그인 사용자 기능을 자동 탐색하고, Agent 노출 후보와 위험도를 분류하는 단계 구현
- 기능·파라미터·위험·복원 정보를 담은 Contract를 정의하고, 이를 기반으로 Android 연동 코드 생성
- 담당자가 후보를 검토·승인하는 로컬 Review Center 개발
- 후보 생성 → 승인 → 통합 → 검증 결과를 동일 baseline으로 추적하는 구조 설계
- Registry·Manifest·APK와 Android wiring의 결정적 검증 자동화
- 승인된 작업만 실행하는 실기기 E2E 검증과 변경된 설정의 자동 복원 구현

**주요 성과**
- 2개 플러그인에서 자동 탐색한 기능 후보 **92개** 중 **19개** Agent operation을 계약화
- 실기기 E2E 검증 시나리오 **195개**로 검증 체계 구축
- Onboard·Approve·Integrate·Verify·E2E 5단계 workflow로 여러 플러그인에 재사용 가능한 연동 규격 정립

### Android 네이티브 AI Agent Runtime
**2026.05 ~ 현재** · 역할: **담당**(설계 방향은 정해져 있었고, 개발 범위를 전담) · Kotlin, Jetpack Compose, Hilt, Coroutines/Flow, Ktor, ObjectBox, WorkManager

사용자의 자연어 요청을 분석해 관련 플러그인을 찾고, 설치 확인·기능 탐색·실행 계획 생성·설정 적용까지 수행하는 Android 네이티브 Agent Runtime을 개발했습니다.

**수행업무**
- Agent Loop와 Conversation 상태 관리, 사용자 발화·플러그인 Skill을 결합한 실행 계획 수립과 Tool 호출 구조 구현
- Tool Registry, Policy, Executor 설계 및 구현
- 자연어 의도·함수·파라미터·제약·예시를 정의하는 Skill 규격과 Registry 개발 — **OpenHands SDK 분석 결과를 벤치마킹해 설계**(담당 범위)
- 플러그인별 capability를 조회한 뒤 지원되는 값만 적용하는 Tool 계약 설계
- 복수 Tool 실행과 사용자 승인 흐름, Tool 실행 취소 및 상태 복원 구현
- 플러그인 탐색·설치 유도, ContentProvider 기반 기능 호출, Backend Tool Runner 및 Manual Search Tool 개발
- Agent 실행 상태 Chat UI 표시, Runtime 로깅·오류 분석 환경 구축

**주요 성과**
- Built-in Tool **8개**, 플러그인 Skill(SKILL.md) **34개** 정의
- 단위 테스트 **21개 파일 · 200개 케이스** 작성
- 런처 플러그인 생태계 **7종** 대상 연동 POC 및 검증
- 2개 모델 비교 시 의도한 플러그인 실행 성공률을 **75% → 100%**로 개선(정량 비교 시나리오 4건 기준 — 해당 비교의 범위에 한정된 결과)

### 자연어 기반 생성형 앱 플랫폼
**2026.02 ~ 2026.05** · 역할: **담당**(단, 하네스 엔지니어링 부분은 **참여**) · TypeScript, React Native, Expo, Expo Router, Zustand, TanStack Query, Kotlin, WorkManager

사용자가 자연어로 필요한 앱을 요청하면 AI가 기획·테마·React Native 코드를 생성하고, 모바일에서 즉시 미리보기·수정·저장·공유할 수 있는 플랫폼을 개발했습니다.

**수행업무**
- 요구사항 분석 → Plan·Theme 승인 → 생성·수정으로 이어지는 대화형 앱 제작 흐름 구현
- 생성된 JavaScript bundle·asset을 동적 실행하는 App Player 개발, SSE 기반 진행 상태 표시·중단 복구 처리
- React Native ↔ Android Native Module 구현, 홈 화면·Shortcut 기능 개발
- 생성 앱 저장·복원·다운로드와 버전별 수정·롤백 흐름 구현
- Rule → 분류 모델 → LLM을 단계적으로 적용하는 Safety Filter 설계 및 검증
- OpenHands SDK와 Expo Skill을 활용한 앱 생성·수정 방식 분석 및 POC
- REST API Client와 도메인별 Query 구조 개발, 인증·백엔드 API 계약 변경 대응, 앱 상세·Explore·Admin Review 화면 및 다국어 UI·테스트 코드 개발
- Agent 개발 규칙·아키텍처 불변 조건·검증 루프를 포함한 하네스 엔지니어링 실무에 참여

**주요 성과**
- Safety Filter: 악성·정상 각 100건, 총 **200건** 평가 corpus로 Block 정확도 **99.9% 이상** 확인
- 모델 비교: 2개 모델(Gemini 계열) × 앱 2종 × 각 3회, 총 **12회** 벤치마크로 평균 생성 시간 **52초(약 24.9%) 단축**, 구현 단계 토큰 **26.7%**·비용 **12.4%** 절감 기준 도출
- 경쟁 서비스 **5종** 비교 분석

### AI 기능 사용 데이터 수집·분석 시스템 (Android 영역)
**2025.10 ~ 2025.12** · 역할: **담당** · Kotlin, Android Glance, MVVM, Coroutines/Flow, Room, DataStore, Ktor

사내 사용성 테스트 과정에서 AI 기능의 사용 데이터를 개인정보 동의 하에 수집·분석하는 시스템의 Android 영역을 개발했습니다. 사용자가 수집 상태를 직접 확인하고 전송 데이터를 선택할 수 있도록 Glance 기반 Privacy Display Widget과 Secure Log Viewer를 구현했고, 일반 로그와 보안 로그를 분리하는 이벤트 모델·SDK 구조 개선, Agent·ContentProvider 연동을 담당했습니다.

### LLM 생성 정보의 Widget 표현 (POC)
**2025.09 ~ 2026.03** · 역할: **주도** · Kotlin, Android Glance, ProtoLayout, LLM API

LLM이 생성한 정보를 Android Widget으로 표현하는 방식을 Glance·ProtoLayout 기반 POC로 검증했습니다. LLM 출력과 Widget UI를 연결하는 동적 구성 구조를 설계했습니다.

### FlipShot — 폴더블 커버 디스플레이 콘텐츠 편집 기능
**2025.07 ~ 2025.09** · 역할: **참여** · Kotlin, Jetpack Compose, ViewModel, Coroutines/Flow

Flip 5·6·7 3개 세대(One UI 7.0부터 지원, One UI 7·8 코드라인 대응)를 대상으로 커버 디스플레이에 사진·영상·문구·스티커를 표시하는 기능 중 편집 화면과 카메라·외부 디스플레이 연동, 비정상 종료 복구 일부를 담당했습니다. MVI 기반 데이터 흐름과 ContentProvider 기반 외부 제어 API 설계에 참여하고, 앱 재설치 시 발생하는 생명주기 이슈를 해결했습니다.

### GalaxyToShare — 설정 공유·복원 Android 앱
**2024.03 ~ 2025** · 역할: **담당** · Kotlin, MVVM, Hilt, Coroutines/Flow, Retrofit, Room, Navigation Component

사용자의 단말 환경 설정을 하나의 콘텐츠로 저장하고 다른 단말에 공유·복원하는 앱을 개발했습니다. 콘텐츠 탐색·생성·공유·적용 화면과 Routine Action·Widget 연동, 적용 전 상태를 저장해 원래대로 복원하는 안전장치를 구현했습니다.

### Routine 프리셋 갤러리
**2024.03 ~ 2025** · 역할: **주도** · Kotlin, MVVM, Hilt, Coroutines/Flow, Retrofit, Room, Intent/FileProvider

사용자가 Routine 프리셋을 탐색·적용하고 직접 만든 Routine을 공유할 수 있는 기능 구조를 직접 설계·개발했습니다. 메인·상세·공유 화면과 좋아요·실시간 갱신 동기화, 단말·OS·국가 조건별 노출 처리를 구현하고 3차 검증까지 대응했습니다.

### 온디바이스 AI 기능 검증 자동화 도구
**2024.02 ~ 2025.01** · 역할: **담당** · Python, PyQt5, ADB, Requests, openpyxl, Jinja2, OpenCV

네이티브 앱의 온디바이스 AI 기능을 로컬 PC와 연결 단말에서 반복 검증할 수 있도록 독립 GUI 도구를 개발했습니다. 테스트 실행부터 평가·리포트 생성까지 전 과정을 자동화한, 사실상의 AI 기능 벤치마크 하네스입니다.

**수행업무**
- Python 기반 온디바이스 AI 검증 GUI 설계·개발, 공용 저장소와 로컬 테스트케이스를 함께 사용하는 검증 구조 구성
- ADB instrumentation 테스트 자동 실행, 복수 단말 대상 테스트 분배 및 실행 상태 관리
- 테스트 데이터·Ground Truth 연동, 결과 후처리와 점수 계산 구현
- HTML·Excel 리포트 자동 생성, 기능·언어·모델·단말별 결과 조회와 검색·내보내기 기능 개발

**주요 성과**
- 온디바이스 AI 기능 **4종**(스마트 답장, 텍스트 선택 기반 AI, 텍스트 분류, 이미지 설명) 검증 지원
- Windows·Linux·macOS **3개 환경** × Main·Dev·Local **3개 테스트 모드** 배포 자동화
- 결과·대기 화면 최대 **300개** 관리

### 생성형 AI 프롬프트 개발·검증 웹 플랫폼
**2023.12 ~ 2025** · 역할: **담당** · TypeScript, React, Redux Toolkit, Redux-Saga, MUI, REST API, SSE, Jest

생성형 AI 모델과 프롬프트를 개발·검증하고, 테스트케이스 실행부터 AI 평가와 결과 공유까지 지원하는 사내 웹 플랫폼을 개발했습니다.

- LLM 기반 결과 평가와 CSV·Excel 출력 기능 개발
- Prompt 작성·리뷰·배포 및 Gemini·GPT·Claude 등 **3개 모델 계열** 비교 기능 구현
- 개인·공용 테스트 공간과 로컬·Git 기반 테스트케이스 실행 흐름 개발
- 텍스트·이미지·오디오 **3종** 입력 기반 멀티모달 기능 개발, 모델 파라미터·Safety 설정과 Quick 테스트 화면 개편
- 기존 JavaScript 코드를 TypeScript 중심으로 전환·리팩토링, Prompt 저장 구조를 key 기반으로 개선

### 게임 서비스 로그 분석 파이프라인
**2022.10 ~ 2023.05** · 역할: **참여**(동료 개발자와 함께 개발) · Python, Apache Airflow, PySpark, AWS MWAA/EMR/S3/Athena/Glue, GitHub Actions, MLflow

게임 서비스에서 수집되는 대규모 로그를 S3·EMR·Athena 기반 분석 데이터로 변환하는 Airflow 파이프라인을 동료 개발자와 함께 개발하고 DEV·PRD 환경의 배포와 운영을 담당했습니다.

**수행업무**
- GET·POST API 등 최소 3개 영역의 게임 로그 수집·전처리 Airflow DAG 개발·운영, PySpark·EMR 기반 로그 정제·통합 및 Parquet 변환(dt 단위 일일 처리 규모 약 5.7TB)
- 외부 성능 측정 툴 연동 데이터 이관 시 약 10만 건 데이터 처리를 자동화, 개인정보 컬럼 3개 제거·정제
- S3 데이터 적재와 Athena·Glue Catalog 테이블·파티션 관리
- PRD·DEV 중복 파이프라인 통합 및 S3 Marking File 기반 동기화 구조 구현, GitHub Actions 기반 배포 자동화
- Airflow 2 환경의 SubDAG을 TaskGroup으로 전환해 DAG 구조와 실행 안정성 개선
- Schema 변경, 개인정보 필드 제거 및 클라이언트·서버 간 데이터 버전 대응, 파이프라인 장애 원인 분석과 운영 복구

**주요 성과**
- DEV 환경의 중복 EMR 작업을 제거해 월 약 **270시간**의 EMR 실행 시간 절감(월 약 **$7,917.4** 절감)
- 데이터 저장 구조 개선으로 일일 약 **2.1TB**, 월 약 **77TB**의 S3 사용량 절감(월 약 **$1,425** 절감)
- GDPR 관련 일일 처리 시간을 **1,103분 → 630분**으로 약 **42%** 단축

### 단말 성능 데이터 이관·정제 파이프라인
**2022.10 ~ 2023.05** · 역할: **담당** · Python, Apache Airflow, PySpark, AWS RDS/S3/EMR/Glue

출시 전 단말의 성능 데이터를 분석 환경에서 안전하게 활용할 수 있도록 데이터 이관 및 개인정보 정제 파이프라인을 개발했습니다.

- 최신 RDS Snapshot 조회부터 S3 Export까지의 Airflow DAG 개발, PRD → DEV 계정 Cross-account S3 전송 구조 구현
- 개인정보 포함 테이블을 전송 단계에서 제외하는 필터링 기능 및 PySpark 기반 개인정보 컬럼 제거·Parquet 재생성 구현
- 원본 보존 후 정제 데이터를 교체하는 장애 안전형 데이터 갱신 절차 설계
- Glue Crawler 기반 Catalog 등록 자동화와 Airflow Sensor 기반 상태 확인·후속 작업 제어

### 입문 교육 및 CXI실 파견
**2021.09 ~ 2022.09**

입사 후 사내 입문 교육과 개발자 교육 과정을 이수했고, 이후 CXI실에 파견되어 갤럭시 고객경험 관련 마케팅 업무를 그 기간 동안 수행했습니다.

---

## 개인 프로젝트

### Daeng — 트렌드 콘텐츠 서비스 (2026.07 ~ 현재)
Claude Code와 Codex를 병행해 개발 중인 개인 프로젝트. 도구를 사용하는 데 그치지 않고, 에이전트가 실제로 어긋나는 지점을 관측해 지침·정책·검증 계층으로 교정해 왔습니다. pnpm 모노레포, 약 5주간 434커밋.

- 에이전트 지침을 계층형으로 설계 — 루트 지침에 저장소 전역 계약만 두고 패키지별 스코프 지침 5개로 분리, 충돌 시 최근접 파일 우선 규칙 명시. `CLAUDE.md`를 `AGENTS.md` 심볼릭 링크로 구성해 Claude Code와 Codex에 동일 규칙을 단일 소스로 주입
- 지침 자체를 설계 대상으로 다뤄 재구조화 스펙을 작성·적용 — 매 세션 수천 줄의 무관한 컨텍스트를 로드하던 필수 독서 목록, 규칙 간 모순, 정적 정책과 진행 상태 혼재를 해소하고 안정 규칙과 가변 진행 상태를 분리
- 병렬 에이전트 실행 가드 구현 — 여러 에이전트가 같은 clone을 공유할 때 주 워크트리의 브랜치 전환이 다른 세션의 HEAD를 오염시키는 문제를, 워크트리 헬퍼 스크립트와 post-checkout 훅으로 계층화. 프롬프트 지시만으로는 강제되지 않는 규칙을 기계적 계층으로 이전한 사례
- 326개 항목의 Tool 실행 허용 정책 구성, 외부 Skill을 소스 저장소·경로·SHA-256 해시로 고정하는 lock 기반 공급망 관리
- spec → plan → task brief → 실행 → 리포트 → 리뷰 diff로 닫히는 검증 루프 운영(스펙 49건, 플랜 53건). 수행한 검사와 생략한 검사를 반드시 보고하게 해 완료 선언의 신뢰성 확보
- 제품 파이프라인에서 Claude를 subprocess로 호출해 트렌드 스크리닝·추출·판정 수행. 실제 스케줄 실행 장애(깨진 JSON 반환)를 근거로 JSON 파싱 재시도와 프로세스 재시도의 예산을 분리하고, 호출당 수 분의 비용 특성을 반영해 백오프 전략을 선택. 단위 테스트로 고정

기술 스택: TypeScript, pnpm workspace, React Native/Expo, Supabase(RLS), Vitest, Claude Code, Codex, MCP

(상세: [실전 하네스 엔지니어링](/reports/agent-harness-in-practice))

---

## 기술 스택

| 구분 | 내용 |
|---|---|
| Agent / LLM | Agent Loop·Tool Registry·Policy·Executor 설계, Skill 규격, Tool 계약, Safety Filter, LLM API, OpenHands SDK, Claude Code, Codex, MCP, MLflow |
| Android | Kotlin, Jetpack Compose, Glance, ProtoLayout, MVVM/MVI, Hilt, Coroutines/Flow, Room, DataStore, ObjectBox, WorkManager, Retrofit, Ktor, ContentProvider, Navigation Component |
| Web / Cross-platform | TypeScript, React, React Native, Expo, Expo Router, Redux Toolkit, Redux-Saga, Zustand, TanStack Query, MUI |
| Python | PyQt5, PySpark, Requests, openpyxl, Jinja2, OpenCV |
| Data / Cloud | Apache Airflow(MWAA), AWS EMR·S3·Athena·Glue·RDS, Supabase, Parquet |
| 검증 / 도구 | ADB, Android Instrumentation, Jest, Vitest, GitHub Actions, YAML/JSON Schema, Java, CLI |

---

## 학력 및 자격

- 울산대학교 IT융합학부 (전산/컴퓨터) 학사 · 2015.03 ~ 2021.02
- 정보처리기사 (2020.08)
- TOEIC 645 / TOEIC Speaking Level 6 (2020~2021)
- 삼성 청년 SW 아카데미(SSAFY) 수료 (2021)
- POSCO 청년 AI-Bigdata 아카데미 수료 · 프로젝트 최우수상 (2020)
