# 에셋 정리 규칙 (public/assets)

배포되는 파일만 둔다. 생성 원본은 `assets/generated/<묶음>-<날짜>/`, 안 쓰는 파일은 `_unused/`에 둔다.
파일명은 소문자와 하이픈만 쓰고 `-v2` 같은 판 번호를 붙이지 않는다. 새 판이 나오면 같은 이름으로 바꾸고 원본 기록은 `assets/generated/*.json`에 남긴다.

| 폴더 | 내용 |
|---|---|
| `audio/` | 효과음(`click.wav` 등, Kenney CC0)과 배경 음악(`bgm-main-theme.m4a`, `bgm-ending-theme.m4a`) |
| `characters/` | 모아·토토 초상과 전신 |
| `concepts/` | 스테이지 개념 영상·포스터·자막 |
| `fonts/` | Jua 웹폰트와 OFL 원문 |
| `map/` | 탐험 지도(`terrain.webp`), 지도 위 걷는 캐릭터 4방향 |
| `places/` | 연구 시설 배경(`fungi`·`water`·`archive`·`village`·`workshop`), 연구소(`greenhouse`), 복구된 코어(`core`) |
| `study/` | 학습용 관찰 모형·조사 그림. 시간 비교는 `bread-0~3`, `leaf-0~3` |
| `ui/` | 로고 |

## 2026-10-25 이름 대조표

이전 문서에 나오는 옛 이름은 아래 경로로 옮겼다.

| 옛 이름 | 지금 경로 |
|---|---|
| `specimen-{mushroom,mold,spirogyra,paramecium,moldy-fruit,dough-before,dough-after}.webp` | `study/{같은 이름}.webp` |
| `specimen-deadwood-v2.webp` | `study/deadwood.webp` |
| `study-bread.webp`, `specimen-bread-time-{1,2,3}-v2.webp` | `study/bread-{0,1,2,3}.webp` |
| `study-leaf.webp`, `specimen-leaf-time-{1,2,3}-v2.webp` | `study/leaf-{0,1,2,3}.webp` |
| `study-{bacteria,yogurt,milk,yeast,pond,soil}.webp` | `study/{같은 이름}.webp` |
| `study-core.webp` | `places/core.webp` |
| `greenhouse.webp`, `facility-{이름}.webp` | `places/greenhouse.webp`, `places/{이름}.webp` |
| `map-terrain-v3.webp` | `map/terrain.webp` |
| `map-moa-{down,right,up}.webp`, `map-moa-left-v2.webp` | `map/moa-{down,right,up,left}.webp` |
| `map-companion-{방향}.webp`, `map-generation.json` | `map/companion-{방향}.webp`, `map/generation.json` |
| `moa-portrait.webp` 등 캐릭터 4개 | `characters/{같은 이름}.webp` |
| `logo.webp` | `ui/logo.webp` |
| `exploration-map.webp`, `map-terrain-v2.webp`, `map-moa-left.webp` (안 씀) | `_unused/public-assets-20261025/` |
