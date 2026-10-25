# 3D 모델 기본 이미지 · 생성 프롬프트

> 2026-10-25 · 메시(Meshy) image-to-3D로 GLB를 만들 때 쓰는 입력 이미지와 프롬프트 모음.
> 기본 이미지는 `assets/generated/models-20261025/`에 있다. 받은 GLB는 `public/assets/models/<파일명>.glb`로 넣는다.

## 한눈에 보기

| # | 모델 | 파일명 | 쓰는 곳 | 기본 이미지 | 삼각형 목표 | 우선 |
|---|---|---|---|---|---:|---|
| 1 | BIO CORE | `bio-core.glb` | 코어 복구 · 결과 화면 | 새로 생성 `bio-core-3d-base.png` | 25,000 | ★★★ |
| 2 | 버섯 | `mushroom.glb` | M1-2 갓 아래 관찰 · 도감 | 새로 생성 `mushroom-3d-base.png` | 15,000 | ★★★ |
| 3 | 빵 곰팡이 | `bread-mold.glb` | M1-3 균사·포자 관찰 · 도감 | 새로 생성 `mold-3d-base.png` | 15,000 | ★★ |
| 4 | 짚신벌레 | `paramecium.glb` | M2-3 발견 팝업 · 도감 | 새로 생성 `paramecium-3d-base.png` | 10,000 | ★★ |
| 5 | 효모 | `yeast.glb` | M5-2 효모 작용 · 도감 | 새로 생성 `yeast-3d-base.png` | 5,000 | ★ |
| 6 | 모아(연구원) | `moa.glb` | 결과 화면 등장 (선택) | 기존 `moa-3d-base.png` | 15,000 | 선택 |
| 7 | 토토(토끼 조수) | `companion.glb` | 결과 화면 등장 (선택) | 기존 `companion-3d-base.png` | 15,000 | 선택 |
| — | 세균 3종 · 해캄 | 코드로 만듦 | M3-2 모양 돌려보기 · M2-2 | 필요 없음 | — | 메시 불필요 |

- 지도·탐구 배경은 2D 그대로 둔다. 3D는 "돌려 봐야 보이는 것"과 마지막 보상 연출에만 쓴다.
- 3D는 해당 화면에서만 늦게 불러온다(첫 화면 로딩에 넣지 않음).
- 한 화면에 3D 모델은 1~2개만 띄운다. 합계 10만 삼각형 이하.

## 메시 공통 설정

```
Mode: Image to 3D
Texture: ON (single 1024x1024 texture, matte, no baked lighting)
PBR: OFF  (core만 ON 가능)
Symmetry: Auto
Topology: Triangle
Remesh: ON → Target polycount = 표의 삼각형 목표
Export: GLB
```

받은 뒤 블렌더에서 삼각형 수를 다시 세고, 넘으면 줄인 뒤 텍스처 1024 이하로 맞춘다. GLB 하나 1.5MB 이하가 목표.

---

## 1. BIO CORE — `bio-core.glb`

- **쓰는 곳:** 코어 복구 화면. 연구소 기록을 하나 끼울 때마다 해당 색 포트에 불이 들어오고, 다섯 개가 다 켜지면 결정이 돌면서 빛난다. 결과 화면 배경에도 천천히 회전.
- **기본 이미지:** `D:\iscreammedia_sc34\8 creatures\assets\generated\models-20261025\bio-core-3d-base.png`
- **확인할 것:** 포트 5개가 따로 떨어진 덩어리로 나오는지(코드에서 색을 켜야 함). 결정이 케이지와 붙어 버리면 결정만 따로 하나 더 만든다.

텍스처 프롬프트 (메시 입력칸)

```
polished warm brass cage and pedestal, dark walnut wood base, glowing faceted emerald-green crystal, five small glass tube ports with soft amber, aqua, sage green, peach and lavender glow, clean hand-painted game style
```

텍스트로 만들 때 (Text to 3D 대안)

```
Fantasy greenhouse-lab bio core device. Faceted emerald-green crystal held in an open brass cage of curved arms, on a round brass and walnut pedestal. Five small glass tube ports around the base. Stylized hand-painted game asset, clean shapes. Target polycount 25,000 triangles, single 1024 texture, game-ready for web (three.js, glTF).
```

기본 이미지 다시 만들 때 (힉스필드 gpt_image_2_5, 1:1, 1k, high)

```
Reference image for image-to-3D. A fantasy science-lab bio core device as a single object: a glowing green faceted crystal held inside an open brass cage of curved arms, on a round brass and dark-wood pedestal, five small glass tube ports around the base each with a different soft glow (amber, aqua, sage green, peach, lavender). Polished, ornate but clean, Victorian greenhouse laboratory style. Three-quarter view from slightly above, whole object centered with margin, pure white background, soft even studio lighting, no cast shadow, no text, no labels.
```

---

