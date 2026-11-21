# 08 생명 코드 연구소 · 새 그림이 필요한 자리 (2026-11-21)

새 그림이 필요한 자리만 적었다. 이 문서는 목록이고, 그림은 아직 만들지 않았다.

- 기준: `main` HEAD `3bcdc70`의 작업 트리 `public/`, 권리 장부 `docs/RIGHTS-LEDGER-20261121.md`, 할 일 목록 `docs/reviews/SCORE-100-TODO-20261120.md`.
- 크기는 `sips -g pixelWidth -g pixelHeight`로 쟀다. 화풍은 그림 파일을 직접 열어 보고, 운영 화면 스크린숏(`.tmp/score-measure-20261120/s1/`)으로 확인했다.
- **바꿀 때 같이 해야 할 것:** `src/observation-masks.json`은 그림 파일의 SHA-256으로 묶여 있다. (가)의 4장과 (나)의 `bread-0`·`leaf-0`을 바꾸면 `scripts/observation-masks.mjs`로 마스크를 다시 만들어야 한다. 새 그림은 대상의 위치·크기를 지금 그림과 비슷하게 두어야 관찰 활동의 누르는 자리가 크게 바뀌지 않는다.
- 공통 프롬프트 조건: 글자·라벨·눈금·워터마크 없음. 설명용 관찰 모형(실제 현미경 사진처럼 보이게 하지 않음).

## (가) 권리 장부에서 출처 미확인인 그림 — 4장 → **0장**(2026-11-21 09:25 사용자 확인 「그림은 전부 Codex(GPT), 유료 요금제」 → "전부 맞아"로 장부 23번 줄이 확인됨(사용자 확인)이 됐다. 아래 표는 기록으로 남기고 새로 그리지 않는다)

| # | 쓰이는 화면 | 지금 파일 | 필요한 크기·비율 | 화풍을 맞출 참고 그림 | 왜 필요한지 |
|---|---|---|---|---|---|
| 가1 | M1-2 「버섯 갓 아래에는 뭐가 있을까?」 관찰 그림, M1-4 분류 보드 카드(`src/artAssets.ts` 6·73행) | `public/assets/study/mushroom.webp` (793×496) | 지금과 같은 약 16:10(793×496). 2배인 1586×992 이상으로 만들어 줄임. 갓 아래 주름이 보이게 올려다본 버섯 한 개, 가운데 배치 | `public/assets/study/mushroom-spores.webp`, `public/assets/study/fungi-gills.webp`, `public/assets/study/deadwood.webp` | 권리 장부 23번: 만든 기록·원본을 못 찾음. 사용자 결정(2026-11-21 「추천대로」 7번)대로 자료가 없으면 새로 만들어 교체 |
| 가2 | M1-3 「곰팡이를 현미경으로 들여다봐요」 관찰 그림, M1-4 분류 보드 카드 | `public/assets/study/mold.webp` (793×496) | 약 16:10, 1586×992 이상. 균사(가는 실)와 둥근 포자주머니가 함께 보이게. 이름표 붙이는 자리 두 곳이 지금 그림과 비슷한 위치 | `public/assets/study/mold-lens.webp`, `public/assets/study/fungi-sporangium.webp`, `public/assets/study/fungi-threads.webp` | 위와 같음 |
| 가3 | M2-2 「실처럼 이어진 해캄을 찾아요」 관찰 그림, M2 연못 정리 화면(`src/renderers/pond-summary.ts` 22행) | `public/assets/study/spirogyra.webp` (793×496) | 약 16:10, 1586×992 이상. 초록 실처럼 길게 이어진 해캄 몇 가닥 | `public/assets/study/spirogyra-lens.webp`, `public/assets/study/pond.webp` | 위와 같음 |
| 가4 | M2-3 「짚신벌레의 두 순간을 비교해요」 관찰 그림, M2 연못 정리 화면(`pond-summary.ts` 29·45행) | `public/assets/study/paramecium.webp` (793×496) | 약 16:10, 1586×992 이상. 몸 둘레 섬모가 보이는 짚신벌레 한 마리 | `public/assets/study/spirogyra-lens.webp`(같은 연못 물방울 화풍), `public/assets/study/germ/zoom-paramecium.webp`(모양 참고) | 위와 같음 |

