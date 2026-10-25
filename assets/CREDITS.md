# 생명 코드 연구소 자료와 라이선스

## 도구·라이선스 검토 (2026-10-21)

로컬 package.json, 설치된 패키지의 LICENSE, 실제 public 파일을 대조한 기록이다. 새 생성 파일은 제작 담당자의 생성 기록과 함께 이 목록에 보충한다. 이 기록은 회사의 배포 계약이나 AI 서비스의 생성 당시 이용 조건을 대신 확정하지 않는다.

| 도구·자료 | 쓰는 곳 | 로컬에서 확인한 라이선스·경위 | 판정 | 조치 |
|---|---|---|---|---|
| Phaser 3.90.0 | 지도·탐구 장면의 2D 렌더링 | MIT, node_modules/phaser/LICENSE.md | PASS | 아래 저작권·허가문 보존 |
| EventEmitter3 5.0.4 | Phaser 의존성 | MIT, node_modules/eventemitter3/LICENSE | PASS | 아래 저작권·허가문 보존 |
| Three.js 0.181.1 | 이전 3D 코드 보존 | MIT, node_modules/three/LICENSE | PASS | 현재 실행 경로에서 사용하지 않아도 고지 보존 |
| Vite 7.2.2 | 개발·빌드 | MIT, 로컬 package.json | PASS | 개발 도구 |
| TypeScript 5.9.3 | 타입 검사 | Apache-2.0, 로컬 package.json | PASS | 개발 도구 |
| sharp 0.34.4 | 이미지 최적화 | Apache-2.0, 로컬 package.json | PASS | 개발 도구, 기존 이미지 최적화에 사용 |
| Vitest 3.2.4 / Playwright Test 1.56.1 | 테스트 | MIT / Apache-2.0, 로컬 package.json | PASS | 개발 도구 |
| Google Fonts Jua | 제목 | SIL Open Font License 1.1, public/assets/fonts/Jua-OFL.txt | PASS | 웹폰트 자체 제공, OFL 원문 동봉 |
| 기존 생성 배경·캐릭터 | 연구소 장식·지도·NPC | 기존 프로젝트 AI 생성 자료, 일부 생성 날짜·도구만 기록됨 | 확인 필요 | 납품 담당자가 생성 당시 계정·계약·상업 이용 조건을 대조해야 함 |
| 이번 제작 AI 이미지 | 새 지도·캐릭터·시설 이미지 | 기본 image_gen으로 프로젝트용 생성, 제작 담당자 기록과 연결 | 확인 필요 | 최종 파일 목록·생성 날짜·계정 이용 조건 기록을 납품 때 보존 |
| 배경 음악 2곡 (2026-10-25) | 지도·탐구 메인테마, 결과 화면 엔딩테마 | 제작자가 본인 Suno Premier 플랜 계정으로 직접 생성(가사 없음). Premier 플랜 생성물은 상업 이용 가능. 생성 기록: assets/generated/bgm-20261025.json | PASS | 원본 MP3 보관, 배포본은 AAC 96kbps로 변환 |
| 개념 영상 소리 | 개념 영상의 짧은 음 | 프로젝트 자체 합성 | PASS | 외부 음악 서비스·샘플 없음 |
| 효과음 | 클릭·채집·촬영·성공 등 | Kenney Interface Sounds 1.0 · CC0-1.0, public/assets/audio/KENNEY-LICENSE.txt | PASS | 파일별 매핑과 경위: public/assets/audio/sources.json |

앱 외 하위 프로젝트 package.json은 현재 검색에서 발견되지 않았다. 현재 프로젝트 package.json에서 Remotion, Highcharts, ag-Grid Enterprise, Handsontable, Font Awesome Pro, Spine 런타임 의존성은 발견되지 않았다. 외부 유료 도구로 제작한 영상 파일도 현재 사용하지 않는다. AI 이미지의 원본 경위·계약 확인이 남으므로 이 문서만으로 상업 납품 검수를 완료했다고 보지 않는다.

## 실제 사용 자료

