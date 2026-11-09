# 생명 코드 연구소 · 12/10 고도화 계획 · 2026-11-09

시작 커밋 `5de842b`(origin/main, 현재 운영 배포와 같은 커밋 — 운영 `M1.mp4` 응답 225,307B가 로컬과 일치). 작업 브랜치 `claude/upgrade-20261109`. 무인 야간 작업이라 이 계획서 자체를 승인으로 보고 1단계 → 개념영상 → 2·3단계 순서로 진행한다. BEFORE 점수와 근거는 `SCORE-20261109.md`.

## BEFORE에서 확인한 결함 (실측)

| 근거 | 결과 | 내용 |
|---|---|---|
| `npm run test:browser` | **FAIL** | 873×580 `impact-analysis`에서 "3번째 발견" 단계 버튼이 44px 미만(C3 FAIL) |
| `tests/stage-layout.mjs` | **FAIL(간헐)** | 단계 버튼이 정확히 44×44px라 현재 단계 표시가 1px 움직일 때 `height<44`로 판정. 실행마다 M2-4·M5-2 등 다른 칸에서 실패 |
| 디자인 스윕(7크기×15화면=105) | WARNING/FAIL | 44~47px 조작 507건(단계 버튼, 전후 겹쳐 보기 ±, 기록 보기 등), 코어 포트 상태 글자 12px(C20 FAIL), M4 강조색 위 흰 숫자 대비 4.37:1(C9) |
| CSS 정적 검색 | WARNING | 버튼·지도 표시의 hover 이동(`translateY`)이 `(hover:hover)`로 감싸지지 않아 터치 기기에서 눌린 뒤 떠 있음(C8·디자인 "터치") |
| README에 적힌 보조 검사 7개 | FAIL(검사 낡음) | `stage-states`, `link-board`, `interaction-review`, `streamlined-browser`, `storage-safety`, `observation-playback`, `media-network`가 지금 UI 문구·구조(토스트→모달, 슬라이더 이름 등)와 맞지 않아 실패. 앱 결함이 아니라 검사 갱신 누락. 예: `storage-safety`는 토스트를 기다리지만 앱은 같은 경고를 모달로 띄우고, 손상 원본은 그대로 보존됨(직접 확인) |
| 개념영상 | WARNING | 960×540·24fps·12초 Pillow 슬라이드형. 화면 자막(`concepts.ts`)과 VTT·manifest 문장이 M4·M5에서 서로 다름. 코드에 `12초`·4초 간격이 박혀 있음 |

## 1단계 → 10/10 (FAIL·WARNING·NOT TESTED 해소) — 오늘 실행

| # | 무엇을 | 파일 | 완료 기준 | 위험 |
|---|---|---|---|---|
| 1-1 | 단계 버튼 44→48px, 전후 겹쳐 보기 ±·짧은 화면 하단 버튼 48px | `src/inquiry-controls.css`, `src/styles.css` | `test:browser` PASS, `stage-layout` 9크기 PASS, 스윕 44px 미만 0건 | 중 — 짧은 가로(412·515) 하단 줄 높이 |
| 1-2 | 코어 포트 상태 글자 12px → 14px 이상(1920은 18px) | `src/core-figure.css` | 스윕 14px 미만 0건, 포트 안에서 한 줄 | 낮음 |
| 1-3 | M4 강조색을 대비 4.5:1 이상으로 살짝 어둡게 | `src/styles.css` `--stage-m4` | 스윕 대비 실패 0건 | 낮음(색감 거의 동일) |
| 1-4 | hover 이동을 터치 기기에서 끔 | `src/styles.css` 끝 `@media(hover:none)` | 정적 검색 + 터치 에뮬레이션에서 transform none | 낮음 |
| 1-5 | 개념영상 자막 문장 하나로 통일(화면 자막 = VTT = manifest), 영상 길이를 코드에서 읽음 | `src/concepts.ts`, `public/assets/concepts/*` | 단위 테스트로 세 곳 일치 검사 | 낮음 |
| 1-6 | 성취기준·학습목표·검수 상태를 콘텐츠 데이터에 구조화(A11·A12) | `src/curriculum.ts`, `tests/education.test.ts` | 테스트가 20개 탐구 모두 목표·코드·검수 필드를 검사 | 낮음 |
| 1-7 | 초기 로딩을 학교망 수준으로 제한해 실측(D1) | 검사 스크립트(TMPDIR) | 10Mbps·지연 40ms·CPU 4배 감속에서 첫 화면 시간 기록 | 없음 |
| 1-8 | 운영 URL 읽기 전용 확인(G7·G12·G18), 롤백 대상 기록(G20) | 보고서 | 운영 HTML·OG·영상 응답 기록 | 없음 |
| 1-9 | safe-area: 앱 바깥 틀에 `env(safe-area-inset-*)` 반영(C19) | `src/styles.css` | 노치 없는 화면 영향 0(스윕 동일), 실기 확인은 남김 | 낮음 |