## 2. 버섯 — `mushroom.glb`

- **쓰는 곳:** M1-2 "버섯의 갓 아래를 자세히 살펴봐요". 돋보기 단계에서 학생이 버섯을 손가락으로 돌려 갓 아래 주름을 찾으면 현미경 단계가 열린다. 도감 "3D로 보기"에도 쓴다.
- **기본 이미지:** `D:\iscreammedia_sc34\8 creatures\assets\generated\models-20261025\mushroom-3d-base.png` (아래에서 올려다본 3/4 각도라 주름이 보임)
- **대안:** 기존 `public/assets/study/mushroom.webp` — 옆모습이라 주름 입체가 약하게 나올 수 있음.
- **확인할 것:** 갓 아래 주름이 결로 파여 있는지(텍스처만 그려져 있으면 다시). 자루와 갓이 한 덩어리여도 괜찮다.

텍스처 프롬프트

```
warm brown mushroom cap with soft speckles, many thin cream radiating gills under the cap, cream fibrous stem, dark soil clump at the base, soft hand-painted matte educational model
```

텍스트로 만들 때

```
Single forest mushroom educational model. Brown domed cap, many thin radiating gills modeled as real grooves under the cap, sturdy cream stem, small soil clump at the base. Stylized hand-painted, scientifically accurate shape. Target polycount 15,000 triangles, single 1024 texture, game-ready for web (three.js, glTF).
```

기본 이미지 다시 만들 때

```
Reference image for image-to-3D. A single forest mushroom specimen: warm brown domed cap with soft speckles, many thin radiating cream gills clearly visible under the cap, sturdy cream stem with fine fibrous texture, small soil clump at the base. Three-quarter view from slightly below so the gill underside is clearly visible. Stylized educational model, soft hand-painted matte texture, scientifically accurate shape, whole object centered with margin, pure white background, soft even studio lighting, no cast shadow, no text, no labels, no face.
```

---

## 3. 빵 곰팡이 — `bread-mold.glb`

- **쓰는 곳:** M1-3 "곰팡이에서 어떤 모양이 보이나요?". 돌려 보며 가는 실(균사)과 둥근 부분(포자가 든 주머니) 두 곳을 찾는다. 도감에도 쓴다.
- **기본 이미지:** `D:\iscreammedia_sc34\8 creatures\assets\generated\models-20261025\mold-3d-base.png`
- **확인할 것:** 줄기 5개가 서로 떨어져 있고 끝의 검은 공이 둥근지. 줄기가 녹아 붙거나 끊기면 다시 뽑는다. 실제 곰팡이를 크게 키운 "설명용 모형"이라는 문구를 화면에 함께 둔다.

텍스처 프롬프트

```
toasted bread cube base, soft white fuzzy thread mat on top, white stalks, round dark grey-black spore cases, soft hand-painted matte educational model
```

텍스트로 만들 때

```
Bread mold educational model, greatly enlarged. Small square piece of bread as a base, covered by a white fuzzy mat of thread-like hyphae, five separated upright white stalks each topped with a round dark spore case. Stylized hand-painted, chunky readable shapes. Target polycount 15,000 triangles, single 1024 texture, game-ready for web (three.js, glTF).
```

기본 이미지 다시 만들 때

```
Reference image for image-to-3D. Bread mold educational model: a small square piece of bread as the base, covered by a soft white fuzzy mat of thread-like hyphae, five upright white stalks of clearly separated, slightly chunky thickness, each topped with a round dark grey-black spore case. Three-quarter view from slightly above. Stylized educational model, soft hand-painted matte texture, toy-like but scientifically faithful, whole object centered with margin, pure white background, soft even studio lighting, no cast shadow, no text, no labels, no face.
```

---

## 4. 짚신벌레 — `paramecium.glb`

- **쓰는 곳:** M2-3 짚신벌레 관찰 뒤 발견 팝업에서 3D로 돌며 등장, 도감 "3D로 보기". 움직임(앞으로 나아가기·몸 비틀기)은 코드로 준다.
- **기본 이미지:** `D:\iscreammedia_sc34\8 creatures\assets\generated\models-20261025\paramecium-3d-base.png`
- **확인할 것:** 몸 한쪽의 오목한 홈(입 쪽 홈)이 실제로 파였는지. 섬모는 메시가 털로 못 만들면 텍스처로만 두고, 가장자리 털은 코드에서 짧은 선으로 덧그린다.

텍스처 프롬프트

```
pale cream-green slipper-shaped cell body, fine short hair-like cilia along the outline, oral groove on one side, a few small round dots inside, soft hand-painted matte educational model
```

텍스트로 만들 때

```
Single paramecium educational model, greatly enlarged. Slipper-shaped elongated oval body, oral groove indentation on one side, fine short cilia around the outline. Pale cream-green, stylized hand-painted, scientifically faithful shape. Target polycount 10,000 triangles, single 1024 texture, game-ready for web (three.js, glTF).
```

