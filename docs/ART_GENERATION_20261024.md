# 2026-10-24 생성 이미지 적용 기록

기본 `image_gen`으로 10장을 각각 생성했다. 여러 화면을 합친 이미지나 글자가 포함된 버튼 이미지는 만들지 않았다. 실제 UI·정답·시간 변화·드래그 판정은 DOM/Phaser/Canvas에서 처리한다.

최종 WebP는 `public/assets/`, PNG 원본은 `assets/generated/study-20261024/`, 크기·용량 목록은 `assets/generated/study-20261024.json`에 있다. 지도 원본 v2와 기존 캐릭터·배경은 보존했다.

## 생성 프롬프트

공통: one standalone 16:9 image, premium nature-science educational game, sage/teal/warm cream palette, tangible painterly details, no words, no labels, no UI, no borders, no collage. Specimen illustrations are explanatory models, not actual microscopy evidence.

| 최종 파일 | 최종 프롬프트의 개별 요청 | 실제 사용 |
|---|---|---|
| map-terrain-v3.webp | Composition reference: map-terrain-v2.webp. Preserve all six south-facing doorsteps and unobstructed tan walking paths: mushroom cottage 27.3%/27.1%, pond observatory 68.6%/27.1%, archive 84.2%/56.1%, village bakery 67%/80.8%, greenhouse 20.9%/75%, central botanical lab 50%/57.6%. Crisp hand-painted 2.5D pixel RPG forest science village, teal roofs, cream stone, gold sunlight. No characters. | 탐험 지도와 로딩 중 풍경 |
| study-pond.webp | Shallow tranquil forest pond, water on left 65%, mossy bank near lower left, water plants at 41%/49%, rightmost 25% empty pale wooden fieldwork surface. Quiet upper center for interactive pipette. No pipette or slide baked into scene. | 연못 채집과 물 관련 자료 |
| study-core.webp | Restored botanical core chamber, luminous green crystal seed within brass and glass mechanism on circular wooden pedestal at left 40%, five elegant glowing conduits, sunlit conservatory, quiet right 40% for DOM content. | 마지막 코어와 완료 화면 |
| study-bacteria.webp | Several separate rod-shaped and spherical sage/teal bacteria in pale warm microscope field, distinct silhouettes, no virus spikes, no invented nucleus or organelles. | 세균 근거 자료 |
| study-bread.webp | One fresh white bread slice viewed directly from above on warm cream linen, golden crust and visible crumb. No mold or spots. | 같은 표본의 시간 비교, 생활 사례 |
| study-leaf.webp | One dry oak-like fallen leaf with shallow lobes, ochre/brown tones and clear veins, full silhouette on pale cream paper. No holes or decay. | 같은 낙엽의 시간 비교 |
| study-yogurt.webp | One clear jar of plain white yogurt and a simple small wooden spoon, pale cream tabletop, soft sage fabric, no branding or label. | 요구르트 사례와 결과 |
| study-soil.webp | Small shallow cream porcelain dish of moist brown forest soil, visible granules and a tiny fallen leaf fragment, three-quarter top view on pale cream. | 흙 채집 장소 자료 |
| study-milk.webp | Simple unbranded clear glass bottle filled with white milk, small glass beside it, pale warm cream ground, full objects visible. | 설계의 우유 재료 |
| study-yeast.webp | Enlarged explanatory model of oval yeast cells, some with one small connected daughter bud, ochre cells on pale microscope field. No fuzzy hyphae, no bacteria rods, no invented internal organs. | 효모 작용 자료 |

빵의 곰팡이와 낙엽의 변화는 동일한 생성 원본 위에 고정 좌표로 그린다. 서로 다른 AI 그림을 전후 표본인 것처럼 제시하지 않는다. 정답 판정과 일치하는 위치 표시는 원본 좌표계로 유지한다.

## 확인

10개 WebP가 모두 양수 크기로 저장됐고, 지도/빵/낙엽/코어 원본과 대표 화면을 시각적으로 확인했다. 실제 기기·과학 자료 교과 검수와 계정별 생성 서비스 이용 조건 검토는 최종점검 보고서의 남은 항목이다.
