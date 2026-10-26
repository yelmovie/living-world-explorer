# 삭제 전 확인할 후보

실제로 지운 파일은 없어요. 아래 파일은 배포 폴더(`public/`)나 빌드 대상(`src/`)에서 빼서 여기로 옮겼어요. 필요 없다고 확인되면 사용자가 직접 지워요.

## 2026-10-26 — 3D 모형 줄이기 방식 교체

| 파일 | 옮긴 근거 |
|---|---|
| public-assets-20261026/libs-draco/ (디코더 3개 + LICENSE-NOTE) | 모형을 meshopt 압축으로 바꿔 Draco 디코더를 더 이상 불러오지 않음. 코드 참조 없음 |
| scripts-20261026/shrink-glb.py, pack-glb.py, glb-sheet.mjs | 블렌더 정점 병합 + Decimate가 UV 이음매를 가로질러 텍스처가 조각나 보인 옛 방식. 지금은 scripts/pack-models.mjs |

루트에 다시 들어온 `Meshy_AI_*.glb` 4개(약 320MB)는 `assets/generated/models-20261025/*-meshy.glb`와 SHA-256이 같아서 휴지통으로 보냈어요(복원 가능).

## 2026-10-25 — `_unused/public-assets-20261025/`

| 파일 | 크기 | 옮긴 근거 |
|---|---:|---|
| exploration-map.webp | 547,360 bytes | 현재 지도는 `public/assets/map/terrain.webp`(옛 v3). 코드 참조 없음 |
| map-terrain-v2.webp | 487,130 bytes | v3의 생성 참조 원본. 코드 참조 없음 |
| bacteria-green-20261025.webp | 29,698 bytes | 2026-10-26 염색 색(보라·자주)으로 바꾼 새 `study/bacteria.webp`의 이전 초록 그림. 원본 PNG는 assets/generated/study-20261025b/bacteria.png에 그대로 있음 |
| bacteria-20261024.webp | 35,596 bytes | 저녁에 공·막대·나선·꼬리 모양이 들어간 새 `study/bacteria.webp`로 교체한 이전 세균 그림. 코드 참조 없음 |
| map-moa-left.webp | 11,136 bytes | `map-moa-right.webp`와 SHA-256 동일. 현재 왼쪽은 옛 left-v2(`map/moa-left.webp`) |

## 2026-10-25 — `_unused/src-20261025/` (옛 화면 흐름 코드)

모든 스테이지 경로가 `inquiryScene`(새 20탐구 흐름)으로 가서, 아래 코드는 어디서도 부르지 않았어요. 빌드 결과에도 들어가지 않았어요.

| 파일 | 근거 |
|---|---|
| scenes/investigate.ts, evidence-view.ts, demo.ts, renderers/lab3d.ts | import 0 (lab3d는 Three.js를 쓰던 유일한 파일) |
| renderers/field2d.ts, renderers/exploration.ts | 아래 옛 함수에서만 동적 import |
| scenes/observe.ts, scenes/solution.ts (원본 통째) | `src/`에는 지금 쓰는 `layout`·`footer`·`core`만 남김. 옛 `field`·`microscope`·`sampling`·`protists`·`assembly`·`runScene`은 여기 원본에 있음 |

판단 보류: `src/evaluate.ts`의 옛 draft 판정과 `src/storage.ts`의 draft 복구는 `tests/domain.test.ts`가 쓰고, 예전 저장 기록을 읽을 때 필요할 수 있어서 남겼어요.

