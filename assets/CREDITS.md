# 생명 코드 연구소 자료와 라이선스

## 도구·라이선스 검토 (2026-10-21)

로컬 package.json, 설치된 패키지의 LICENSE, 실제 public 파일을 대조한 기록이다. 새 생성 파일은 제작 담당자의 생성 기록과 함께 이 목록에 보충한다. 이 기록은 회사의 배포 계약이나 AI 서비스의 생성 당시 이용 조건을 대신 확정하지 않는다.

| 도구·자료 | 쓰는 곳 | 로컬에서 확인한 라이선스·경위 | 판정 | 조치 |
|---|---|---|---|---|
| Phaser 3.90.0 | 지도·탐구 장면의 2D 렌더링 | MIT, node_modules/phaser/LICENSE.md | PASS | 아래 저작권·허가문 보존 |
| EventEmitter3 5.0.4 | Phaser 의존성 | MIT, node_modules/eventemitter3/LICENSE | PASS | 아래 저작권·허가문 보존 |
| Three.js 0.181.1 | 선택해서 여는 3D 설명 모형 보기(src/model-viewer.ts, 열 때만 따로 불러오는 묶음) | MIT, node_modules/three/LICENSE | PASS | 옛 3D 장면 lab3d.ts는 _unused/src-20261025/에 보관 |
| meshoptimizer 디코더 | 3D 모형 압축 해제(three.js 배포본 examples/jsm/libs/meshopt_decoder.module.js, 3D 보기 묶음에 포함) | MIT, three.js 배포본에 포함 | PASS | 2026-10-26 Draco 디코더 대신 사용. 옛 Draco 파일은 _unused/public-assets-20261026/libs-draco/ |
| gltfpack 1.3.0 | 3D 모형 줄이기·압축(scripts/pack-models.mjs) | MIT, 로컬 package.json | PASS | 개발 도구 |
| Vite 7.2.2 | 개발·빌드 | MIT, 로컬 package.json | PASS | 개발 도구 |
| TypeScript 5.9.3 | 타입 검사 | Apache-2.0, 로컬 package.json | PASS | 개발 도구 |
| sharp 0.34.4 | 이미지 최적화 | Apache-2.0, 로컬 package.json | PASS | 개발 도구, 기존 이미지 최적화에 사용 |
| Vitest 3.2.4 / Playwright Test 1.56.1 | 테스트 | MIT / Apache-2.0, 로컬 package.json | PASS | 개발 도구 |
| 네이버 나눔스퀘어 네오 | 현재 제목·버튼·본문(400·700) | SIL Open Font License 1.1, public/assets/fonts/NanumSquareNeo-OFL.txt | PASS | 공식 배포 출처·SHA-256은 NanumSquareNeo-SOURCE.json에 기록. 2026-11-11 두 배포 파일의 해시 일치 확인 |
| Google Fonts Jua | 개념영상 렌더용 글꼴 | SIL Open Font License 1.1, films/fonts/Jua-OFL.txt | PASS | 기존 파일·OFL 원문을 films/fonts/에 보관 |
| 기존 생성 배경·캐릭터 | 연구소 장식·지도·NPC | 기존 프로젝트 AI 생성 자료, 일부 생성 날짜·도구만 기록됨 | 확인 필요 | 납품 담당자가 생성 당시 계정·계약·상업 이용 조건을 대조해야 함 |
| 이번 제작 AI 이미지 | 새 지도·캐릭터·시설 이미지 | 기본 image_gen으로 프로젝트용 생성, 제작 담당자 기록과 연결 | 확인 필요 | 최종 파일 목록·생성 날짜·계정 이용 조건 기록을 납품 때 보존 |
| 배경 음악 2곡 (2026-11-04 교체) | 지도·탐구 메인테마, 결과 화면 엔딩테마 | 제작자가 본인 Suno Premier 플랜 계정으로 직접 생성(가사 없음). Premier 플랜 생성물은 상업 이용 가능. 생성 기록: assets/generated/bgm-20261104.json, 이전 곡: bgm-20261025.json | PASS | 원본 MP3 보관, 배포본은 AAC 96kbps로 변환 |
| 시작·복구 영상 2편 (2026-11-04) | 탐험 시작 뒤 도입, 코어 복구 뒤 결과 화면 | 프로젝트 자체 AI 생성 영상에 scripts/render-film.mjs로 색보정·자막·연출·효과음을 더함. 원본과 프롬프트: assets/generated/film-20261104/ | PASS | 배포본은 H.264 1080p |
| 기록 넘김·코어 가동 | bookFlip1, powerUp4 | Kenney · [RPG Audio](https://kenney.nl/assets/rpg-audio), [Digital Audio](https://kenney.nl/assets/digital-audio) · CC0 | 확인 | 짧은 구간을 편집 |
| 유리판 물방울 | water_drops.ogg | angeloyazar · [Object Dropping into Water](https://opengameart.org/content/object-dropping-into-water-0) · CC0 | 확인 | 한 방울 구간을 편집 |
| 개념 영상 소리 | 개념 영상의 짧은 음 | 프로젝트 자체 합성 | PASS | 외부 음악 서비스·샘플 없음 |
| 효과음 | 클릭·채집·촬영·성공 등 | Kenney Interface Sounds 1.0 · CC0-1.0, public/assets/audio/KENNEY-LICENSE.txt | PASS | 파일별 매핑과 경위: public/assets/audio/sources.json |

앱 외 하위 프로젝트 package.json은 현재 검색에서 발견되지 않았다. 현재 프로젝트 package.json에서 Remotion, Highcharts, ag-Grid Enterprise, Handsontable, Font Awesome Pro, Spine 런타임 의존성은 발견되지 않았다. 외부 유료 도구로 제작한 영상 파일도 현재 사용하지 않는다. AI 이미지의 원본 경위·계약 확인이 남으므로 이 문서만으로 상업 납품 검수를 완료했다고 보지 않는다.

## 실제 사용 자료

| 파일·범위 | 출처·제작 경위 | 표시·사용 범위 |
|---|---|---|
| public/assets/places/greenhouse.webp | 기존 프로젝트의 연구소 배경 AI 생성 이미지 | 게임 배경, 과학 관찰 근거 아님 |
| _unused/public-assets-20261025/exploration-map.webp, map-terrain-v2.webp | 2026-10-18·10-21 기본 image_gen 생성. docs/MAP_ASSET_PROMPT.md에 프롬프트 기록 | 이전 탐험 지도. 현재 쓰지 않아 배포 폴더에서 뺌 |
| public/assets/study/{spoiled-milk,tooth,bacteria}.webp | 2026-10-25 Higgsfield MCP gpt_image_2_5로 프로젝트용 자체 생성(세균 그림은 기존 그림을 화풍 참고로 다시 그림). 원본 assets/generated/study-20261025b/, 기록 assets/generated/study-20261025b.json | 학습용 설명 모형. 실제 현미경·임상 사진 아님 |
| public/assets/ui/hand-lens.webp · yogurt-maker.webp · water-glass.webp · starter.webp | 2026-11-03 OpenAI image_gen으로 생성한 황동 손돋보기, 소형 요구르트 발효기, 물컵과 식품용 유산균 가루. WebP로 최적화 | 움직이는 관찰 도구와 가상 발효 실험 소품 |
| public/assets/ui/{microscope-frame,dropper,slide,water-drop,notebook,tape,badge-M1~M5}.webp | 2026-10-25 Higgsfield MCP gpt_image_2_5(고화질·투명 배경)로 프로젝트용 자체 생성. 원본 PNG는 assets/generated/props-20261025/, 프롬프트·작업 ID는 assets/generated/props-20261025.json, 변환은 scripts/ui-props.mjs | 탐구 소품·스테이지 배지. 장식·조작 소품이며 과학 관찰 근거 아님 |
| public/assets/map/terrain.webp | 2026-10-24 기본 image_gen, v2의 건물·보행 경로를 보존한 새 지도 | 현재 지도·로딩 중 풍경, 1280×720 |
| public/assets/study/{pond,bacteria,bread-0,leaf-0,yogurt,soil,milk,yeast}.webp, places/core.webp | 2026-10-24 기본 image_gen으로 각각 생성, docs/ART_GENERATION_20261024.md, assets/generated/study-20261024.json | 학습용 설명 그림·채집 장면·복구 연출, 실제 현미경 사진 아님 |
| public/assets/study/{deadwood,moldy-fruit,dough-before,dough-after,bread-1~3,leaf-1~3}.webp | 2026-10-25 기본 image_gen 생성·편집 10개. assets/generated/specimens-20261025.json에 전체 프롬프트와 파일별 기록 | 학습용 관찰 모형. 같은 식빵·낙엽·반죽의 전후 비교, 실제 실험 사진·측정 원자료 아님 |
| public/assets/map/moa-{down,right,up,left}.webp | 2026-10-21 기본 image_gen 자체 생성 | 갈색 묶은 머리·안경·연구 조끼의 모아, 투명 2.5D 픽셀 캐릭터 |
| public/assets/map/companion-{down,right,up,left}.webp | 2026-10-21 기본 image_gen 자체 생성 | 분홍 토끼 보조 캐릭터, 투명 2.5D 픽셀 캐릭터 |
| src/renderers/core3d.ts, src/renderers/core-apparatus.ts | 2026-11-06, Three.js 기본 도형과 직접 구성한 결정 면으로 황동 링·포트·회전 장치 제작 | 중앙 연구소에서만 불러오는 실시간 3D 모형 |
| public/assets/ui/{bio-core,bio-core-powered}.webp | 2026-11-06, Blender에서 프로젝트용 황동·초록 결정 모형을 직접 구성해 고정 카메라로 렌더링. 재현 코드 scripts/render-core-figure.py | 중앙 연구소의 가상 코어 장치, 포트 점등과 안내는 별도 DOM |
| public/assets/ui/og-life-code-v1.jpg | 2026-11-05 기존 greenhouse.webp, logo.webp, moa-full.webp, companion-full.webp를 Sharp로 합성(1200×600) | 링크 공유용 썸네일. 신규 표본이나 현미경 사진 아님 |
| public/assets/ui/icon-{192,512}.png | 2026-10-25 companion-portrait.webp(위 자체 생성 토토 초상)를 #315f46 바탕에 sharp로 합성한 2차 이미지 | 홈 화면 앱 아이콘(manifest.webmanifest) |
| public/assets/characters/{moa,companion}-portrait.webp | 2026-10-21 기본 image_gen 자체 생성, 320×320 투명 | 시설 안내 초상, 과학 관찰 근거 아님 |
| public/assets/study/{mushroom-spores,mold-lens,spirogyra-lens,mushroom-mycelium}.webp | 2026-10-25 Higgsfield gpt_image_2_5(기존 학습 그림을 화풍 참고로 사용) 생성 4장, 6크레딧. 기록: assets/generated/study-20261025c.json | 확대 단계(돋보기·현미경)와 균사 단면 설명 모형. 실제 현미경 사진 아님 |
| public/assets/study/bacteria.webp, bacteria-{round,rod,spiral}.webp | assets/generated/study-20261025b/bacteria.png(자체 생성)을 scripts/recolor-bacteria.mjs로 염색 색(보라·자주)으로 바꾸고 세 모양을 잘라 냄 | 세균 모양 설명 모형. 이전 초록 그림은 _unused/로 이동 |
| public/assets/models/{mushroom,bread-mold,paramecium,yeast}.glb | 2026-10-25 사용자 Meshy 계정 image-to-3D(입력: 자체 생성 기본 그림 assets/generated/models-20261025/*-3d-base.png). 2026-10-26 scripts/pack-models.mjs로 텍스처를 줄이고 gltfpack으로 UV 이음매를 고정한 채 줄여 meshopt 압축. 기록: assets/generated/models-20261025.json | 선택해서 여는 3D 설명 모형. Meshy 생성물의 상업 이용 조건은 생성 당시 계정 플랜 기준 — 납품 전 확인 |
| public/assets/audio/bgm-{main,ending}-theme.m4a | 2026-11-04 Suno Premier 플랜 생성(제작자 계정). 받은 파일명 main.mp3, final.mp3 | 배경 음악. 원본은 assets/generated/bgm-20261104/ |
| public/assets/film/{intro,final}.{mp4,vtt,webp} | 2026-11-04 제작자 제공 영상을 scripts/render-film.mjs로 가공 | 시작·복구 영상. 원본은 assets/generated/film-20261104/ |
| public/assets/fonts/NanumSquareNeoTTF-{bRg,cBd}.woff2 | 네이버 나눔스퀘어 네오, 현재 UI용 보통·굵은 웹폰트. 공식 배포 출처와 해시는 같은 폴더의 NanumSquareNeo-SOURCE.json | SIL OFL 1.1, NanumSquareNeo-OFL.txt 동봉 |
| films/fonts/jua-korean-400.woff2 | Google Fonts Jua, 개념영상 렌더용 한국어 웹폰트 | SIL OFL 1.1 |
| films/fonts/jua-latin-400.woff2 | Google Fonts Jua, 개념영상 렌더용 라틴 웹폰트 | SIL OFL 1.1 |
| src/draw.ts 및 Phaser 탐구 도식 | 프로젝트 자체 제작 설명 모형 | 현미경 사진이나 실험 측정 원자료로 소개하지 않음 |
| src/experience.ts의 SVG 아이콘 | 프로젝트 자체 제작 선형 아이콘 | 공통 홈·이전·음소거·설정·탐구 도구 |
| src/audio.ts | 프로젝트 자체 제작 재생 코드. 효과음 파일이 없을 때만 짧은 음을 합성 | 배경 음악은 위 Suno 2곡 |

지도·캐릭터 생성 PNG 원본은 이미지 도구의 기본 생성 위치에 보존하고, 실제 사용하는 최적화 WebP는 D: 프로젝트의 public/assets 종류별 폴더에 둔다(규칙과 옛 이름 대조표: assets/README.md). 2026-10-24 학습 그림 원본은 assets/generated/study-20261024, 2026-10-25 표본 개선 원본은 assets/generated/specimens-20261025, 배경 음악 원본은 assets/generated/bgm-20261104(이전 곡은 bgm-20261025)에, 영상 원본은 assets/generated/film-20261104에 보관한다. 새 시설 배경의 파일별 생성 기록은 제작 담당자가 추가한다. references 아래의 이미지 시안은 원본 보관 자료이며, 복사해서 사용하기 전 경위를 확인한다.

## 교육 내용 근거

- 교육부 2022 개정 과학과 교육과정: [4과12-01], [4과12-02], [4과12-03].
- 대조 자료: 경기도교육청 교육과정 PDF, https://www.goe.go.kr/resource/goe/na/bbs_2675/2025/11/b05e123f-8c12-4929-9914-319dea9b2099.pdf .
- 설명 참고 문헌(2026-10-25 리뷰 수정 때 읽고 연결, 본문·그림은 옮겨 싣지 않음): OpenStax Biology 2e(CC BY 4.0) 24.1 균류의 특징, 22.2 원핵생물의 구조, 23.3 원생생물의 무리 · FAO 발효유 자료 부록 VII(x4888e). 앱에서는 이름과 누리집(openstax.org, fao.org)을 링크 없이 글자로만 표시한다.
- 게임 안의 서식지·움직임·생활 영향·생명과학 활용 사례는 학습용으로 구성한다. 실제 생물 관찰 자료의 출처·동일 표본 여부·시간 조건은 교과 검수 대상이다.

## 프로그램 허가문

Phaser: Copyright (c) 2024 Richard Davey, Phaser Studio Inc.

EventEmitter3: Copyright (c) 2014 Arnout Kazemier.

Three.js: Copyright © 2010-2025 three.js authors.

meshoptimizer — Copyright (C) 2016-2024, by Arseny Kapoulkine (arseny.kapoulkine@gmail.com)

위 MIT 구성 요소에 적용하는 허가문:

```text
The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

현재 UI용 나눔스퀘어 네오의 OFL 원문은 `public/assets/fonts/NanumSquareNeo-OFL.txt`에 동봉한다. 개념영상 Jua의 OFL 원문은 기존 글꼴과 함께 `films/fonts/Jua-OFL.txt`에 보관한다. 배포 폴더에도 이 고지와 사용한 라이선스 원문을 함께 전달한다.

## 복구 지도 주민 일러스트 (2026-11-02)

기존 길잡이 토토의 지도 그림을 화풍 참고로 사용해 표본지기 솔비, 물길지기 여울, 기록원 두리, 정원사 밤톨, 발효 장인 보리를 각각 생성했다. 투명 배경을 유지한 WebP 다섯 장을 `public/assets/map/residents/`에 두고 지도, 귀환 장면과 대화에서 함께 사용한다.

## 자체 제작물 고지

ⓒ 2026 옐샘 & 아이스크림미디어. All rights reserved.

앱 화면 캡처·자체 제작 일러스트·자체 제작 음원은 무단 복제·재배포·전용·상업적 이용을 금지해요.

외부 공개 사진·효과음·폰트의 저작권은 각 원저작자와 소장 기관에 있으며, 각 자료의 공개 라이선스와 이용 조건을 따라요.


## 2026-11-10 방해 구름 보충

지도 속 보라색 방해 구름은 OpenAI 이미지 생성으로 제작한 상상 캐릭터다. 실제 균류·세균·바이러스를 묘사하지 않으며 학생 가이드에도 구별을 명시했다. 생성 원본·제작 지시 요약·SHA-256·가공 규격은 `generated/20261110/confusion-cloud-v2-provenance.json`에 보관한다. 실행용 `public/assets/characters/confusion-cloud-v2.webp`는256×256 투명 WebP다. 기존 그림의 권리 확인을 대신하는 기록은 아니다.

시작/마무리 이야기 MP4는 기존 영상에서720p H.264로 재인코딩했다. AAC 음성·재생 시간·자막 내용은 바꾸지 않았다. 이전 커밋61d6ee3에 원본이 보존되어 있다.

## 2026-11-12 과학 설명 그림

크기 사다리의 머리카락 한 가닥과 균사 한 가닥, 표본 준비용 평평한 받침 유리판을 Higgsfield 연결 도구의 OpenAI GPT Image 2.6으로 생성했다. 수채화 관찰 노트에 맞춘 교육용 설명 모형이며 크기 수치·측정 방향은 앱의 글자로 표시한다. 원본 PNG와 실제 프롬프트·모델·작업 ID·파일 해시는 `assets/generated/20261112/provenance.json`에 기록했다. 원본을 직접 열어 확인하고 WebP로 줄여 적용했다.

| 파일 | 용도 |
|---|---|
| `assets/study/hair-shaft.webp` | 머리카락 한 가닥의 굵기 설명 |
| `assets/study/hypha-thread.webp` | 둥근 포자주머니와 구별한 균사 굵기 설명 |
| `assets/ui/slide-flat.webp` | 표본 한 방울을 올리는 얇고 평평한 유리판 |

사용 계정과 생성 서비스의 적용 이용 조건 확인은 납품 권리 검토에 포함한다.

## 2026-11-12 지도 주민 대화

- `public/assets/map/residents/dialogue/`: 기존 다섯 주민의 의상과 소품을 참조해 Codex GPT 이미지 도구로 생성한 두 표정 시트. 지도 아이콘은 기존 그림 그대로다.
- `public/assets/audio/voice/M[1–5]-*.mp3`: 한국어 대사 20개를 ElevenLabs v4로 다시 생성. 생성 ID, 음색, 전사, 길이와 해시는 같은 폴더의 `elevenlabs-residents-20261112.json` 참고. 이전 Momo 목록은 과거 제작 이력으로 남긴다.
