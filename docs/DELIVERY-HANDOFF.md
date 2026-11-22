# 납품 안내 · 생명 코드 연구소

옛 인계 문서: [`archive/HANDOFF-20261018.md`](archive/HANDOFF-20261018.md)(10-18 기준 옛 인계), [`DEPLOYMENT.md`](DEPLOYMENT.md)(배포 방법), [`../README.md`](../README.md). 이 문서는 납품용으로 현재 상태를 한 번에 보게 정리한 것입니다. 원래 파일은 그대로 있습니다.

## 1. 한눈에

| 항목 | 내용 |
|---|---|
| 이름 | 생명 코드 연구소 (패키지 이름 `life-code-lab` 0.1.0) |
| 운영 주소 | https://living-world-explorer.pages.dev |
| 저장소 | https://github.com/yelmovie/living-world-explorer (`main`) |
| 현재 앱 커밋 | `7d434ef` (2026-11-22, M5 효모 3D 모형 교체) |
| 대상 | 초등 4학년 과학, 5개 연구소 · 탐구 20개 |

## 2. 폴더 구조

배포되는 것:

- `src/`(TypeScript 화면·게임 코드와 CSS), `index.html`
- `public/assets/` 그림·영상·음악·목소리·글꼴·3D 모형, `public/sw.js`, `public/manifest.webmanifest`, `public/_headers`
- `functions/assets/{concepts,film,study}/` Pages 함수(영상 Range 처리), `worker/media-range.js`
- `dist/` 빌드 결과(Git 제외)

보관용(배포 안 됨):

- `assets/`(출처 `CREDITS.md`, 생성 기록 `generated/`), `asset-bank/`(원본 보관), `references/`(원본 디자인 팩), `_unused/`
- `docs/` 설계·검증 기록, `tests/` 브라우저·저장 검사, `scripts/` 빌드·가공 도구
- `thumbnails/` 납품 썸네일(`thumbnail-16x8.png`, `thumbnail-1x1.png`), `.tmp/` 작업 중간 파일

## 3. 실행·빌드·검사 명령

| 명령 | 하는 일 |
|---|---|
| `npm ci` | 의존성 설치(이미 `node_modules`가 있으면 생략) |
| `npm run dev` | 개발 서버 `127.0.0.1`(Vite) |
| `npm run build` | 타입 검사 `tsc --noEmit` 뒤 Vite 빌드 → `dist/` |
| `npm test` | Vitest 단위 검사 (20파일 193개, 11-21 기록) |
| `npm run test:browser` | 15경로 × 9크기 오류·배치 검사 |
| `npm run test:flow` | 20개 탐구 완주·PNG·새로고침·시연 분리 |
| `npm run test:games` | 탐구 게임 조작 검사 |
| `npm run test:offline` | 빌드 뒤 서버를 끄고 오프라인 새로 고침 확인 |
| `npm run preview` | 빌드 미리보기 |

브라우저 검사는 Playwright가 필요합니다. 맥과 윈도우에서 번갈아 쓰는 외장 SSD라서 `npm ci` 뒤에 `node "/Volumes/T7 Shield/DevMaintenance/add-native-binaries.mjs"`를 한 번 실행합니다.

## 4. 배포

- 호스팅: Cloudflare Pages, 프로젝트 `living-world-explorer`. 설정 파일 `wrangler.jsonc`(`pages_build_output_dir: ./dist`).
- 방식: 인증된 Wrangler로 `dist/`를 직접 업로드합니다. GitHub 푸시만으로 자동 배포되지 않습니다(`.github` 워크플로 없음).

```sh
npm run build
wrangler pages deploy dist --project-name living-world-explorer --branch main
```

- 영상 탐색(Range) 처리: `functions/assets/{concepts,film,study}/[[path]].js`가 `worker/media-range.js`를 불러 영상(mp4)에 206 조각으로 응답합니다.
- `public/_headers`가 `sw.js`와 `manifest.webmanifest`를 `no-cache`로 내보냅니다.
- 배포 뒤 HTML·실행 번들·그림·영상의 실제 응답을 로컬 빌드와 대조합니다.
- 기록상 마지막으로 운영과 대조한 배포는 Pages `b7cc236b`(앱 `cfd21ca`)입니다. 그 뒤 앱 커밋 일곱 개(`2112054`부터 `7d434ef`까지)가 운영에 반영됐는지는 이번 작업에서 확인하지 않았습니다.

