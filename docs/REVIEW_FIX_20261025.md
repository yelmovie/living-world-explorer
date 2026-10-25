# 생명 코드 연구소 수정·검증 기록

대상은 `yelmovie/living-world-explorer` 한 프로젝트야. 운영 배포·푸시·커밋은 하지 않았어. 5개 연구실·20개 탐구, 모아·토토, 기존 배경과 2.5D 지도·2D 활동, 복구 보상은 유지했어.

## 검토 소스와 운영본 비교

- 기준: `c786b1b1d850f5633967b76469ae93af3171e76d`. 작업 시작 때 HEAD가 이 커밋이고 미커밋 변경은 없었어.
- 운영: <https://living-world-explorer.pages.dev/#/main>
- 기준 커밋의 소스만 별도 임시 폴더에서 다시 빌드했어. 운영 JS·CSS 6개 모두 SHA-256이 같았고, 관찰·전후 비교 이미지 11개도 원본과 같았어. 확인한 범위에서는 검토 소스와 운영본의 차이가 없었어.
- 실제 경로는 `src/main.ts → src/scenes/inquiry.ts → src/renderers/inquiry2d.ts`야. 옛 10활동 문서를 구현 근거로 쓰지 않았어.
- 비교 해시: [deployment-comparison.json](../.tmp/review-before/deployment-comparison.json). 수정 빌드는 [build.json](../.tmp/review-after/build.json)에 별도로 기록했어.

## 재현 전후

| 문제 | 기존 화면에서 재현한 결과 | 수정한 동작 |
|---|---|---|
| 버섯 상단 주름 | 원본 `(0.50, 0.24)` 표시를 거절 | 갓 아래 주름 윤곽을 따라 정의한 영역을 사용해. 서로 다른 주름 4곳을 검사했어. |
| 깨끗한 빵 | `(0.35, 0.48)`도 변화로 인정 | 빵·낙엽 각각 6개 전후 조합의 실제 변화 마스크를 사용해. 깨끗한 빵·배경·같은 시점은 거절해. |
| 확대·이동 | 기존 중앙 판정과 그림이 어긋남 | 원본 좌표↔표시 좌표 변환을 렌더링·터치·버튼 대안에서 함께 사용해. 틀린 표시를 추가해도 앞서 찾은 올바른 표시는 지우지 않아. |
| 실행 후 예상 변경 | 재실행 없이 바꾼 예상으로 완료 | 실행 당시 예상·배치·연결·결과를 시도 기록으로 남겨. 관찰 후 생각은 별도이고, 새 예상에는 새 실행이 필요해. 틀린 예상도 근거에 맞게 비교하면 완료돼. |
| BIO 실패 안내 | 비교 버튼 위에 겹침 | 도구와 피드백이 줄어들며 겹치지 않도록 패널 안에 공간과 스크롤을 확보했어. |
| 보고서 본문 | 일부 문장이 너비 82px 열에 배치 | 이미지와 본문을 분리했어. 1024×768에서 본문 최소 643px, 768×1024에서 668px를 확인했어. |
| 코어 기록 | 좁은 패널의 카드가 넘침 | 한 열 요약과 내부 스크롤을 사용해. 결과 이동 버튼은 별도 하단 영역에 있어. 코어 그림이 준비된 뒤 가동할 수 있어. |
| 재탐구 | 새 문장을 제출해도 도감은 최초 복사본 표시 | 정상 제출한 활동만 도감 스냅샷에 반영해. 도감·보고서·소개 카드가 같은 기록을 읽고, 초안·오답은 이전 유효 기록을 바꾸지 않아. 최초 보상은 중복 지급하지 않아. |

기존 재현 결과: [reproduction.json](../.tmp/review-before/reproduction.json).

## 학습 흐름과 자료

