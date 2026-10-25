# 삭제 전 확인할 후보 — 2026-10-24

실제 파일은 삭제하거나 이동하지 않았어요. 정적 경로 검색과 현재 실행 경로에 근거한 후보이며, 이전 버전의 자료 보존 목적을 먼저 확인해야 해요.

| 경로 | 크기 | 근거 | 주의 |
|---|---:|---|---|
| public/assets/exploration-map.webp | 547,360 bytes | 현재 mapAssets.terrain은 map-terrain-v3.webp를 참조 | 이전 지도 원본·생성이력 보존 |
| public/assets/map-terrain-v2.webp | 487,130 bytes | 현재 지도는 v3; v2는 생성 참조·문서에만 남음 | v3의 수정 참조 원본 |
| public/assets/map-moa-left.webp | 11,136 bytes | 현재 left-v2.webp 사용; right와 동일 SHA-256 | 방향 에셋 이력 확인 후 보관 위치 결정 |

관찰·생활 소재·개념 영상은 문자열 조합으로 동적 로딩하므로 정적 검색만으로 미사용 판정을 하지 않아요. 원본 이미지 및 기존 3D·Scene 코드는 사용자 자료로 보존했어요. public 바깥 references와 생성 원본은 배포 에셋과 구분해요.
