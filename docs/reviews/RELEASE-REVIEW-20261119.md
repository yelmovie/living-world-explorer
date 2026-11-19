# 생명 코드 연구소 최종 점검 (2026-11-19 재점검)

## 최종 판정

**조건부 배포 가능** · FAIL 0

- 2026-11-18 보고서(`RELEASE-REVIEW-20261118.md`)를 입력으로 받아, 이번에 바꾼 항목만 다시 봤다. 나머지 항목 판정은 11-18과 같다.
- 조건부인 이유는 그대로다. 교사 내용 승인, 실제 학교 태블릿·iPad Safari 실기, 40분 수업은 `NOT TESTED`이다(A영역 NOT TESTED가 있으면 「배포 가능」을 주지 않는다).
- 11-18의 새 WARNING 두 개(Phaser 장면 4개 놀이 영역, 인트로·파이널 영상 5MB 초과)는 이번에 해소했다.

## 바뀐 항목

| 항목 | 11-18 | 11-19 | 근거 |
|---|---|---|---|
| C1 놀이 영역 높이 | WARNING | **PASS(확인됨)** | `tests/layout-balance.mjs` 세 뷰포트 × 25화면. Phaser 장면 4개 높이 73~75%, 코어 79~83%, 모든 놀이 화면 70% 이상. `docs/LAYOUT-BALANCE-20261118.md` 5절 |
| C2 놀이 영역 면적·빈 여백 | WARNING | **PASS(확인됨, 예외 기록)** | M2-1 1024 면적 70%. M2-3·M5-1·M5-4는 1024 50%·1280 54%·1920 55%. 오른쪽 도구 패널(이 프로젝트 고유 배치)이 폭을 차지해서이며, 기준 1절 「고유 배치 유지」 예외에 해당한다. 장면 칸 안은 위아래 빈 곳 없이 꽉 찬다 |
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