기본 이미지 다시 만들 때

```
Reference image for image-to-3D. A single paramecium educational model: slipper-shaped elongated oval body, pale cream-green opaque surface, covered with short fine hair-like cilia all around the outline, a visible oral groove indentation on one side, a few small round dots inside. Three-quarter top view. Stylized educational model, soft hand-painted matte texture, scientifically faithful shape, whole object centered with margin, pure white background, soft even studio lighting, no cast shadow, no text, no labels, no face.
```

---

## 5. 효모 — `yeast.glb`

- **쓰는 곳:** M5-2 빵 반죽 설계에서 "효모의 작용" 카드를 누르면 3D로 확대해 보기, 도감. 우선순위 낮음 — 크레딧이 남을 때.
- **기본 이미지:** `D:\iscreammedia_sc34\8 creatures\assets\generated\models-20261025\yeast-3d-base.png`
- **확인할 것:** 세포 하나 끝에 작은 혹(싹)이 붙어 있는지. 이게 효모가 늘어나는 모습(출아)을 보여 주는 부분이다.

텍스처 프롬프트

```
smooth golden-yellow oval cells, one with a small round bud, gentle highlights, soft hand-painted matte educational model
```

텍스트로 만들 때

```
Budding yeast cells educational model, greatly enlarged. Cluster of three smooth oval golden-yellow cells touching each other, one with a small round bud at its end. Stylized hand-painted. Target polycount 5,000 triangles, single 1024 texture, game-ready for web (three.js, glTF).
```

기본 이미지 다시 만들 때

```
Reference image for image-to-3D. Budding yeast cells educational model: a small cluster of three smooth oval golden-yellow cells touching each other, one cell with a small round bud growing from its end. Three-quarter view from slightly above. Stylized educational model, soft hand-painted matte texture, gentle highlights, whole object centered with margin, pure white background, soft even studio lighting, no cast shadow, no text, no labels, no face.
```

---

## 6·7. 캐릭터 (선택) — `moa.glb`, `companion.glb`

- **쓰는 곳:** 결과 화면에서 3D로 손 흔들며 등장. 지도·탐구 화면은 2D 그대로 둔다(화풍이 섞이면 오히려 어색함).
- **기본 이미지:** `D:\iscreammedia_sc34\8 creatures\assets\generated\models-20261025\moa-3d-base.png`, `companion-3d-base.png` (기존 전신 그림을 PNG로 바꾼 것. 321×800 · 305×650으로 작아서 얼굴 디테일이 뭉개질 수 있음)
- **메시 설정:** 위 공통 설정 + Pose: A-pose 끔(그림 자세 유지). 리깅·애니메이션은 메시 Auto-Rig를 쓰면 손 흔들기 정도만 쓴다.

텍스처 프롬프트 (모아)

```
cute chibi girl explorer, brown ponytail, round glasses, small leaf hair clip, cream shirt, olive green vest, khaki cargo pants, brown boots, shoulder bag, soft hand-painted toon style
```

텍스처 프롬프트 (토토)

```
cute chibi pink bunny scientist, long pink ears, goggles on forehead, white lab coat with pink trim, small crossbody bag, soft hand-painted toon style
```

---

## 메시 없이 코드로 만드는 것

| 모델 | 쓰는 곳 | 만드는 방법 |
|---|---|---|
| 세균 3종 (공·막대·나선 + 꼬리) | M3-2 "세균의 모양" 돌려보기 | Three.js 구·캡슐·나선 튜브. 색은 현재 `study/bacteria.webp`의 청록·초록 |
| 해캄 | M2-2 해캄 관찰 · 도감 | 반투명 원통 마디 + 안쪽 초록 나선 리본 |
| 현미경 (선택) | 시작 화면 장식 | 지금은 넣지 않음. 필요하면 아래 프롬프트로 이미지부터 만든다 |

현미경 기본 이미지 프롬프트 (필요할 때만, 1.5크레딧)

```
Reference image for image-to-3D. A classic student microscope as a single object: polished brass body, teal enamel arm and base, two focus knobs, round stage with a glass slide, small mirror under the stage. Stylized hand-painted educational game style, clean shapes. Three-quarter view, whole object centered with margin, pure white background, soft even studio lighting, no cast shadow, no text, no labels.
```

---

## GLB 받은 뒤

1. `D:\iscreammedia_sc34\_scratch\meshy\`에 원본 GLB를 둔다.
2. 블렌더로 삼각형·텍스처를 표의 목표에 맞추고 `public/assets/models/<파일명>.glb`로 내보낸다.
3. `assets/CREDITS.md`에 메시 작업 ID와 기본 이미지 경로를 적는다.

기본 이미지 생성 기록: [models-20261025.json](../assets/generated/models-20261025.json)