## (나) 화풍·해상도가 튀거나 임시로 넣은 그림 — 3장

| # | 쓰이는 화면 | 지금 파일 | 필요한 크기·비율 | 화풍을 맞출 참고 그림 | 왜 필요한지 |
|---|---|---|---|---|---|
| 나1 | M5 구역 배경(`src/styles.css` 611행 `--facility-image`), M5 보상 그림(`src/experience.ts` 46행), 기록 요약 카드(`src/main.ts` 132행) | `public/assets/places/workshop.webp` (1600×900) | 16:9, 1600×900 이상(원본 2배로 만들어 줄임). 가운데는 패널이 덮으므로 조용하게, 가장자리에 소품 | `public/assets/places/fungi.webp`, `public/assets/places/village.webp`, `public/assets/map/terrain.webp`(남서쪽 「유리 온실 공방」 건물) | 다른 구역 배경은 따뜻한 나무·식물·햇빛 그림인데 이것만 파랑·보라 네온의 우주선 같은 실험실이라 따로 논다(운영 스크린숏 `.tmp/score-measure-20261120/s1/contrast-solution-assembly.png`). 지도와 시작 영상은 이 건물을 나무와 유리로 된 온실 공방으로 보여 준다. 권리 장부 1번(근거 약함)이기도 하다 |
| 나2 | M4-1 「빵에 무슨 일이 생겼을까?」 시간 손잡이 첫 장면 「처음」(`src/artAssets.ts` 11행 frames[0]) | `public/assets/study/bread-0.webp` (640×360) | 16:9, **1024×576**(뒤 장면 `bread-1~3`과 같게) | `public/assets/study/bread-1.webp`(같은 빵 조각·같은 위치에서 곰팡이 점만 없는 장면으로) | 뒤 장면 1~3은 1024×576인데 첫 장면만 640×360이다. 열어 보면 빵 조각의 크기·모양·위치도 1번 장면과 달라서 손잡이를 밀 때 빵이 바뀌어 보인다. 활동 안내가 「같은 표본을 같은 위치」에서 본다고 말하는 것과 맞지 않는다 |
| 나3 | M4-2 「낙엽은 어디로 사라졌을까?」 시간 손잡이 첫 장면(`src/artAssets.ts` 12행 frames[0]) | `public/assets/study/leaf-0.webp` (640×360) | 16:9, **1024×576** | `public/assets/study/leaf-1.webp`(같은 잎·같은 위치에서 구멍만 없는 장면으로) | 나2와 같은 문제. 첫 장면만 해상도가 낮고 잎 가장자리 모양·크기가 1번 장면과 다르다 |

참고(그림이 아니라 표에서 뺌): 개념 영상 `concepts/M{1..5}.mp4`와 포스터는 960×540인데 2026-11-19부터 전체 화면으로 재생한다. 큰 화면에서 흐려 보이는지는 실제 화면에서 확인이 필요하다.

## (다) 할 일 목록의 게임성·화면 보강에 필요한 소품·배경 — 없음

`docs/reviews/SCORE-100-TODO-20261120.md`에서 A17(난이도 상승 구조)과 C14(한글 조사)는 이미 PASS로 적혀 있고, 「수정으로 풀 것」 표(C9 글자 대비, D8 메모리, D6 미사용 파일, E13, G17, 인증서 인쇄 알림)는 모두 코드·CSS·측정 일이다. C9는 눈금 글자에 크림색 바탕을 까는 CSS 수정이라 새 그림이 필요 없다. 그래서 새 소품·배경이 필요한 줄은 없다.

