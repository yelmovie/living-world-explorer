# 생명 코드 연구소 · 야간 고도화 결과 · 2026-11-09

브랜치 `claude/upgrade-20261109`(시작 `5de842b` = 운영 배포 커밋). 푸시·배포는 하지 않았다. 계획: [UPGRADE-PLAN-20261109](UPGRADE-PLAN-20261109.md), 점수: [SCORE-20261109](SCORE-20261109.md) — 최종스킬 71 → 84/100, 디자인스킬 124 → 128/130.

## 바꾼 것

| 커밋 | 내용 | 파일 |
|---|---|---|
| `78e31e4` | 44px 조작 요소(단계 버튼, 전후 겹쳐 보기 ±, 요약·보조 버튼 등)를 48px로. 코어 포트 상태 글자 12px → 14~18px. M4 강조색 `#ad6542`→`#a55e3d`(흰 숫자 대비 4.37→4.83:1). 터치 기기에서 hover 들림 제거. 좌우 safe-area 여백 | `src/styles.css`, `src/inquiry-controls.css`, `src/core-figure.css` |
| `ae71fc8` | 연구소별 학습목표 `stageObjectives`, 검수 상태 `contentReview`(needsReview: true) 데이터화 + 테스트 3개. 계획서 | `src/curriculum.ts`, `tests/curriculum-meta.test.ts` |
| `fa9ddd2` | 개념영상 M1~M5 HyperFrames 재제작(아래), 자막 단일 원본 `src/concept-captions.json`, 영상 아래 자막 표시, 짧은 가로 화면 높이 확보, 시작 화면 로고 숨쉬기 제거(반복 3→2묶음), 문서 갱신 | `films/`, `public/assets/concepts/*`, `src/concepts.ts`, `src/styles.css`, `tests/concept-captions.test.ts`, `README.md`, `docs/MAKING-OF.md`, `docs/ADD_STAGE.md` |

### 개념영상

| 편 | 결론 한 줄 | 길이 | 앱 파일(960×540 H.264+AAC, 30fps, faststart) |
|---|---|---|---|
| M1 버섯숲 표본실 | 버섯과 곰팡이는 균사로 된 균류예요 | 18.0 s | `public/assets/concepts/M1.mp4` 611,232 B |
| M2 연못 관찰소 | 물 한 방울에도 작은 생물이 살아요 | 18.0 s | `M2.mp4` 661,157 B |
| M3 자료 연구실 | 세균은 모양도 사는 곳도 여러 가지예요 | 18.0 s | `M3.mp4` 536,288 B |
| M4 생활마을 | 해로울 때도, 이로울 때도 있어요 | 18.0 s | `M4.mp4` 631,594 B |
| M5 BIO 작업실 | 재료 → 생물의 작용 → 결과 | 18.0 s | `M5.mp4` 487,024 B |

- 형식(5편 공통): 질문(모아) → 탐구 재현(카드 두 장, 돋보기/며칠 뒤/생물의 작용 표시 뒤 "후" 그림) → 확대 + 이름표 → 결론 한 줄 + 근거 카드 → 토토 반응. 이전: 12초 960×540 24fps 슬라이드, 자막이 영상에 구워져 있었음.
- 포스터 `M*.webp` = 결론 장면. VTT·manifest·화면 자막이 같은 문장·시각(테스트로 고정). 기존 M4·M5는 화면 자막과 VTT 문장이 서로 달랐다.
- 소스: `films/concept-M1~M5/`(HyperFrames 프로젝트, 게임 그림·Jua 글꼴·Kenney CC0 효과음 사본), `films/films.data.mjs`(장면 데이터), `films/build-films.mjs`, `films/publish-films.mjs`, 검토 `films/REVIEW.md`. 1080p 렌더 원본은 외장 SSD 임시 폴더(커밋 안 함).
- 시작·마무리 이야기 영상(`public/assets/film/`)은 개념영상이 아니어서 손대지 않았다.

## 검증 명령과 실제 결과 (최종 코드)

| 명령 | 결과 |
|---|---|
| `npm test` | 15파일 142/142 통과 |
| `npm run build` | 통과(tsc + vite) |
| `npm run test:browser` (`APP_URL=http://127.0.0.1:5114`, 시스템 Chrome) | PASS · 90화면 · 페이지 오류 0 · 실패 요청 0 · 첫 화면 187ms/642kB(로컬) |
| `npm run test:flow` | FULL FLOW PASS: 20 tasks; report; core; PNG; reload; preview isolation |
| `npm run test:offline` | ok · 126파일 11.42MB 프리캐시, 오프라인 새로고침·지도·탐구 그림·영상 범위 요청 통과 |
| `node tests/stage-layout.mjs` | PASS · 9크기 × 20탐구 = 180화면 |
| `hyperframes check --json` (5편) | 모두 ok, 오류 0 (남긴 경고는 `films/REVIEW.md`) |
| 디자인 스윕(TMPDIR 스크립트, 7크기×15화면) | 가로 넘침 0, 48px 미만 조작 0, 14px 미만 글자 0, 대비 실패 0, 포커스 3px, Esc 닫힘 |
| 학교망 조건 첫 화면(10Mbps·40ms·CPU 4배, 3회) | 422~732ms, 그림 완료 898~1239ms, 468kB |
| 개념영상 앱 재생(6크기×5편) | 30/30 재생·길이 18.005s·포스터·자막·창 안 배치, 오류 0. 움직임 줄이기에서 자동재생 없음 + 결론 포스터·결론 자막 |

## 미검증과 이유

- README에 적힌 보조 검사 `storage-safety`, `interaction-review`, `streamlined-browser`(및 `stage-states`, `link-board`, `observation-playback`, `media-network`)는 **시작 커밋에서부터 실패**한다. 화면 문구·구조 변경(저장 경고 토스트→모달, 슬라이더·힌트 이름)을 검사가 따라가지 못한 것으로, `storage-safety`의 대상 동작(손상 저장 원본 보존)은 직접 확인했다. 검사 갱신은 하지 않았다(README에 상태 기록).
- `core-figure.mjs`, `map-residents.mjs`는 돌리지 않았다.
- 개념영상 소리는 `silencedetect`로 효과음 위치만 쟀고 귀로 듣지 않았다.
- 실기 태블릿·전자칠판·iPad Safari(제스처, FPS, 인쇄·공유), 실제 40분 수업, 배포 후 운영 스모크는 하지 않았다.
- 터치 hover 처리(`@media(hover:none)`)는 코드로만 확인했다(헤드리스는 hover:none 기기가 아님).

## 남은 일

1. 보조 검사 7개 갱신(계획 2-3).
2. M5-1 첫 설계 단계적 힌트(A9, 교사 검수와 함께).
3. 이야기 영상 11.4/8.9MB 재인코딩(D3), 시작 버튼 box-shadow 펄스 정리(D13), `core-figure.css` 색 토큰화.
4. 배포 직후 운영 URL에서 개념영상 5편 재생·OG·새로고침 스모크(G11). 롤백 대상: `5de842b`.
5. 개념영상 1280×720판(전자칠판), M2 짚신벌레 실제 두 시점 캡처(`films/REVIEW.md`).