## 5. 다른 호스팅으로 옮길 때 챙길 것

- 정적 파일 폴더는 `dist/` 전체입니다.
- 서비스 워커 `dist/sw.js`는 빌드가 만듭니다(`vite.config.ts`의 `offlinePrecache()`). 운영 빌드에서만 등록되고, 새로 배포하면 바뀐 파일만 다시 받습니다. 학습 기록은 건드리지 않습니다.
- `sw.js`와 `manifest.webmanifest`에 `Cache-Control: no-cache`를 주어야 새 버전이 바로 반영됩니다.
- 영상(mp4)에 Range 요청을 206으로 답해야 합니다. 못 하면 영상 장면 이동이 처음으로 돌아가고 iPad Safari가 재생하지 못합니다.
- 환경 값과 비밀 키는 없습니다. 서버로 학습 기록을 보내지 않습니다.
- 학생 기록은 브라우저 IndexedDB(`life-code-lab`)에 접속 주소별로 저장됩니다. 주소를 바꾸면 기록이 이어지지 않습니다.
- 시작·마무리 영상과 공유 썸네일은 오프라인 저장에서 빠집니다. 배경 음악 2곡은 처음 재생할 때 저장합니다.

## 6. 버전과 변경 이력 (앱 코드, 최근)

| 날짜 | 커밋 | 내용 |
|---|---|---|
| 11-22 | `7d434ef` | M5 효모 3D 모형을 싹 달린 세포 하나로 교체(Meshy 7.1) |
| 11-22 | `13a2c0f` | 지도 악당을 각자 연구소 앞 길로, 5번 성취 카드 그림 교체 |
| 11-22 | `09b1bc4` | M5 효모 카드 그림을 현미경 사진풍으로 |
| 11-21 | `8af718e` | M5-1 요구르트 만들기를 「만드는 식」 배치로 |
| 11-21 | `e03ade1` | M4 분류 문구를 초등학생 눈높이로, 4번 성취 카드 이름 |
| 11-21 | `18aef88` | 개념 영상 장면 버튼이 머리표를 가리지 않게 |
| 11-21 | `a9efe01` | M3-3 배양 접시 집락 그림 교체 |
| 11-21 | `2112054` | M4-1 빵 「처음」 사진 누름 안내 |
| 11-21 | `cfd21ca` | 코드 구조 정리 6단계(동작·화면 변화 0, 화면 141장 차이 0) |
| 11-21 | `d9110a9` | CSS 색을 팔레트 토큰으로 |

## 7. 권리·출처

[`RIGHTS-LEDGER-20261121.md`](RIGHTS-LEDGER-20261121.md)에 53행을 정리했습니다. 확인됨 43, 근거 약함 9, 해당 없음 1(44번, 배포본에서 뺌), 출처 미확인 0입니다. 근거 약함은 Higgsfield 그림 4줄·효과음 1줄, Meshy 3D 모형 2줄(31·53), 개념 영상 1줄(29)과 Gemini 표식 제거 약관 1줄(30)입니다. 요금제 화면 등 사용자 자료가 오면 판정이 바뀝니다.

## 8. 알려진 한계와 남은 일

성적표 `reviews/SCORE-20261121.md` 기준 94점, 실기기 제외 98점이고 판정은 「조건부 배포 가능」입니다. 남은 감점 6점:

- 다음 단계 1점: CSS 덮어쓰기 층(`layout-balance-1118.css`·`upgrade-1115.css`, E1).
- 자료 대기 1점: 이용 조건(F11), 권리 장부 근거 약함 줄.
- 실기기·수업 대기 4점: 40분 수업(B16), iPad 가장자리 제스처(C19), 저사양 태블릿(D10), 애니메이션 속성(D13).
- 교사 검수: [`TEACHER-REVIEW-20261121.md`](TEACHER-REVIEW-20261121.md)가 교사 확인 전입니다.
- 위 점수는 11-21 기준이고 이후 그림·문구 변경(M3-3·M4·M5)은 새로 재지 않았습니다.