## 2단계 → 11 (학습 몰입·피드백·접근성 상향)

| # | 무엇을 | 파일 | 완료 기준 | 오늘? |
|---|---|---|---|---|
| 2-1 | 개념영상 화면 자막을 영상 장면 시간표에 맞춰 바꾸기(4초 균등 → 장면별 시각) | `src/concepts.ts` | 자막 바뀌는 시각 = VTT 시각 | 오늘 |
| 2-2 | 개념영상 움직임 줄이기 대체(마지막 장면 포스터 + 문장 3줄) 유지·포스터를 결론 장면으로 갱신 | `public/assets/concepts/M*.webp` | reduced에서 자동재생 없음, 포스터 = 결론 프레임 | 오늘 |
| 2-3 | 낡은 보조 검사 7개 갱신(토스트→모달 등) | `tests/*.mjs` | README 검사 전부 PASS | 다음 |
| 2-4 | 첫 설계(M5-1) 안내가 답에 가까운 문제(A9) — 단계적 힌트로 나눔 | `src/inquiry-guidance.ts` | 첫 힌트가 정답 낱말을 쓰지 않음 | 다음(교사 검수와 함께) |
| 2-5 | 실기 태블릿·전자칠판에서 40분 수업 시간(B16)·FPS(D9)·가장자리 제스처(C19) | — | 교실 1회 기록 | 다음(사람 필요) |

## 3단계 → 12 (개념영상 HyperFrames 고도화 + 이 게임만의 연출)

| # | 무엇을 | 파일 | 완료 기준 | 오늘? |
|---|---|---|---|---|
| 3-1 | M1~M5 개념영상을 「모아의 연구 노트」 형식으로 다시 만듦: 질문 → 방금 한 탐구 재현(전·후) → 바뀐 곳 확대 + 이름표 → 결론 한 줄 → 토토(동료) 반응 | `films/concept-M1..M5/`, `films/build-films.mjs` | `hyperframes check` 오류 0, snapshot 검토 `films/REVIEW.md` | 오늘 |
| 3-2 | 게임 속 진짜 그림(모아·토토·표본 사진)만 잘라 씀, 새 이미지 생성 없음. 효과음은 프로젝트 Kenney CC0 재사용, 음악 없음 | `films/*/assets` | 출처가 `public/assets`와 같은 파일 | 오늘 |
| 3-3 | 같은 경로·같은 이름·같은 형식(960×540 H.264+AAC mp4, faststart, 편당 2.5MB 이하)으로 교체 + 포스터·VTT·manifest | `public/assets/concepts/` | 헤드리스 Chrome에서 `readyState≥1`, `duration` 일치, 포스터 표시 | 오늘 |
| 3-4 | 1280×720 고해상도판(전자칠판) | `public/assets/concepts/` | 같은 용량 기준 | 다음 — 오늘은 기존 해상도 유지 원칙 |
| 3-5 | 시작·마무리 이야기 영상(11.4/8.9MB, D3) 용량 줄이기 | `public/assets/film/` | 5MB 이하 | 다음 — 개념영상이 아니라 이번 범위 밖 |

## 미루는 것과 이유

- 큰 CSS 파일 나누기(E2), 규칙 중복 정리(E1): 회귀 위험 대비 이득이 작아 별도 작업으로.
- 기존 생성 그림의 생성 당시 조건 대조(F11·F12): 원본 기록이 저장소 밖에 있어 사람 확인 필요.
- 배포 후 스모크(G11): 배포는 메인 세션이 한다.