## 합계

- ~~(가) 4장, (나) 3장, (다) 0장 — 모두 7장.~~ (2026-11-21 아침)
- **2026-11-21 09:25 뒤: (가) 0장, (나) 3장, (다) 0장 — 모두 3장.** (가)는 사용자 확인으로 권리 문제가 풀려 새로 그리지 않는다. (나) 3장은 권리가 아니라 화풍·해상도 문제라 그대로 남는다.
- (가)를 그리기 전에 사용자에게 먼저 물어볼 것: 4장의 생성 기록을 가지고 있는지(권리 장부 「사용자가 줘야 하는 자료」 23번 줄). 기록이 있으면 장부에 연결만 하고 다시 그리지 않는다.

## 3-3a 만들기 기록 (2026-11-21) — 3장 모두 처리: 나1 새로 그림(1회), 나2 코드로 풂(0회), 나3 생성+합성(1회)

| # | 푼 방법 | 프롬프트·방법 | 참고 그림 | 지킬 것 / 넣지 않을 것 |
|---|---|---|---|---|
| 나2 `study/bread-0.webp` | **코드로 풂(생성 0회)**: 1~3번과 같은 빵인 `bread-1.webp`(1024×576)에서 가운데 곰팡이 점(약 80×72px)만 바로 아래 빵 속(78px 아래)으로 부드럽게 덮어 「처음」 장면을 만듦 | `.tmp/score-images-20261121/`의 node·sharp 스크립트(타원 가장자리 30% 페더) | `study/bread-1.webp` | 빵 모양·크기·위치·질감이 1~3번과 픽셀까지 같음 / 곰팡이 없음 |
| 나3 `study/leaf-0.webp` | GPT 이미지(Codex CLI, `gpt-imagegen`)로 구멍 없는 잎을 만든 뒤, **구멍 자리만** 오려 `leaf-1.webp`에 붙임(나머지는 1번 장면 그대로) | 「Edit the attached image. It shows one dry brown oak leaf lying on a plain cream background, 16:9 landscape. Return the exact same picture: identical leaf outline, identical position and size … The only change: the leaf is completely intact … fill every hole and missing patch in the leaf blade with matching leaf tissue and continue the veins naturally … No text」 | `study/leaf-1.webp` | 잎 테두리·잎맥·색·위치가 1~3번과 같음 / 글자·워터마크 없음 |
| 나1 `places/workshop.webp` | GPT 이미지(Codex CLI)로 새로 그림 | 「Wide 16:9 background illustration for a children's science game: the interior of a sunlit bio workshop inside a wooden-framed glass greenhouse … warm wood workbenches along the left and right walls with glass fermentation jars, a yogurt maker, a small brick bread oven and a wooden compost crate, hanging vines and potted plants, large glass windows with soft green trees outside, warm golden afternoon light. Keep the centre of the floor open and calm (a UI panel covers it). Match the painterly anime game-background style, palette and lighting of the reference images exactly. No people, no characters, no text, no letters, no logos, no screens, no neon」 | `places/village.webp`, `places/fungi.webp`(화풍), `map/terrain.webp` 남서쪽 온실 공방(건물 모양) | 다른 구역과 같은 따뜻한 나무·식물·햇빛 톤, 가운데는 조용히 / 글자·로고·사람·네온 없음 |

## M3-3 배양 접시 집락 (2026-11-21 저녁, 사용자 요청 「세균들 실제 이미지 생성으로 더 리얼하게, 지금은 동그라미 모임처럼 보여서」)

