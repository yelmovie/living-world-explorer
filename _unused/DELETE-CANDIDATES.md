# 삭제 전 확인할 후보

실제로 지운 파일은 없어요. 아래 파일은 배포 폴더(`public/`)에서 빼서 여기로 옮겼어요. 필요 없다고 확인되면 사용자가 직접 지워요.

## 2026-10-25 — `_unused/public-assets-20261025/`

| 파일 | 크기 | 옮긴 근거 |
|---|---:|---|
| exploration-map.webp | 547,360 bytes | 현재 지도는 `public/assets/map/terrain.webp`(옛 v3). 코드 참조 없음 |
| map-terrain-v2.webp | 487,130 bytes | v3의 생성 참조 원본. 코드 참조 없음 |
| map-moa-left.webp | 11,136 bytes | `map-moa-right.webp`와 SHA-256 동일. 현재 왼쪽은 옛 left-v2(`map/moa-left.webp`) |

## 코드 쪽 후보 (옮기지 않음)

아무 데서도 import하지 않는 옛 흐름 파일이에요. 빌드에는 안 들어가요. 정리할지 사용자 확인이 필요해요.

| 파일 | 근거 |
|---|---|
| src/scenes/investigate.ts | main.ts·다른 모듈에서 import 0 |
| src/evidence-view.ts | import 0 |
| src/demo.ts | import 0 |
| src/renderers/lab3d.ts | import 0. Three.js 의존성은 이 파일만 사용 |