| 파일·범위 | 출처·제작 경위 | 표시·사용 범위 |
|---|---|---|
| public/assets/places/greenhouse.webp | 기존 프로젝트의 연구소 배경 AI 생성 이미지 | 게임 배경, 과학 관찰 근거 아님 |
| _unused/public-assets-20261025/exploration-map.webp, map-terrain-v2.webp | 2026-10-18·10-21 기본 image_gen 생성. docs/MAP_ASSET_PROMPT.md에 프롬프트 기록 | 이전 탐험 지도. 현재 쓰지 않아 배포 폴더에서 뺌 |
| public/assets/map/terrain.webp | 2026-10-24 기본 image_gen, v2의 건물·보행 경로를 보존한 새 지도 | 현재 지도·로딩 중 풍경, 1280×720 |
| public/assets/study/{pond,bacteria,bread-0,leaf-0,yogurt,soil,milk,yeast}.webp, places/core.webp | 2026-10-24 기본 image_gen으로 각각 생성, docs/ART_GENERATION_20261024.md, assets/generated/study-20261024.json | 학습용 설명 그림·채집 장면·복구 연출, 실제 현미경 사진 아님 |
| public/assets/study/{deadwood,moldy-fruit,dough-before,dough-after,bread-1~3,leaf-1~3}.webp | 2026-10-25 기본 image_gen 생성·편집 10개. assets/generated/specimens-20261025.json에 전체 프롬프트와 파일별 기록 | 학습용 관찰 모형. 같은 식빵·낙엽·반죽의 전후 비교, 실제 실험 사진·측정 원자료 아님 |
| public/assets/map/moa-{down,right,up,left}.webp | 2026-10-21 기본 image_gen 자체 생성 | 갈색 묶은 머리·안경·연구 조끼의 모아, 투명 2.5D 픽셀 캐릭터 |
| public/assets/map/companion-{down,right,up,left}.webp | 2026-10-21 기본 image_gen 자체 생성 | 분홍 토끼 보조 캐릭터, 투명 2.5D 픽셀 캐릭터 |
| public/assets/characters/{moa,companion}-portrait.webp | 2026-10-21 기본 image_gen 자체 생성, 320×320 투명 | 시설 안내 초상, 과학 관찰 근거 아님 |
| public/assets/audio/bgm-{main,ending}-theme.m4a | 2026-10-25 Suno Premier 플랜 생성(제작자 계정). 받은 파일명 Morning Lab Discovery.mp3, Living Laboratory (1).mp3 | 배경 음악. 원본은 assets/generated/bgm-20261025/ |
| public/assets/fonts/jua-korean-400.woff2 | Google Fonts Jua, 제목용 한국어 웹폰트 | SIL OFL 1.1 |
| public/assets/fonts/jua-latin-400.woff2 | Google Fonts Jua, 제목용 라틴 웹폰트 | SIL OFL 1.1 |
| src/draw.ts 및 Phaser 탐구 도식 | 프로젝트 자체 제작 설명 모형 | 현미경 사진이나 실험 측정 원자료로 소개하지 않음 |
| src/experience.ts의 SVG 아이콘 | 프로젝트 자체 제작 선형 아이콘 | 공통 홈·이전·음소거·설정·탐구 도구 |
| src/audio.ts | 프로젝트 자체 제작 재생 코드. 효과음 파일이 없을 때만 짧은 음을 합성 | 배경 음악은 위 Suno 2곡 |

지도·캐릭터 생성 PNG 원본은 이미지 도구의 기본 생성 위치에 보존하고, 실제 사용하는 최적화 WebP는 D: 프로젝트의 public/assets 종류별 폴더에 둔다(규칙과 옛 이름 대조표: assets/README.md). 2026-10-24 학습 그림 원본은 assets/generated/study-20261024, 2026-10-25 표본 개선 원본은 assets/generated/specimens-20261025, 배경 음악 원본은 assets/generated/bgm-20261025에 보관한다. 새 시설 배경의 파일별 생성 기록은 제작 담당자가 추가한다. references 아래의 이미지 시안은 원본 보관 자료이며, 복사해서 사용하기 전 경위를 확인한다.

## 교육 내용 근거

- 교육부 2022 개정 과학과 교육과정: [4과12-01], [4과12-02], [4과12-03].
- 대조 자료: 경기도교육청 교육과정 PDF, https://www.goe.go.kr/resource/goe/na/bbs_2675/2025/11/b05e123f-8c12-4929-9914-319dea9b2099.pdf .
- 게임 안의 서식지·움직임·생활 영향·생명과학 활용 사례는 학습용으로 구성한다. 실제 생물 관찰 자료의 출처·동일 표본 여부·시간 조건은 교과 검수 대상이다.

## 프로그램 허가문

Phaser: Copyright (c) 2024 Richard Davey, Phaser Studio Inc.

EventEmitter3: Copyright (c) 2014 Arnout Kazemier.

Three.js: Copyright © 2010-2025 three.js authors.

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

Jua OFL 원문은 public/assets/fonts/Jua-OFL.txt에 동봉한다. 배포 폴더에도 이 고지와 사용한 라이선스 원문을 함께 전달한다.

## 자체 제작물 고지

ⓒ 2026 옐샘 & 아이스크림미디어. All rights reserved.

앱 화면 캡처·자체 제작 일러스트·자체 제작 음원은 무단 복제·재배포·전용·상업적 이용을 금지해요.

외부 공개 사진·효과음·폰트의 저작권은 각 원저작자와 소장 기관에 있으며, 각 자료의 공개 라이선스와 이용 조건을 따라요.
