# 섹션 배경 밴드 (경력/Contact) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 경력 섹션과 Contact 섹션에 뷰포트 전체 폭(full-bleed)의 배경 밴드를 추가해, 매우 긴 단일 스크롤 페이지에 섹션 구간이 시각적으로 드러나게 한다.

**Architecture:** `global.css`에 `--bg` < `--bg-section` < `--bg-elevated` 3단 명도 토큰을 만들고, `index.astro`의 경력/Contact 마크업을 `<section class="... full-bleed">` + `<div class="full-bleed-inner">` 2겹 구조로 감싼다. 바깥 요소가 `width:100vw` 음수 마진으로 뷰포트 끝까지 배경을 채우고, 안쪽 div가 기존과 동일하게 `max-width:72ch` 중앙 정렬 콘텐츠를 담당한다.

**Tech Stack:** Astro 7, 순수 CSS (프레임워크 없음), 기존 GSAP/Lenis 스크립트는 변경 없음.

## Global Constraints

- 색상(hue)은 바꾸지 않는다 — teal 단색 accent, 다크 전용(`color-scheme: dark`) 유지.
- `--bg-section`은 하드코딩 hex가 아니라 `color-mix(in srgb, var(--bg-elevated) 55%, var(--bg))`로 파생시킨다 (스펙 결정 사항).
- 경력 섹션 밴드는 `--bg-elevated`가 아니라 `--bg-section`을 쓴다 (career-item 카드가 `--bg-elevated`를 쓰므로 같은 톤이면 카드가 밴드에 파묻힘).
- Contact 밴드는 `--bg-elevated`를 그대로 쓴다 (카드가 없는 섹션이라 재사용해도 충돌 없음).
- Hero, 배경(교육), 기술 스택 섹션은 변경하지 않는다 (`--bg` 그대로).
- 기존 GSAP reveal(`[data-reveal]`), 퀵네비 앵커(`#career`, `#contact`), 스탯 카운트업 애니메이션 동작을 깨뜨리지 않는다.
- 대상 레포: `~/Project/m0vehyeon.github.io` (git, `main` 브랜치). 변경 파일은 `src/styles/global.css`, `src/pages/index.astro` 두 개뿐.

---

### Task 1: 경력 섹션 full-bleed 배경 밴드

**Files:**
- Modify: `src/styles/global.css:4` (토큰 추가)
- Modify: `src/pages/index.astro:359-411` (마크업 — 경력 섹션에 wrapper div 추가)
- Modify: `src/pages/index.astro` `<style>` 블록 — `section`/`.section-sub` 규칙 뒤 (현재 파일 기준 약 528-540줄) — `.full-bleed`/`.full-bleed-inner`/`.career.full-bleed` 규칙 추가

**Interfaces:**
- Produces: CSS 커스텀 프로퍼티 `--bg-section` (Task 2도 이 값을 참조 가능하지만 Task 2는 `--bg-elevated`를 쓰므로 실제로는 재사용하지 않음)
- Produces: 재사용 가능한 유틸리티 클래스 `.full-bleed`, `.full-bleed-inner` — Task 2가 그대로 재사용

- [ ] **Step 1: `global.css`에 `--bg-section` 토큰 추가**

`src/styles/global.css`의 `:root` 블록에서 `--bg-elevated: #10161f;` 다음 줄에 추가:

```css
:root {
  color-scheme: dark;
  --bg: #0a0e14;
  --bg-elevated: #10161f;
  --bg-section: color-mix(in srgb, var(--bg-elevated) 55%, var(--bg));
  --fg: #e6edf3;
  /* ... 나머지 기존 변수 그대로 ... */
}
```

- [ ] **Step 2: 경력 섹션 마크업에 `full-bleed-inner` wrapper 추가**

`src/pages/index.astro`에서 경력 `<section>`을 찾는다 (현재 `<section id="career" class="career" data-reveal aria-labelledby="career-h">`로 시작해 `</section>`으로 끝나는 블록, 대략 359~411줄). 여는 태그에 `full-bleed` 클래스를 추가하고, 그 안의 `<h2>`, `<p class="career-note">`, `<ol class="career-list">` 세 요소 전체를 `<div class="full-bleed-inner">`로 감싼다.

변경 전:
```astro
    <section id="career" class="career" data-reveal aria-labelledby="career-h">
      <h2 id="career-h">경력 <span class="section-sub">삼성전자 MX사업부 · 2021.09 – 현재 (약 5년)</span></h2>
      <p class="career-note">
        미출시·사내 전용 프로젝트는 코드네임 대신 일반명으로 표기했습니다. 최신순입니다.
      </p>
      <ol class="career-list">
        {
          career.map((p) => (
            <li>
              ...
            </li>
          ))
        }
      </ol>
    </section>
```