| 그림 | 쓰는 곳 | 프롬프트 요지 | 뽑은 횟수 |
|---|---|---|---:|
| `study/germ/colonies-cream.webp` | 손바닥·문손잡이 접시(빵은 흙과 섞음) | 「12 separate bacterial colonies as they look on an agar culture plate, photographed straight from above … creamy white to ivory, glossy wet surface with a small specular highlight … loose 4 by 3 grid with wide empty space … Fully transparent background … match the attached petri dish photo. No text」 | 1 |
| `study/germ/colonies-soil.webp` | 화분 흙·빵 접시 | 같은 틀 + 「from garden soil … tan and light brown colonies with wrinkled, folded surfaces and irregular lobed edges; flat spreading ones with rough frilly margins; small dry chalky white powdery ones; orange-brown glossy ones」 | 1 |
| `study/germ/colonies-pond.webp` | 연못 물 접시 | 같은 틀 + 「from pond water … lemon-yellow glossy round, orange, pale translucent watery, soft pink, some with a darker centre ring」 | 1 |

- 참고 그림 `study/germ/petri.webp`. 투명 배경 원본에서 집락을 하나씩 오려(알파 연결 덩어리) 96px 칸 12개짜리 한 줄로 묶었다.
- 코드: `src/renderers/germ-games.ts` `drawDish`가 학생이 그은 지그재그 길을 따라 배양 일수만큼 커지는 규칙·개수는 그대로 두고, 단색 동그라미 대신 이 칸을 찍는다. 그림이 아직 안 불렸으면 예전 동그라미로 그리고 불린 뒤 다시 그린다. 빈 접시는 그대로.

## M5 효모 현미경 사진 (2026-11-22, 사용자 요청 「효모 실사 이미지로 해봐 현미경 관찰한 실사 이미지 느낌으로」)

| 그림 | 쓰는 곳 | 프롬프트 | 뽑은 횟수 |
|---|---|---|---:|
| `study/yeast.webp` (640×360 금빛 일러스트 → 1024×576 현미경 사진풍) | M5-2 「효모의 작용」 병 카드, M5-4 소개 카드(`src/artAssets.ts` 23행) | 「Photorealistic brightfield light microscope photograph of baker's yeast (Saccharomyces cerevisiae) cells at about 400x magnification, 16:9 landscape. About ten to fourteen oval and round single yeast cells spread across a pale, softly lit background, several cells clearly budding with a small round daughter bud attached at one end, one short chain of a mother cell with a bud. Each cell slightly translucent with a thin darker outline, a faint grainy interior and a small vacuole, gentle out-of-focus depth with a couple of cells slightly blurred, natural microscope illumination with a soft warm-grey vignette at the edges. Realistic scientific micrograph look, not an illustration. No text, no letters, no scale bar, no labels, no watermark.」 | 1 |

- 원본 `.tmp/yeast-20261122/yeast-micro-gen1.png`(1672×941), 옛 그림 `.tmp/yeast-20261122/yeast-now.png`. 확인 화면 `.tmp/yeast-20261122/shots-after/`(1280×800·1024×768·1920×1080, 카드 칸 203×114·162×91·269×120에 잘림 없이 들어감, 페이지 오류 0).
- 3D 모형 입력 사진 `assets/generated/models-20261122/yeast-3d-base.png`(흰 바탕, 싹 달린 효모 세포 하나, 위 사진을 참고 그림으로, 1회). 프롬프트: 「Product-style photo of a greatly enlarged realistic scientific model of ONE budding yeast cell, matching the cells in the attached micrograph: an oval mother cell with one small round daughter bud attached at one end, opaque smooth slightly glossy cell wall in pale beige-cream with very subtle granular texture and a faint ring where the bud joins. Single object, centered, three-quarter view from slightly above, soft even studio light with gentle shading, pure white background, no shadow plate, nothing else in the image. No text, no letters, no labels, no watermark.」
- 이 사진으로 `models/yeast.glb`를 다시 만들었다(Meshy 7.1, 권리 장부 53번 줄). 3D 창 확인 `.tmp/yeast-20261122/model-after/`(세 화면 크기, 처음·돌린 뒤·확대, 페이지 오류 0).
