# 활동·스테이지 추가 안내

지금 구조는 **스테이지 5개 × 탐구 활동 4개 = 20개**를 전제로 짜여 있어요. 활동 하나를 바꾸는 일은 쉽지만, 스테이지를 늘리면 숫자가 박혀 있는 곳까지 같이 고쳐야 해요.

## 1. 기존 스테이지의 활동을 바꾸거나 새로 쓰기

1. `src/curriculum.ts`의 `inquiryTasks`에서 `task(stage, order, title, kind, instruction, mentor, items, targets, success, feedback, extra)`를 고쳐요.
   - `order`는 1~4예요. 1·2번은 스테이지 입구 경로(`entry`), 3·4번은 출구 경로(`exit`)에서 열려요.
   - `kind`는 `src/inquiry-model.ts`의 `TaskKind` 중 하나예요(`collect`, `microscope`, `sample`, `track`, `connect`, `timeline`, `sort`, `build`, `publish`, `review`).
   - 카드 항목은 `item(id, label, detail, target, art)`로 만들어요. `target`은 `targets`의 `id`와 맞아야 정답으로 인정돼요.
   - 성취기준은 `task()`가 스테이지로 정해요(M4 → 4과12-02, M5 → 4과12-03, 나머지 → 4과12-01).
2. 그림이 필요하면 `public/assets/study/`에 webp를 넣고 `src/artAssets.ts`의 `inquiryArt`에 키를 추가해요. 항목의 `art`가 그 키를 가리켜요. 같은 그림 키를 다른 그림으로 바꿔야 하면 `artKey()`에서 항목 `id`로 골라요.
3. `microscope` 활동은 표시 위치를 `src/observation-masks.json`으로 판정해요. 새 표본 그림을 쓰면 `node scripts/observation-masks.mjs`로 마스크를 다시 만들어요.
4. **새 `kind`를 만들 때만** 아래도 같이 고쳐요.
   - 판정: `src/inquiry-evaluate.ts`의 `taskIssues()`
   - 화면·조작: `src/scenes/inquiry.ts`, `src/renderers/inquiry2d.ts`
   - 힌트: `src/inquiry-guidance.ts`
   - 교사용 예시 기록: `src/main.ts`의 `examples()` (활동마다 정답 기록을 만들어요)

## 2. 스테이지를 새로 추가하기

| 할 일 | 파일 |
|---|---|
| `Stage` 타입과 `stageIds`에 `M6` 추가 | `src/model.ts` |
| `stages`에 제목·장소·`entry`·`exit` 경로 추가 (`routes`, `back`은 자동 생성) | `src/content.ts` |
| 활동 4개 추가 | `src/curriculum.ts` |
| 저장 기록 복구 정규식 `M[1-5]-[1-4]` 범위 늘리기 | `src/inquiry-model.ts` `recoverInquiry()` |
| 입장 조건 `stageRoutes`와 드래프트 조건 | `src/evaluate.ts` `canEnter()` |
| 지도 문 위치 `locations`, `mapNodes`의 이름·`entry`, 길 `pathGraph`(문 노드), `destinationNodeIds` | `src/mapData.ts` |
| 중앙 연구소 번호(`i===5`), 지도 연출의 `i<5`·`repaired/5` | `src/main.ts` `map()`, `src/renderers/map.ts` |
| 시설 배경 `backgrounds` | `src/scenes/inquiry.ts` |
| 보상 문구 `missions`, 시설 그림 목록 | `src/experience.ts`, `src/main.ts` `records()` |
| 개념 영상 문구 `concepts` + `public/assets/concepts/M6.mp4·.webp·.vtt` | `src/concepts.ts` |
| 보고서·코어의 `5` (`report.length===5`, `ports.length<5`, `/5` 표시) | `src/evaluate.ts`, `src/storage.ts`, `src/main.ts`, `src/scenes/solution.ts` |
| 결과 화면 "20개 탐구 활동" 문구 | `src/main.ts` `results()` |

## 3. 같이 고칠 테스트

- `tests/inquiry.test.ts` — 활동 수(20개, 스테이지마다 4개)와 `valid()` 정답 기록. 새 `kind`면 `valid()`에 정답을 추가해요.
- `tests/curriculum.mjs` — `routes`, `stageRoutes`, `names`(브라우저 흐름 테스트가 써요).
- `tests/map-path.test.ts` — 목적지 문 개수(지금 6개).
- `tests/artAssets.test.ts` — 그림 키 선택 규칙.
- `tests/full-flow.mjs` — 처음부터 끝까지 진행하는 브라우저 흐름.

고친 뒤에는 `npm run build`, `npm test`, `npm run test:flow`, `npm run test:offline`을 돌려요. 오프라인 캐시 목록은 빌드할 때 자동으로 만들어지니 따로 고칠 필요가 없어요.