변경 후:
```astro
    <section id="career" class="career full-bleed" data-reveal aria-labelledby="career-h">
      <div class="full-bleed-inner">
        <h2 id="career-h">경력 <span class="section-sub">삼성전자 MX사업부 · 2021.09 – 현재 (약 5년)</span></h2>
        <p class="career-note">
          미출시·사내 전용 프로젝트는 코드네임 대신 일반명으로 표기했습니다. 최신순입니다.
        </p>
        <ol class="career-list">
          {
            career.map((p) => (
              <li>
                ...
              </li>
            ))
          }
        </ol>
      </div>
    </section>
```

`career.map(...)` 내부 JSX는 손대지 않는다 — 들여쓰기만 한 단계 더 들어가면 된다.

- [ ] **Step 3: `.full-bleed` / `.full-bleed-inner` / `.career.full-bleed` CSS 규칙 추가**

`<style>` 블록에서 아래 규칙을 찾는다:

```css
  section {
    margin-bottom: 3.5rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
    scroll-margin-top: 4rem;
  }
  section h2 {
    font-size: 1.2rem;
    margin: 0 0 1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.6rem;
  }
  .section-sub {
    font-size: 0.85rem;
    font-weight: 400;
    color: var(--fg-muted);
  }
```

이 블록 바로 뒤에 다음 규칙을 추가한다:

```css
  .full-bleed {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
  }
  .full-bleed-inner {
    max-width: 72ch;
    margin: 0 auto;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
  .career.full-bleed {
    background: var(--bg-section);
  }
```

기존 `section { margin-bottom, padding-top, border-top, scroll-margin-top }` 규칙은 그대로 둔다 — `.career`는 여전히 `<section>` 요소이므로 세로 여백·구분선은 변경 없이 적용된다. 가로 패딩(`1.25rem`)만 이제 `main`이 아니라 `.full-bleed-inner`가 담당한다는 점이 유일한 구조 변화다.

- [ ] **Step 4: 빌드 확인**

```bash
cd ~/Project/m0vehyeon.github.io && pnpm build
```

Expected: 에러 없이 빌드 성공 (Astro 마크업이 깨지지 않았는지 — 특히 열고 닫은 `<div>` 짝이 맞는지 — 확인하는 용도).

- [ ] **Step 5: 개발 서버로 데스크톱 시각 확인**

```bash
cd ~/Project/m0vehyeon.github.io && pnpm dev
```

브라우저로 `http://localhost:4321/`을 열고(뷰포트 약 1440px), 경력 섹션까지 스크롤해서 다음을 확인한다:
- 경력 섹션 배경이 페이지 기본 배경(`--bg`, 짙은 남색 계열)보다 눈에 띄게(하지만 과하지 않게) 밝은지
- 경력 섹션 배경이 뷰포트 좌우 끝까지 채워지는지 (콘텐츠는 여전히 중앙 72ch 폭)
- 경력 섹션 안의 career-item 카드(`--bg-elevated`)가 밴드 배경 위에서 기존과 동일하게 또렷이 구분되는지 — 카드가 배경에 묻혀 보이면 Step 1의 `--bg-section` mix 비율(현재 55%)을 낮춰서 밴드를 더 어둡게 조정
- 경력 섹션 상단 구분선(`border-top`)이 이제 뷰포트 전체 폭으로 그어지는지 (의도된 동작)

- [ ] **Step 6: Commit**

```bash
cd ~/Project/m0vehyeon.github.io
git add src/styles/global.css src/pages/index.astro
git commit -m "$(cat <<'EOF'
style: add full-bleed background band to career section

Introduces a --bg-section token (a tone between --bg and --bg-elevated)
so the career section reads as a distinct zone on the long single-scroll
page, without the career-item cards blending into the new band.
EOF
)"
```

---

### Task 2: Contact 섹션 full-bleed 배경 밴드

**Files:**
- Modify: `src/pages/index.astro:431-433` (마크업)
- Modify: `src/pages/index.astro` `<style>` 블록의 `.contact` 규칙 (현재 파일 기준 약 758-772줄)

**Interfaces:**
- Consumes: Task 1에서 만든 `.full-bleed`, `.full-bleed-inner` 유틸리티 클래스 (그대로 재사용, 추가 정의 불필요)

- [ ] **Step 1: Contact 마크업에 `full-bleed-inner` wrapper 추가**

`src/pages/index.astro`에서 Contact footer를 찾는다:

변경 전:
```astro
    <footer id="contact" class="contact" data-reveal>
      <a href="mailto:ehdgus4166@gmail.com">ehdgus4166@gmail.com</a>
    </footer>
```

변경 후:
```astro
    <footer id="contact" class="contact full-bleed" data-reveal>
      <div class="full-bleed-inner contact-inner">
        <a href="mailto:ehdgus4166@gmail.com">ehdgus4166@gmail.com</a>
      </div>
    </footer>
```

- [ ] **Step 2: `.contact` CSS 규칙을 밴드용 outer + flex용 inner로 분리**

`<style>` 블록에서 아래 규칙을 찾는다:

```css
  .contact {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    font-size: 0.9rem;
    color: var(--fg-muted);
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }
  .contact a {
    color: var(--fg-muted);
  }
  .contact a:hover {
    color: var(--link);
  }
```

다음으로 교체한다:

```css
  .contact {
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }
  .contact.full-bleed {
    background: var(--bg-elevated);
  }
  .contact-inner {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    font-size: 0.9rem;
    color: var(--fg-muted);
  }
  .contact-inner a {
    color: var(--fg-muted);
  }
  .contact-inner a:hover {
    color: var(--link);
  }
```

(`display: flex`, `gap`, `align-items`, `font-size`, `color`는 콘텐츠 정렬용이라 `.full-bleed-inner` 폭 안에서 동작해야 하므로 `.contact-inner`로 옮기고, `padding-top`/`border-top`/신규 `background`는 밴드 자체의 속성이라 바깥 `.contact`에 남긴다.)

- [ ] **Step 3: 빌드 확인**

```bash
cd ~/Project/m0vehyeon.github.io && pnpm build
```

Expected: 에러 없이 빌드 성공.

- [ ] **Step 4: 개발 서버로 데스크톱 시각 확인**

`pnpm dev`가 이미 떠 있지 않다면 실행하고, `http://localhost:4321/`에서 페이지 맨 아래 Contact까지 스크롤해서 확인한다:
- Contact 밴드가 경력 밴드보다 한 단계 더 밝은지 (`--bg-elevated`는 `--bg-section`보다 밝은 톤)
- 이메일 링크가 여전히 기존과 동일하게 가운데 정렬(72ch 폭 기준)로 보이는지, hover 색상 변화(`--link`)가 그대로 동작하는지

- [ ] **Step 5: Commit**

```bash
cd ~/Project/m0vehyeon.github.io
git add src/pages/index.astro
git commit -m "$(cat <<'EOF'
style: add full-bleed background band to contact footer

Reuses the .full-bleed/.full-bleed-inner utility from the career section
change. Contact uses --bg-elevated directly since it has no nested cards
to lose contrast against.
EOF
)"
```

---

### Task 3: 교차 뷰포트 회귀 검증

**Files:** 없음 (검증 전용 태스크, 코드 변경 없음)

**Interfaces:**
- Consumes: Task 1, 2에서 완성된 경력/Contact 밴드

- [ ] **Step 1: 모바일 폭(375px)에서 가로 스크롤 여부 수치로 확인**

`pnpm dev`가 떠 있는 상태에서 브라우저 창(또는 `mcp__claude-in-chrome__resize_window`)을 375px 폭으로 맞추고, 페이지를 열어 브라우저 콘솔에서 다음을 실행한다 (`mcp__claude-in-chrome__javascript_tool` 사용 가능하면 그걸로):

```javascript
document.documentElement.scrollWidth - window.innerWidth
```

Expected: `0` (또는 스크롤바 폭 이내의 아주 작은 값). 0보다 확연히 크면 가로 스크롤이 생긴 것 — `body { overflow-x: hidden; }`이 `src/styles/global.css`에 이미 있으므로 스크롤 자체는 안 생기지만, 혹시 그 규칙이 사라졌거나 다른 요소가 `overflow-x: hidden`의 클리핑 조상 바깥에 있다면 이 단계에서 걸러진다.

- [ ] **Step 2: 375px 폭에서 경력/Contact 밴드 육안 확인**

경력 섹션과 Contact 섹션까지 스크롤해서, 밴드가 좁은 화면에서도 뷰포트 끝까지 채워지는지, career-item 카드 안 텍스트가 잘리거나 밴드 여백이 데스크톱과 크게 다르게 보이지 않는지 확인한다.

- [ ] **Step 3: 기존 애니메이션 회귀 확인**

1440px 폭으로 되돌리고 페이지를 새로고침한 뒤 처음부터 천천히 스크롤하며 확인한다:
- Hero → 배경 → 경력 → 기술 스택 → Contact 각 섹션이 스크롤 진입 시 fade-in되는 GSAP reveal 애니메이션(`[data-reveal]`)이 기존과 동일하게 동작하는지
- 상단 퀵네비 pill의 `배경`/`경력`/`기술 스택`/`Contact` 링크를 각각 클릭했을 때 해당 섹션으로 정확히 스크롤 이동하는지 (`#career`, `#contact` id가 여전히 outer `<section>`/`<footer>`에 있으므로 정상 동작해야 함)
- 경력 섹션의 스탯 카운트업 애니메이션(예: `19/92`, `195개` 등 숫자가 0에서 목표값까지 올라가는 효과)이 기존과 동일하게 동작하는지

- [ ] **Step 4: 정리**

이 태스크는 코드 변경이 없으므로 커밋하지 않는다. Step 1~3에서 문제를 발견했다면 Task 1 또는 Task 2로 돌아가 수정하고 다시 커밋한다.
