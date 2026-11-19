# 생명 코드 연구소 최종 점검 (2026-11-19 재점검)

## 최종 판정

**조건부 배포 가능** · FAIL 0

- 2026-11-18 보고서(`RELEASE-REVIEW-20261118.md`)를 입력으로 받아, 이번에 바꾼 항목만 다시 봤다. 나머지 항목 판정은 11-18과 같다.
- 조건부인 이유는 그대로다. 교사 내용 승인, 실제 학교 태블릿·iPad Safari 실기, 40분 수업은 `NOT TESTED`이다(A영역 NOT TESTED가 있으면 「배포 가능」을 주지 않는다).
- 11-18의 새 WARNING 두 개(Phaser 장면 4개 놀이 영역, 인트로·파이널 영상 5MB 초과)는 이번에 해소했다.

## 바뀐 항목

| 항목 | 11-18 | 11-19 | 근거 |
|---|---|---|---|
| C1 놀이 영역 높이 | WARNING | **PASS(확인됨)** | `tests/layout-balance.mjs` 세 뷰포트 × 25화면. M2-2·M2-3·M5-1·M5-4 높이 81~83%, M2-1 73~75%, 코어 88~89%, 모든 놀이 화면 70% 이상. `docs/LAYOUT-BALANCE-20261118.md` 5절 |
| C2 놀이 영역 면적·빈 여백 | WARNING | **PASS(확인됨)** | 밤 재수정 뒤 홈·지도·결과(읽기 카드)를 뺀 모든 놀이 화면이 세 뷰포트에서 면적 55% 이상. 1024에서 M2-2·M2-3·M5-1·M5-4 61%(높이 90%), 코어 57%, M2-1 70%. `docs/LAYOUT-BALANCE-20261118.md` 6·7절 |
| D3 영상 크기 | WARNING | **PASS(확인됨)** | `intro.mp4` 3.9MB, `final.mp4` 3.1MB(CRF 30). 자막 영역 잘라 비교해 선명도 같음. 운영 `content-length: 3897601` |
| 설정 창 닫기 중복(16개 공통 기준) | — | PASS | 이미 아래 「닫기」 하나뿐(`src/settings.ts`). 변경 없음 |

## 실행한 검증

| 명령 | 결과 |
|---|---|
| `npm test` | 18파일 170개 통과 |
| `npm run build` (`tsc --noEmit` 포함) | 통과 |
| `npm run test:browser` | PASS · 135화면 · 9개 뷰포트 · 오류 0 · 레이아웃 실패 0 |
| `npm run test:flow` | FULL FLOW PASS(20탐구·보고서·코어·PNG·새로고침·미리보기 분리). 첫 실행은 바꾸지 않은 M1-2 놀이에서 시간 초과로 멈췄고, 같은 코드로 다시 돌려 통과(다른 세션과 브라우저를 번갈아 쓰던 부하 때문으로 봄, 재현 안 됨) |
| `npm run test:games` | PASS(1280×800·915×412) |
| `tests/layout-balance.mjs` | 콘솔 오류 0. 수치는 위 표 |

## 배포

- 커밋 `4591722` 푸시 → `deploy.sh 08 "8 creatures" pages living-world-explorer` → Cloudflare Pages 배포 `42e5592d`
- 운영 스모크(1024×768, 새 브라우저): M2-1 캔버스 992×558(높이 73%·면적 70%), M5-1 696×562(73%), 콘솔 오류 0
- `cmp.sh`: `assets/inquiry2d-BMpFz8aB.js` build=live `52195e6b906817ca` **MATCH**, index **MATCH**. CSS `index-B0f0YZo1.css`, `film/intro.mp4`, `film/final.mp4` 해시도 MATCH

## 아직 NOT TESTED

교사 내용 승인, 학생 이해도, B16 40분 수업, C19, D6·D9·D10 실기 성능, G19. 11-18과 같다.

## 저녁 재배포 (면적 55%)

- 커밋 `489de12` → Cloudflare Pages 배포 `2d4f9396`. `cmp.sh`: `assets/inquiry2d-CufLEuCt.js` build=live `22be21c27b91d1ee` **MATCH**, index **MATCH**, CSS `index-DVc0c0Gl.css` MATCH
- 운영 스모크(1024×768): M5-1 696×622(높이 81%·면적 55%), 코어 661×676(88%·57%), M2-2 사진 위 띠부터 아래까지·짧은 보기 버튼, 콘솔 오류 0
- 판정·점수 변화 없음: 조건부 배포 가능, 88/100(C1·C2는 이미 PASS로 매김)

## 밤 재배포 (1024 면적 61%)

- 세로 700px 이상 화면에서 M2-2·M2-3·M5-1·M5-4의 아래 띠를 도구 패널 열 아래쪽으로 옮기고 Phaser 장면 높이 상한을 900→960으로 올렸다(`LAYOUT-BALANCE-20261118.md` 7절). 1024 696×688(높이 90%·면적 61%, 전 55%), 1280·1920 66%.
- 커밋 `a0b086f` → Cloudflare Pages 배포 `04070b63`(이미 main에 있던 소리 2차·문장 줄바꿈 커밋도 같이 실림). `cmp.sh`: `assets/inquiry2d-BlqzoxlR.js` build=live `07fb02298be71290` **MATCH**, `index-BBePdU7u.js`·`index-CZheUrlT.css`·index **MATCH**
- 운영 스모크(새 브라우저, 1024·1280·1920 × M5-1·M2-3 × 두 상태): 장면 696×688 / 938×720 / 1406×968, 패널과 아래 띠 겹침 없음, 콘솔 오류 0
- 검증: `npm test` 20파일 190개, `npm run build`, `test:flow` FULL FLOW PASS, `test:games` PASS, `test:browser` 135화면 PASS(아래 테스트 수정 반영본)

## 남은 문제 정리 (11-19 밤)

| 항목 | 상태 | 처리 |
|---|---|---|
| `test:browser` 설정 창 단계 실패 | 고침 | 소리 1차 수정(`3c5e4b7`)으로 배경 음악이 기본으로 켜졌는데, 테스트는 「처음엔 음악 크기 슬라이더가 꺼져 있다」를 기대했다. 앱 동작이 아니라 테스트 기대값이 낡은 것이라 `tests/browser-check.mjs` 한 줄을 새 기본값(켜짐 → 끄면 비활성 → 다시 켬)으로 맞췄다 |
| C11 Phaser 물체 키보드 초점 | WARNING 유지 | 같은 조작을 옆 패널 버튼으로 모두 할 수 있게 일부러 둔 구조. 바꾸지 않음 |
| D13 정적 위험(흐림·애니메이션) | WARNING 유지 | 실기기 측정 없이 바꾸지 않음 |
| E1·E2·E12 CSS 겹침·큰 파일 | WARNING 유지 | 리팩터링 범위. 전 화면 시각 회귀 위험 대비 이득이 작다 |
| F11·F12 일부 생성 그림 출처·이용 조건 기록 | WARNING 유지 | 코드가 아니라 권리 증빙 문서 작업 |
| 교사 승인·학생 이해도·B16 40분 수업·C19·D6·D9·D10·G19 | NOT TESTED | 실기·수업 필요. 수동 확인: 학교 태블릿(iPad Safari·Android Chrome)에서 운영 주소를 열어 M2-3·M5-1 장면을 끝까지 진행하고 프레임 끊김·글자 크기를 본다. 40분 수업은 교사가 한 반에서 처음부터 인증서까지 진행해 걸린 시간을 적는다 |

판정·점수 변화 없음: **조건부 배포 가능**, FAIL 0, 88/100.
