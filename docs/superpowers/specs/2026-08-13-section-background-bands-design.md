# 섹션 배경 밴드로 스크롤 리듬 만들기

## 배경

`cdg-portfolio.com`, `min-hyuk.com`, `junheedot.com` 세 포트폴리오와 현재 사이트(`m0vehyeon.github.io`)를 비교한 결과, 현재 사이트는 정량 성과 밀도는 더 강하지만 Hero → 배경 → 경력 → 기술 스택 → Contact 전 구간이 동일한 `--bg` 위에서 이어져서, 매우 긴 단일 스크롤(경력만 12개 항목)이 시각적으로 끊기지 않고 늘어져 보인다.

비교 대상 중 `cdg-portfolio.com`은 섹션마다 배경색을 통째로 바꾸는(흰색/노랑/검정) 방식을 쓰지만, 현재 사이트는 `color-scheme: dark` 고정 + teal 단색 accent의 절제된 에디토리얼 톤이라 그 방식은 브랜드 톤과 맞지 않는다고 판단.

같은 논의에서 다음 항목은 **범위 밖으로 확정**:
- 히어로 직후 하이라이트 스탯 스트립 추가 (거부)
- 개인 프로젝트를 경력 타임라인에서 별도 섹션으로 분리 (거부)
- 오래된 경력 항목 접기/펼치기 기능 (섹션 배경 구분 쪽을 선택하면서 자연 제외)

## 결정 사항

- **강도**: 은은하게. 인접 섹션끼리만 명도 차이가 나는 정도, 색상(hue)은 안 바꾼다.
- **패턴**: Hero(`--bg`) → 배경(`--bg`, 변화 없음) → 경력(살짝 밝은 톤) → 기술 스택(`--bg`, 변화 없음) → Contact(경력보다 한 단계 더 밝은 톤).
- 기술 스택 섹션을 다시 `--bg`로 되돌리는 이유: 경력 밴드 직후 명도가 원래대로 복귀하면서 그 자체로 구간 경계가 한 번 더 강조됨.

## 색 토큰

기존 코드베이스는 하드코딩 색 대신 `color-mix()`로 파생색을 만드는 패턴을 이미 쓰고 있음(`--accent-soft`, hero 텍스처 등). 같은 방식을 따른다.

```css
:root {
  /* 기존 */
  --bg: #0a0e14;
  --bg-elevated: #10161f;

  /* 신규 — bg와 bg-elevated 사이 중간 톤 */
  --bg-section: color-mix(in srgb, var(--bg-elevated) 55%, var(--bg));
}
```

3단 명도 램프: `--bg` < `--bg-section` < `--bg-elevated`.

## 섹션별 적용

| 섹션 | 밴드 배경 | 비고 |
|---|---|---|
| Hero | `--bg` | 변화 없음 |
| 배경 (교육/입사 전) | `--bg` | 변화 없음. 이 섹션의 리스트 항목은 카드 스타일이 아니라 충돌 없음 |
| 경력 | `--bg-section` | career-item 카드(`--bg-elevated`)는 그대로 유지 — 밴드보다 한 단계 밝아서 밴드 위에서도 카드 경계가 또렷함 |
| 기술 스택 | `--bg` | 변화 없음. skill-card(`--bg-elevated`)는 원래 `--bg` 위에서도 잘 보였으므로 그대로 |
| Contact | `--bg-elevated` | 카드가 없는 섹션이라 카드용 토큰을 그대로 재사용해도 충돌 없음 |

핵심 제약: **경력 섹션의 카드 배경(`--bg-elevated`)과 섹션 자체의 밴드 배경이 같은 톤이면 카드가 밴드에 파묻힌다.** 이를 피하기 위해 경력 섹션 밴드는 `--bg-elevated`가 아니라 중간 톤인 `--bg-section`을 쓴다. (최초 논의에서 "경력·Contact 둘 다 --bg-elevated 톤"으로 뭉뚱그려 얘기했으나, 카드 유무 차이 때문에 실제 구현에서는 이렇게 나뉜다.)

## 구현 방식

밴드가 필요한 두 섹션(경력, Contact)만 뷰포트 전체 폭(full-bleed)으로 배경을 깔고, 안쪽 콘텐츠는 지금처럼 `max-width: 72ch` 중앙 정렬을 유지한다. Hero/배경/기술 스택은 구조 변경 없음.

```astro
<section id="career" class="career full-bleed" data-reveal aria-labelledby="career-h">
  <div class="full-bleed-inner">
    <!-- 기존 경력 섹션 내용 그대로 -->
  </div>
</section>
```

```css
.full-bleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
}
.career.full-bleed {
  background: var(--bg-section);
}
.contact.full-bleed {
  background: var(--bg-elevated);
}
.full-bleed-inner {
  max-width: 72ch;
  margin: 0 auto;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}
```

기존 `section { margin-bottom: 3.5rem; padding-top: 2rem; border-top: 1px solid var(--border); }` 규칙은 `.full-bleed-inner`로 옮기거나, 위아래 여백을 `.full-bleed` 자체에 옮겨서 지금과 동일한 수직 리듬을 유지한다 (밴드가 생겨도 섹션 간 간격 수치 자체는 안 바뀜).

`career`/`contact`에 이미 걸려 있는 `[data-reveal]` GSAP reveal 애니메이션은 attribute를 그대로 outer `<section>`에 유지하므로 영향 없음. 퀵네비(`#career`, `#contact` 앵커)도 id를 outer section에 유지하면 그대로 동작.

## 영향 범위

- `src/styles/global.css`: 토큰 1개 추가
- `src/pages/index.astro`: `<style>`에 `.full-bleed`, `.full-bleed-inner`, `.career.full-bleed`, `.contact.full-bleed` 규칙 추가, 경력/Contact 마크업에 래퍼 div 추가
- 다른 파일 변경 없음. `BaseLayout.astro`, GSAP 스크립트, 리포트 페이지는 이 변경과 무관

## 테스트 / 검증

- 데스크톱 폭(1440px 등)에서 경력/Contact 밴드가 뷰포트 끝까지 채워지는지, 안쪽 콘텐츠는 여전히 중앙 72ch로 정렬되는지 육안 확인
- 모바일 폭(375px)에서 가로 스크롤이 생기지 않는지 확인 (`width: 100vw` + 네거티브 마진 조합은 스크롤바 폭 때문에 가로 스크롤을 유발하는 흔한 버그이므로 특히 주의)
- 경력 섹션의 career-item 카드가 밴드 위에서 기존과 동일하게 또렷이 보이는지 (카드-밴드 명도 대비)
- 스크롤 시 GSAP reveal 페이드인, 퀵네비 앵커 이동, 스탯 카운트업 애니메이션이 기존과 동일하게 동작하는지
- 사이트가 다크 전용(`color-scheme: dark` 고정)이라 라이트 모드 검증은 해당 없음

## 범위 밖 (이번 작업에 포함 안 함)

- 하이라이트 스탯 스트립
- 개인/사이드 프로젝트 섹션 분리
- 경력 항목 접기/펼치기
- 색상(hue) 자체를 바꾸는 섹션 구분 (색은 전부 동일 teal 계열 유지)
