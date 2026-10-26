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
| `study/` | 학습용 관찰 모형·조사 그림. 시간 비교는 `bread-0~3`, `leaf-0~3`. 확대 단계는 `*-lens`(돋보기)·`mushroom-spores`(현미경), 세균 세 모양 카드는 `bacteria-{round,rod,spiral}` |
| `models/` | 선택해서 여는 3D 설명 모형(GLB, meshopt 압축 — 디코더는 three.js 묶음에 들어 있음). 원본·설정 기록은 `assets/generated/models-20261025.json` |
| `ui/` | 로고, 앱 아이콘, 탐구 장면 소품 |

## 3D 모형 넣는 순서 (2026-10-26 고침)

1. 받은 Meshy GLB는 루트가 아니라 `assets/generated/models-<날짜>/<이름>-meshy.glb`로 옮긴다(Git 제외). 같은 파일을 다시 받았으면 SHA-256을 비교해 중복은 지운다.
2. `scripts/pack-models.mjs`의 `models` 표에 이름·텍스처 크기·오차 한도를 넣고 `node scripts/pack-models.mjs <이름>`을 실행한다. 텍스처를 줄인 뒤 gltfpack이 **UV 이음매를 고정한 채** 줄이고 meshopt로 압축해 `public/assets/models/<이름>.glb`에 쓴다.
3. 원본과 같은 각도로, **확대해서**(갓 아래·바닥·옆면) 비교한다. 전체 크기에서는 안 보이던 텍스처 조각·검은 선이 확대하면 보인다. 검은 선이 보이면 오차 한도(`error`)를 낮춘다.
4. 블렌더 Decimate(정점 병합 + collapse)는 쓰지 않는다. UV 이음매를 가로질러 줄여 텍스처가 조각나 보였다(2026-10-25 판, 옛 스크립트는 `_unused/scripts-20261026/`).

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