- M3-4 한 활동을 ‘처음 생각 → 새 자료 두 개 → 주장과 근거 → 유지·수정’으로 바꿨어. 탐구 수는 20개 그대로야.
- M1-4에 이름을 가린 표본 A·B를 사용했어. 도감에는 선택한 설명과 그 근거의 내용도 남겨.
- 소개 활동은 사례·생물의 작용·근거의 일치로 확인해. 글자 수는 채점하지 않아. 짧은 문장틀과 ‘관찰한 것 / 그렇게 생각한 근거 / 우리 생활과의 연결’ 발표 저장을 제공해.
- 요구르트 힌트에 우유·유산균의 역할·요구르트의 관계를 넣었어. 효모는 균류이며 세균과 다르다는 설명, 모든 세균이 해로운 것은 아니라는 설명, 변질된 빵을 먹지 않는 안전 안내를 유지했어.
- ‘자료·관찰 조건’에서 생성 모형·가상 채집 사례와 실제 참고 문헌을 구분해. 비교 순서는 실제 날짜·온도·배율 측정값이 아니고, 전후만으로 관여 생물을 모두 알 수 없다는 안내도 유지했어.
- 실제 읽고 연결한 참고 문헌: [OpenStax 균류](https://openstax.org/books/biology-2e/pages/24-1-characteristics-of-fungi), [OpenStax 세균](https://openstax.org/books/biology-2e/pages/22-2-structure-of-prokaryotes-bacteria-and-archaea), [OpenStax 해캄·짚신벌레](https://openstax.org/books/biology-2e/pages/23-3-groups-of-protists), [FAO 발효유 자료 부록 VII](https://www.fao.org/4/x4888e/x4888e0h.htm).

## 변경 파일

| 범위 | 파일 |
|---|---|
| 그림 판정·좌표 | `src/observation.ts`, `src/observation-masks.json`, `scripts/observation-masks.mjs`, `src/draw.ts`, `src/inquiry-evaluate.ts` |
| 실행·기록 보호 | `src/inquiry-model.ts`, `src/inquiry-runs.ts`, `src/inquiry-records.ts`, `src/model.ts`, `src/storage.ts`, `src/export.ts` |
| 활동·도감·보고서·지도 | `src/main.ts`, `src/scenes/inquiry.ts`, `src/scenes/solution.ts`, `src/renderers/inquiry2d.ts`, `src/renderers/lab2d.ts`, `src/inquiry-guidance.ts`, `src/styles.css`, `src/ui.ts` |
| 학습 자료 | `src/curriculum.ts`, `src/inquiry-sources.ts`, `src/settings.ts`, `src/settingsContent.ts` |
| 검사 | `tests/reproduce-review.mjs`, `tests/review-regression.test.ts`, `tests/review-browser.mjs`, `tests/interaction-review.mjs`, `tests/full-flow.mjs`, `tests/inquiry.test.ts`, `tests/inquiry-guidance.test.ts`, `tests/export-browser.mjs`, `tests/records-browser.mjs` |

새 이미지·영상은 생성하지 않았어. 기존 에셋·운영 설정·다른 프로젝트 파일도 바꾸지 않았어. 이전 기준으로 완료한 학생 기록은 새 채점 기준으로 소급 삭제하지 않고 표시를 구분해. 재탐구에서 정상 제출한 항목부터 갱신해.

## 실행한 검사

- `npm test`: 99개 통과.
- `npm run build`: TypeScript·운영용 빌드 통과. 배포 명령은 실행하지 않았어.
- `node scripts/observation-masks.mjs --check`: 특징·변화 영역이 참조하는 원본 이미지 11개 해시 일치.
- `tests/full-flow.mjs`: 새 학생 20개 탐구, 연구실 보상 10개, 보고서, 중앙 코어, 엔딩, PNG 다운로드, 새로고침, 학생·시연 분리.
- `tests/review-browser.mjs`: 1024×768·768×1024 실제 브라우저 터치 이벤트, 올바른/잘못된 표시, 확대, 같은 시점 거절, 새 예상 재실행, 학생 재탐구, 보상 중복 방지, 바로 입장, 발표 저장, 지연 로딩, 실제 PNG·PDF 출력.
- `tests/interaction-review.mjs`: 읽지 않은 자료의 드래그 거절, 읽은 자료의 드래그와 탭→대상 연결, BIO 실패 안내 겹침, 이동+확대 좌표, 회전·키보드 크기 뷰포트, 이미지 실패·재시도.
- `tests/storage-safety.mjs`: 잘못된 구조·미지원 버전 원본과 다른 창의 최신 기록 보호.
- `tests/records-browser.mjs`: 도감·보고서 촬영 그림과 확대 창의 실제 크기·그림 표시.
- `tests/export-browser.mjs`: 요구르트·빵 반죽·낙엽 사례별 PNG와 학생 원본 보존.
- 보고서 화면은 906×755·1280×800·1920×1080에서도 확인했어. `git diff --check`와 `graphify update .`도 실행했어.

검사 원본: [전체 완주](../.tmp/full-flow.json), [화면·기록 회귀](../.tmp/review-after/browser.json), [조작 회귀](../.tmp/review-after/interactions.json), [저장 보호](../.tmp/storage-safety.json), [도감](../.tmp/records-browser.json), [PNG 사례](../.tmp/export-browser.json).

실제 출력물을 열어 확인했어: [재탐구 소개 카드 PNG](../.tmp/review-after/reinquiry-card.png), [인증서 PDF](../.tmp/review-after/certificate.pdf). PDF는 A4 한 장이고, 렌더링한 그림에서도 한글·테두리·소개 문장 잘림이 없었어.

## 미검증 범위와 운영 상태

- 실물 iPad·Android 태블릿, Safari, 실제 한글 가상 키보드·IME는 직접 확인하지 못했어. Chromium의 터치 이벤트와 화면 회전·뷰포트 축소로 확인한 범위야.
- 인쇄 PDF 결과물은 확인했지만 실제 프린터의 출력은 확인하지 못했어.
- 수정본은 로컬 빌드와 로컬 미리보기에서 검증했어. 운영 URL은 계속 기존 `c786b1b` 빌드이며, 운영 배포는 별도 승인 전까지 하지 않아.
