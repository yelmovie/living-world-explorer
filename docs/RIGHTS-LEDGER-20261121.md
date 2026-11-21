# 08 생명 코드 연구소 · 권리 장부 (2026-11-21)

운영 빌드에 들어가는 그림·영상·음악·효과음·목소리·글꼴·3D 모형·프로그램 묶음을 한 줄씩 적었다. 파일이 많은 것은 폴더·묶음 단위로 묶었다.

- **기준:** 저장소 `main` HEAD `3bcdc70`의 작업 트리 `public/`(2단계 D6에서 지운 3개 `map-villain-left.webp`·`paramecium-live.mp4`·`spirogyra-poster.webp`는 빠진 상태로 셈, `e04ecd4`). 빌드는 `public/`을 그대로 복사하고 `vite.config.ts`가 `assets/CREDITS.md`를 함께 내보낸다. `src/`에서 import하는 그림·소리 파일은 없다(JSON 데이터와 npm 프로그램 묶음만 import).
- **근거를 찾은 곳:** `assets/CREDITS.md`, `assets/README.md`, `assets/generated/**`, `asset-bank/original/**`, `public/assets/**/*.json|*.txt`, `docs/*.md`, `docs/reviews/NPC-VOICE-20261107.json`, `references/`(원본 디자인 팩), `git log`, `_shared/`(`voice-provenance-20261118.md`, `sfx-library-20261117/`, `reward-cards/`, `MAP-VILLAINS-HANDOFF-20261114.md`), `_scratch/`(`reward-cards-20261118/`, `map-redraw-20261114/`), `.tmp/`(작업 임시 폴더).
- **C2PA:** OpenAI·Google 생성 파일 안에 들어 있는 출처 표시(C2PA, 「trainedAlgorithmicMedia」)를 `strings`로 읽었다. 이 표시는 "어느 회사 도구로 만들었는지"와 생성 시각만 알려 주고, 계정·요금제·이용 조건은 알려 주지 않는다.
- **상태 기준:**
  - **확인됨** — 만든 곳, 날짜, 이용 조건이 모두 기록에 있다.
  - **근거 약함** — 기록은 있지만 도구·날짜·이용 조건 중 하나 이상이 빠졌다(대부분 생성 계정의 요금제·이용 조건 기록이 없음).
  - **출처 미확인** — 어떻게 만들었는지 기록을 찾지 못했다.
  - 합성·파생물은 들어간 재료 중 가장 약한 상태를 따른다.
- 성취 카드 연출 코드 `src/reward-cards.*`와 카드 그림 만드는 방식은 과학34 16개 프로젝트가 함께 쓰는 공통 모듈이다(`_shared/reward-cards/`).

## 1. 그림 — 원본 디자인 팩(`references/`)에서 온 것

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 1 | `public/assets/places/{fungi,greenhouse,water,archive,village}.webp` (5장, 1600×900; workshop은 2026-11-21 48번 줄로 바뀜) | ChatGPT 이미지 생성. 원본 디자인 팩 그림을 줄이거나 자른 것: fungi·greenhouse ← `chatgpt_full_018.png`, water ← `020`, archive ← `024`, village ← `025`, workshop ← `022` (축소 화면 비교로 대조, 차이 4~6/255) | 원본 C2PA 생성 시각 2026-09-25. 저장소 반입 2026-10-18(greenhouse, `2430634`)·2026-10-25(나머지, `eaf8dd8`, 당시 이름 `facility-*.webp`). 프롬프트 기록 없음. 원본 해시는 `references/source-inventory.csv` | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `references/images/backgrounds/chatgpt_full_0{18,20,22,24,25}.png`, `references/source-inventory.csv`, `docs/ASSET_PLAN.md` 2장, `assets/CREDITS.md` | 확인됨(사용자 확인) |
| 2 | `public/assets/ui/logo.webp` (1500×500) | ChatGPT 이미지 생성. 원본 `references/images/branding/chatgpt_image_028.png`를 줄인 것(대조 차이 5.7) | 원본 C2PA 2026-10-06. 반입 2026-10-25(`eaf8dd8`). 프롬프트 기록 없음 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `references/images/branding/chatgpt_image_028.png`, `assets/README.md` | 확인됨(사용자 확인) |
| 3 | `public/assets/characters/{moa-full,companion-full}.webp` | ChatGPT 이미지 생성. 설정화 시트의 첫 전신 그림을 오려 낸 것: 모아 ← `chatgpt_image_029.png`, 토토 ← `chatgpt_image_023.png` (그림을 열어 같은 자세·옷·소품 확인) | 원본 C2PA 2026-10-06(029)·2026-09-25(023). 반입 2026-10-25(`eaf8dd8`). 오려 낸 기록·프롬프트 없음 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `references/images/characters/chatgpt_image_0{23,29}.png` | 확인됨(사용자 확인) |

## 2. 그림 — ChatGPT·Codex 내장 이미지 도구(image_gen·GPT 이미지)

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 4 | `characters/{moa,companion}-portrait.webp`, `map/{moa,companion}-{down,right,up,left}.webp` (10장) | 내장 image_gen | 2026-10-21. 프롬프트·가공 방법 기록 있음 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `public/assets/map/generation.json`, `assets/CREDITS.md` | 확인됨(사용자 확인) |
| 5 | `map/terrain.webp`, `places/core.webp`, `study/{pond,yogurt,soil,milk,yeast}.webp` (7장; bread-0·leaf-0은 2026-11-21 49·50번 줄로 바뀜) | 내장 image_gen | 2026-10-24. 파일별 프롬프트·원본 PNG | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/generated/study-20261024.json`, `docs/ART_GENERATION_20261024.md`, `docs/MAP_ASSET_PROMPT.md` | 확인됨(사용자 확인) |
| 6 | `study/{deadwood,moldy-fruit,dough-before,dough-after,bread-1,bread-2,bread-3,leaf-1,leaf-2,leaf-3}.webp` (10장) | 내장 image_gen(생성·편집) | 2026-10-25. 파일별 전체 프롬프트·원본 PNG | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/generated/specimens-20261025.json`, `assets/generated/specimens-20261025/` | 확인됨(사용자 확인) |
| 7 | `ui/{hand-lens,yogurt-maker,water-glass,starter}.webp` (4장) | OpenAI image_gen | 2026-11-03(CREDITS 표). 프롬프트·원본 기록 없음. 반입 커밋 `211d381` | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/CREDITS.md` 「실제 사용 자료」 표 | 확인됨(사용자 확인) |
| 8 | `map/residents/{solbi,yeoul,duri,bamtol,bori}.webp` (5장) | 생성 도구 이름 기록 없음(「토토 지도 그림을 화풍 참고로 생성」만 적힘) → **Codex(GPT 이미지), 사용자 확인 2026-11-21** | 2026-11-02 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/CREDITS.md` 「복구 지도 주민 일러스트」 절 | 확인됨(사용자 확인) |
| 9 | `map/residents/dialogue/{solbi,yeoul,duri,bamtol,bori}.webp` (5장, 두 표정 시트) | Codex GPT 이미지 도구 | 2026-11-12. 프롬프트 기록 없음 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/CREDITS.md` 「지도 주민 대화」 절 | 확인됨(사용자 확인) |
| 10 | `map/{moa,toto}-walk.webp`, `ui/{moa,toto}-microscope.webp`, `ui/{moa,toto}-naked-eye.webp` (6장) | Codex 내장 image_gen + `scripts/pack-map-walk.mjs` | 2026-11-15. 프롬프트·원본 경로 기록 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/generated/map-walk-20261115.json`, `asset-bank/original/map-walk-20261115/` | 확인됨(사용자 확인) |
| 11 | `characters/moa-dialogue.webp` | 합성: 1번 줄 `moa-full` 상반신 + image_gen 입 모양(`scripts/pack-moa-dialogue.mjs`) | 2026-11-15 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/CREDITS.md`, `assets/generated/map-walk-20261115.json`(dialoguePortrait) | 확인됨(사용자 확인) |
| 12 | `map-encounter/{map-hero-reaction,map-ally-reaction,map-villain-poses-left}.webp` (3장, 지도 전투 시트) | 새로 그린 시트. 악당 원본 `_scratch/map-redraw-20261114/raw/8.png`, 주인공·동료 원본 `_scratch/villain-resume-20261114/08-actors-original.png`에 ChatGPT C2PA(2026-11-13) | 2026-11-14 커밋 `b6ede2f`·`2b58f5c`. 프롬프트 기록 없음 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `_shared/MAP-VILLAINS-HANDOFF-20261114.md` 126행 이하, `_scratch/map-redraw-20261114/README.md` | 확인됨(사용자 확인) |
| 13 | `study/fungi-{gills,sporangium,spores,threads}.webp` (4장, M1 카드) | ChatGPT 이미지(원본 PNG C2PA) | 원본 C2PA 2026-11-16, 반입 커밋 `ea66d10`(11-17). 프롬프트 기록 없음 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `asset-bank/original/m1-20261116/card-*.png` | 확인됨(사용자 확인) |
| 14 | `ui/game/*.webp` (11장: 아이콘 4·램프 2·도장 손잡이·초점 다이얼·퇴비 상자·오븐·삽) + `study/rumor-note.webp` | ChatGPT 이미지(원본 시트 PNG C2PA). 커밋 `eb10af9`에 「GPT-made icons, lamps and a stamp」 | 원본 C2PA 2026-11-16, 반입 커밋 `eb10af9`·`f153b9f`·`7d3efc8`(11-17). 프롬프트 기록 없음. 어느 아이콘이 어느 시트에서 나왔는지 표 없음(그림으로 보면 `icons-m5`=오븐·삽·상자, `icons-props`=램프·도장, `icons-swipe`=아이콘 4개) | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `asset-bank/original/games-20261116/{icons-m5,icons-props,icons-swipe,focus-knob,rumor-card}.png` | 확인됨(사용자 확인) |
| 15 | `study/germ/{bug-chain,bug-rod,bug-round,bug-spiral,bug-tail,petri,sample-doorknob,sample-hand,swab,zoom-bacteria}.webp` (10장, M3) | `gpt-imagegen` 스킬(Codex GPT 이미지). 원본 PNG에 ChatGPT C2PA | 2026-11-17. 실행 스크립트에 프롬프트 전부 기록. `zoom-bacteria`는 11-18 `33128e8`에서 다시 바뀜 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/generated/m3-20261117/run.sh`, `assets/generated/m3-20261117/*.png`, `docs/M3-REDESIGN-20261117.md` | 확인됨(사용자 확인) |
| 16 | `study/germ/{zoom-1,zoom-10,zoom-100,zoom-1000,zoom-paramecium,zoom-bacteria-sprites}.webp` (6장, M3-1 확대) | ChatGPT 이미지(원본 PNG C2PA) | 원본 C2PA 2026-11-17~18, 커밋 `33128e8`. 문서에는 「GPT 이미지」 한 줄만, 프롬프트 없음. **원본이 임시 폴더 `.tmp/zoom/`에만 있음** | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `docs/M3-REDESIGN-20261117.md` 94행, `.tmp/zoom/gen-{1,10,100-clean,1000,1000-clean}.png`, `.tmp/zoom/p100.png` | 확인됨(사용자 확인) |
| 17 | `ui/slide-drop.webp` (M2-1 유리판) | ChatGPT 이미지(원본 PNG C2PA) | 원본 C2PA 2026-11-18, 커밋 `b44f522`. 프롬프트 없음. **원본이 `.tmp/drop/`에만 있음** | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `.tmp/drop/slide-drop-gen.png` | 확인됨(사용자 확인) |
| 18 | `reward-cards/card-{1..5}-M{1..5}.webp`(640×960), `thumb-{1..5}-M{1..5}.webp`(96×144) (10장) | `gpt-imagegen` 스킬(Codex GPT 이미지), 모아·토토·연구소 배경을 화풍 참고로 붙임. 글자·테두리는 코드 | 2026-11-18 12:26~12:33(UTC) 생성 로그, 카드별 장면 설정, 생성 스크립트(공통 프롬프트), 원본 PNG | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `_scratch/reward-cards-20261118/{queue.mjs,specs/08.json,queue.log,gen/08/}`, `_shared/reward-cards/{INTEGRATION.md,convert.cjs}`, `assets/CREDITS.md` | 확인됨(사용자 확인) |

## 3. 그림 — Higgsfield 연결 도구

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 19 | `ui/{microscope-frame,dropper,slide,water-drop,notebook,tape,badge-M1~M5}.webp` (11장) | Higgsfield MCP · gpt_image_2_5 | 2026-10-25. 프롬프트·작업 ID·크레딧 기록 | Higgsfield 요금제·이용 조건 기록 없음 | `assets/generated/props-20261025.json`, `scripts/ui-props.mjs` | 근거 약함 |
| 20 | `study/{spoiled-milk,tooth,bacteria,bacteria-round,bacteria-rod,bacteria-spiral}.webp` (6장) | Higgsfield MCP · gpt_image_2_5. 세균 세 모양은 `bacteria.png`를 `scripts/recolor-bacteria.mjs`로 염색·자름 | 2026-10-25. 프롬프트·작업 ID | 기록 없음 | `assets/generated/study-20261025b.json` | 근거 약함 |
| 21 | `study/{mushroom-spores,mold-lens,spirogyra-lens,mushroom-mycelium}.webp` (4장) | Higgsfield MCP · gpt_image_2_5 | 2026-10-25. 프롬프트·작업 ID | 기록 없음 | `assets/generated/study-20261025c.json` | 근거 약함 |
| 22 | `study/{hair-shaft,hypha-thread}.webp`, `ui/slide-flat.webp` (3장) | Higgsfield 연결 도구 · OpenAI GPT Image 2.6 | 2026-11-12. 프롬프트·모델·작업 ID·해시 | 기록 없음(CREDITS 「납품 권리 검토에 포함」) | `assets/generated/20261112/provenance.json` | 근거 약함 |

## 4. 그림 — 출처 미확인 → 2026-11-21 사용자 확인으로 확인됨

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 23 | `study/{mushroom,mold,paramecium,spirogyra}.webp` (4장, 793×496, 수채 도감풍 관찰 그림) | **기록 없음.** `assets/generated`·`asset-bank`·`docs`·`references`·`.tmp`·`_shared`·`_scratch`를 이름으로 찾았고, `references` 원본 38장과 축소 대조도 했지만 일치하는 원본이 없다 → **Codex(GPT 이미지), 사용자 확인 2026-11-21** | 2026-10-25 `eaf8dd8`에서 `specimen-{mushroom,mold,paramecium,spirogyra}.webp`로 처음 들어옴. 생성 기록·프롬프트·원본 없음. **2026-11-21 생성 기록 대조(`_shared/CODEX-IMAGE-RECORDS-20261121.md` 방법):** 색인 `index.jsonl`·`index-claude.jsonl`의 08번 기록 33건(11-15 Codex 8건, 11-16~18 `gpt-image.sh` 25건)에 이 4장은 없음. `~/.claude/projects`·`~/.codex/sessions/2026/10`(10-28부터 남음)에서 `specimen-mushroom`·`8 creatures`를 찾아도 없음. 들어온 날(10-25)이 이 맥의 Codex 이미지 기록 시작(11-05)보다 앞서 기계 기록으로는 확인할 수 없음 → 「출처 미확인」 유지 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | (근거 없음) 사용처: `src/artAssets.ts` 6~9행, `src/renderers/pond-summary.ts`, `src/observation-masks.json` | 확인됨(사용자 확인) |

## 5. 그림 — 직접 만든 것·합성

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 24 | `ui/{bio-core,bio-core-powered}.webp` | Blender에서 직접 만든 모형을 고정 카메라로 렌더(재현 스크립트 있음) | 2026-11-06 | 자체 제작 | `scripts/render-core-figure.py`, `assets/CREDITS.md` | 확인됨 |
| 25 | 코드로 그리는 그림: `src/draw.ts`·Phaser 탐구 도식, `src/experience.ts` SVG 아이콘, `src/renderers/core3d.ts`·`core-apparatus.ts` | 자체 코드 | CREDITS 「실제 사용 자료」 | 자체 제작 | `assets/CREDITS.md` | 확인됨 |
| 26 | `ui/icon-{192,512}.png` (앱 아이콘) | 합성: 4번 줄 `companion-portrait.webp`를 단색 바탕에 sharp로 올림 | 2026-10-25 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/CREDITS.md`, `public/manifest.webmanifest` | 확인됨(사용자 확인) |
| 27 | `ui/og-life-code-v1.jpg` (링크 공유 썸네일 1200×600) | 합성: `greenhouse`·`logo`·`moa-full`·`companion-full`(1~3번 줄) | 2026-11-05 | ChatGPT 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/CREDITS.md`, `docs/DEPLOYMENT.md` | 확인됨(사용자 확인) |

## 6. 영상

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 28 | `film/{intro,final}.{mp4,vtt,webp}` (시작·복구 영상) | 장면 그림 6장: 내장 image_gen(원본 PNG에 ChatGPT C2PA 2026-11-04). **그림을 영상으로 바꾼 도구 이름 기록 없음.** 가공 `scripts/render-film.mjs`. 내레이션: ElevenLabs(40번 줄) → 영상: 제미나이(사용자 확인 2026-11-21) | 2026-11-04 장면 프롬프트·영상 프롬프트, 2026-11-18 내레이션 교체. CREDITS 두 줄이 「프로젝트 자체 AI 생성 영상」과 「제작자 제공 영상」으로 서로 다르게 적음 | 그림 ChatGPT 유료 요금제, 영상 제미나이 유료 요금제(사용자 확인 2026-11-21 「전부 맞아」(`_shared/CODEX-IMAGE-RECORDS-20261121.md`)) | `assets/generated/film-20261104/{prompts.json,intro.mp4,final.mp4,*.png}`, `assets/generated/film-voice-el-20261118/`, `assets/CREDITS.md` | 확인됨(사용자 확인) |
| 29 | `concepts/M{1..5}.{mp4,webp,vtt}` + `concepts/manifest.json` (개념 영상 5편) | 로컬 HyperFrames로 렌더(`films/build-films.mjs`). 안에 들어간 그림: `moa-full`·`companion-full`(3번 줄)과 study 그림, 효과음: Kenney wav, 내레이션: ElevenLabs(40번 줄), 글꼴: 나눔스퀘어 네오 | 2026-11-09 재제작, 11-14 글꼴, 11-18 내레이션, 11-19 자막(커밋 `fa9ddd2`·`177425e`·`96c368e`·`5bc25cf`) | 재료 따름 | `films/`, `docs/MAKING-OF.md` 103행, `assets/CREDITS.md` | 근거 약함 |
| 30 | `study/live/paramecium-{00..20}.webp` (21장, 영상에서 뽑은 장면) + `study/live/spirogyra-live.mp4` | Google 생성 영상(원본 mp4에 Google C2PA). 커밋 `2a563ee`에 「the Gemini mark is removed」. 서비스·모델 이름 기록 없음. 첫 장면 그림 `*-start.png`는 ChatGPT C2PA(2026-11-17) | 2026-11-17. 영상 프롬프트 기록 | 기록 없음. **보이는 Gemini 표식을 지웠다는 기록이 있어 그 서비스 약관이 표식 제거를 허용하는지 확인 필요** | `assets/generated/videos-20261117/{*-video-prompt.md,*-microscope-source.mp4,*-start.png}` | 근거 약함 |

## 7. 3D 모형

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 31 | `models/{mushroom,bread-mold,yeast}.glb` (3개) | 사용자 Meshy 계정 image-to-3D, 입력 그림은 Higgsfield gpt_image_2_5, `scripts/pack-models.mjs`·gltfpack으로 압축 | 2026-10-25~26. 받은 파일 이름·설정 기록 | CREDITS 「Meshy 생성물의 상업 이용 조건은 생성 당시 계정 플랜 기준 — 납품 전 확인」, 플랜 기록 없음 | `assets/generated/models-20261025.json`, `docs/3D_MODEL_PROMPTS.md` | 근거 약함 |

## 8. 음악

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 32 | `audio/bgm-{main,ending}-theme.m4a` | Suno, 제작자 본인 Premier 플랜 계정(가사 없음) | 2026-11-04. 원본 `assets/generated/bgm-20261104/` | Premier 생성물 상업 이용 가능(기록 문구), 2026-11-18 사용자 확인 | `assets/generated/bgm-20261104.json`, `_shared/voice-provenance-20261118.md` 요금제 표 | 확인됨 |

## 9. 효과음

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 33 | `audio/{click,success,retry,snap,capture,water,hint,run}.wav` (8개) | Kenney · Interface Sounds 1.0 (파일별 원본 이름 매핑 있음) | 2026-10-22 받음 | CC0 1.0 | `public/assets/audio/sources.json`, `public/assets/audio/KENNEY-LICENSE.txt` | 확인됨 |
| 34 | `audio/{page-turn,core-wake,pipette-drop}.wav` (3개) | Kenney(RPG Audio `bookFlip1`, Digital Audio `powerUp4`), angeloyazar(OpenGameArt `water_drops`) | 받은 날 기록 없음(원본 주소·파일 이름은 있음) | CC0 | `public/assets/audio/sources.json`(additionalEffects), `assets/CREDITS.md` | 확인됨 |
| 35 | `audio/{focus,sparkle}.wav` (2개) | Higgsfield 연결 도구 · Mirelo Text to Audio로 생성 | 2026-11-15. 프롬프트·작업 ID·가공 기록 | Higgsfield 요금제·이용 조건 기록 없음 | `assets/generated/sfx-20261115.json` | 근거 약함 |
| 36 | `audio/sfx/map-*.mp3` (8개, 지도 악당) | 과학34 공통 효과음 라이브러리 → OpenGameArt·Freesound 원본(rubberduck, mikala_oidua, AlaskaRobotics, saturdaysoundguy, martian, Faulkin, michorvath, Fupicat) | 2026-11-17, 파일별 원본 주소·해시 | CC0(원본 페이지 재확인 기록) | `public/assets/audio/sources.json`(mapEffects), `_shared/sfx-library-20261117/{manifest.json,CREDITS.md}` | 확인됨 |
| 37 | `audio/sfx/card-*.mp3` (5개, 성취 카드) | 같은 공통 라이브러리 → Freesound(qubodup, ZenithInfinitiveStudios, CogFireStudios, DeltaCode, el_boss) | 2026-11-18 | CC0 | `public/assets/audio/sources.json`(cardEffects) | 확인됨 |
| 38 | `audio/sfx/step-0{1,2}.mp3` (2개, 발소리) | 같은 공통 라이브러리 → Freesound(sgossner, Yoyodaman234) | 2026-11-19 | CC0 | `public/assets/audio/sources.json`(stepEffects) | 확인됨 |

## 10. 목소리

파일 해시를 기록 JSON의 `sha256`과 대조했다. 아래 39~43번 줄의 192개 파일은 모두 기록과 일치한다.

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 39 | `audio/voice/M{1,2,4,5}-*.mp3` (17개, 주민 솔비·여울·밤톨·보리) | ElevenLabs eleven_v4 (Bee, Klamon, Sora, MyungIn) | 2026-11-12. 생성 ID·받아쓰기·해시 | Starter 유료 요금제 중 생성, 상업 이용 가능(2026-11-18 사용자 확인) | `public/assets/audio/voice/elevenlabs-residents-20261112.json`, `assets/CREDITS.md`, `_shared/voice-provenance-20261118.md` | 확인됨 |
| 40 | `audio/voice/{story-1,story-2,story-3,results-1,M3-welcome,M3-work,M3-memory}.mp3` (7개, 모아·두리) + 시작·복구 영상과 개념 영상 속 내레이션 | ElevenLabs eleven_v4 (모아 Mina, 두리 Taek) | 2026-11-18. 생성 ID·받아쓰기·해시·영상 속 위치 | Creator 유료 요금제(2026-11-18 충전), 사용자 확인 | `public/assets/audio/voice/elevenlabs-voices-20261118.json` | 확인됨 |
| 41 | `audio/voice/moa/*.mp3` (34개, 발견 카드·과학 낱말·악당 대사 등) | ElevenLabs eleven_v4 (Mina) | 2026-11-18 | 위와 같음 | 같은 파일 | 확인됨 |
| 42 | `audio/voice/toto/*.mp3` (109개, 힌트·지도 안내) | ElevenLabs eleven_v4 (Aria) | 2026-11-18 | 위와 같음 | 같은 파일 | 확인됨 |
| 43 | `audio/voice/lens/*.mp3` (25개, 초점 도깨비 렌즈) | ElevenLabs eleven_v4 (Harry) | 2026-11-18 | 위와 같음 | 같은 파일 | 확인됨 |
| 44 | `audio/npc/M{1..5}.m4a` (5개) — **2026-11-21 `e04ecd4`에서 배포본에서 뺌(앱이 부르지 않음)** | 로컬 Momo(「모모 여자·남자 목소리」). **모델 이름 기록 없음** | 2026-11-07. 원본 UUID·해시(5개 모두 일치) | 이용 조건 기록 없음(11-10 이후 Momo 기록은 Qwen3-TTS Apache-2.0이라고 적었지만 이 5개 기록에는 없음). **앱 코드에서 부르지 않는 파일**이고 배포본에만 남아 있음 | `docs/reviews/NPC-VOICE-20261107.json`, `docs/reviews/UPGRADE-20261107.md` 58행 | 해당 없음(배포본에서 뺌) |

## 11. 글꼴·프로그램

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 45 | `fonts/NanumSquareNeoTTF-{bRg,cBd}.woff2` | 네이버 나눔스퀘어 네오 공식 배포 | 공식 배포 주소·SHA-256 기록, 2026-11-11 해시 일치 확인 | SIL OFL 1.1(원문 동봉) | `public/assets/fonts/NanumSquareNeo-SOURCE.json`, `public/assets/fonts/NanumSquareNeo-OFL.txt` | 확인됨 |
| 46 | 빌드 JS에 들어가는 Phaser 3.90.0, EventEmitter3 5.0.4, Three.js 0.181.1, meshoptimizer 디코더 | npm 패키지 | 2026-10-21 검토, 허가문을 CREDITS에 보존하고 빌드가 `assets/CREDITS.md`로 내보냄 | MIT | `assets/CREDITS.md` 「도구·라이선스 검토」·「프로그램 허가문」, `node_modules/*/LICENSE` | 확인됨 |
| 47 | `src/reward-cards.{js,css,d.ts}`, `src/reward-card-set.ts` (성취 카드 연출 코드) | 과학34 공통 모듈을 복사(16개 프로젝트 공통). 그림은 18번 줄 | 2026-11-18 | 자체 제작 코드 | `_shared/reward-cards/INTEGRATION.md`, `assets/CREDITS.md` | 확인됨 |

배포본에 같이 들어가는 기록 파일(`sources.json`, `KENNEY-LICENSE.txt`, `NanumSquareNeo-*`, `voice/*.json`, `MOMO-SOURCE.txt`, `map/generation.json`, `concepts/manifest.json`, `assets/CREDITS.md`)은 권리 대상이 아니라 위 줄의 근거라 따로 적지 않았다.

## 12. 2026-11-21 3-3a단계에서 바꾼 그림

| # | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| 48 | `places/workshop.webp` (1600×900, M5 BIO 작업실 배경) | Codex CLI 내장 이미지 도구(GPT 이미지), `gpt-imagegen` 스킬 `gpt-image.sh`, 참고 그림 `places/village.webp`·`places/fungi.webp`·`map/terrain.webp` 남서쪽 온실 공방 | 2026-11-21, 프롬프트 `docs/reviews/IMAGE-NEEDS-20261121.md` 「3-3a 만들기 기록」, 원본 `.tmp/score-images-20261121/workshop-gen1.png`(1672×941), 1회 생성 | ChatGPT 유료 요금제(사용자 확인 2026-11-21) | 위 문서·이 대화(Claude Code) 기록 | 확인됨 |
| 49 | `study/bread-0.webp` (1024×576) | 생성 없음: 6번 줄 `study/bread-1.webp`에서 곰팡이 점만 옆 빵 속으로 덮은 파생본(sharp) | 2026-11-21, `.tmp/score-images-20261121/` 스크립트 | 6번 줄과 같음 | 6번 줄 | 확인됨(재료 따름) |
| 50 | `study/leaf-0.webp` (1024×576) | 6번 줄 `study/leaf-1.webp` + Codex CLI GPT 이미지로 만든 구멍 없는 잎(참고 그림 `leaf-1`)에서 구멍 자리만 오려 붙인 합성 | 2026-11-21, 프롬프트 `IMAGE-NEEDS-20261121.md` 「3-3a 만들기 기록」, 원본 `.tmp/score-images-20261121/leaf-0-gen1.png`, 1회 생성, 합성 `leafcomp2.mjs` | ChatGPT 유료 요금제(사용자 확인 2026-11-21) | 위 문서 | 확인됨 |

## 합계

- 47줄: 확인됨 16줄, 근거 약함 30줄, **출처 미확인 1줄**(23번, 그림 4장). ← 처음 쓸 때(2026-11-21 아침)
- **2026-11-21 09:25 사용자 확인 반영 뒤: 확인됨 38줄(사용자 확인 22줄 포함), 근거 약함 8줄, 출처 미확인 0줄, 해당 없음 1줄(44번, 배포본에서 뺌).**
  - 사용자 확인(「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제로 만든 게 맞아?」 → "전부 맞아")으로 채운 줄: 1~18·23·26·27·28.
  - 확인으로 덮지 않고 그대로 둔 줄(저장소에 다른 도구 기록이 있음): 19~22(Higgsfield 연결 도구로 만든 그림), 31(Meshy 3D 모형), 35(Higgsfield Mirelo 효과음, 소리는 확인 범위 밖), 29(개념 영상: 20·21번 그림이 들어감), 30(짚신벌레·해캄 영상: 제미나이는 확인과 맞지만 보이는 Gemini 표식을 지운 기록이 있어 약관 확인이 남음). 19~22·31은 「그림은 전부 Codex」와 어긋나는 기록이라 보고만 한다.
- 근거 약함의 대부분은 "도구와 날짜는 있지만 생성 계정의 요금제·이용 조건 기록이 없다"는 같은 이유다. 아래 자료가 오면 한꺼번에 확인됨으로 올릴 수 있다.

## 장부를 만들다 본 기록의 어긋남 (고치지 않고 적어만 둠)

1. `assets/CREDITS.md` 「실제 사용 자료」 표가 3D 모형을 `{mushroom,bread-mold,paramecium,yeast}.glb` 4개로 적었다. 배포본에는 `paramecium.glb`가 없다(2026-11-18 앱에서 제거, `docs/3D_MODEL_PROMPTS.md` 13행).
2. 같은 CREDITS가 시작·복구 영상을 한 곳은 「프로젝트 자체 AI 생성 영상」, 다른 곳은 「제작자 제공 영상」이라고 적었다.
3. CREDITS에 11-14~11-18에 들어온 그림(지도 전투 시트, `ui/game/*`, `fungi-*`, `study/germ/*`, `rumor-note`, `slide-drop`, `study/live/*`)이 없다.
4. 16·17번 줄의 원본 PNG가 지울 수 있는 임시 폴더 `.tmp/`에만 있다. `assets/generated/`나 `asset-bank/original/`로 옮겨 두는 편이 안전하다.
5. `docs/reviews/NPC-VOICE-20261107.json`의 `recoverable_source`가 내장 드라이브 휴지통(`~/.Trash/creatures-npc-20261107/`)을 가리킨다. 44번 파일은 앱에서 쓰지 않으니 납품 묶음에서 빼는 것도 방법이다.

## 사용자가 줘야 하는 자료

> 2026-11-21 09:25 사용자 확인으로 아래 1~18·23·26~28번 요청은 해결됐다. 남은 요청: 19~22·31·35(Higgsfield·Meshy 요금제 화면), 30(Gemini 표식 제거가 약관상 괜찮은지), 납품 증빙용 ChatGPT·제미나이 요금제 화면.

| 줄 | 필요한 자료 | 왜 |
|---|---|---|
| 1~3 (+11, 26, 27, 29) | 원본 디자인 팩 `references/images/`(`chatgpt_full_*`, `chatgpt_image_*`, 2026-09-25~10-06 생성)을 **누가 만들었는지** 한 줄 확인. 본인 ChatGPT 계정이면 그 시기 계정 요금제 화면, 아이스크림미디어 등 업체가 준 자료면 **계약서나 자료를 받은 메일** | 연구소 배경 6장·로고·모아·토토 전신과 이를 쓴 합성물이 모두 여기서 나왔다 |
| 4~18 (+28 장면 그림) | 2026-10-21~11-18에 쓴 **ChatGPT 계정 요금제 화면**(Plus·Pro·Team 등, 상업 이용 가능한 플랜임이 보이게). Codex 내장 이미지 도구도 같은 ChatGPT 로그인이라 한 장이면 된다 | 도구·날짜는 기록에 있고 이용 조건만 빠졌다 |
| 8 | 주민 5명(2026-11-02) 그림을 어떤 도구로 만들었는지 한 줄 | CREDITS에 도구 이름이 없다 |
| 19~22, 35 | **Higgsfield 계정 요금제·결제 화면**(2026-10-25, 11-12, 11-15 생성분) | 그림 24장·효과음 2개의 이용 조건 근거 |
| 31 | **Meshy 계정 플랜 화면**(2026-10-25 생성 당시) | CREDITS가 직접 「납품 전 확인」으로 남겨 둠 |
| 28 | 시작·복구 영상(2026-11-04)을 **영상으로 만든 서비스 이름**과 그 계정 요금제 화면 | 영상화 도구 기록이 없다 |
| 30 | 짚신벌레·해캄 영상(2026-11-17)을 만든 **Google 서비스 이름(Gemini 앱인지 다른 도구인지)과 요금제 화면**, 그리고 보이는 표식을 지워도 되는지에 대한 확인 | 원본에 Google 표시만 있고, 커밋에 「Gemini 표식 제거」가 적혀 있다 |
| 23 | 버섯·곰팡이·짚신벌레·해캄 관찰 그림 4장을 만든 기록(도구·날짜·원본 PNG)이 따로 있으면 그것. 없으면 새로 그려 교체(`docs/reviews/IMAGE-NEEDS-20261121.md` (가)) | 저장소 안팎 어디에서도 기록을 못 찾았다 |
| 32 | Suno Premier 요금제 화면(2026-11-04 생성 당시) | 지금은 문장 확인만 있다. 상태는 확인됨이지만 납품 서류로 붙이기 좋다 |
| 39~43 | ElevenLabs 결제 내역 화면(2026-11-12 Starter, 2026-11-18 Creator) | 지금은 사용자 확인 문장만 있다. 상태는 확인됨이지만 납품 서류로 붙이기 좋다 |
| 44 | (해결: 2026-11-21 배포본에서 뺌, `e04ecd4`) | 모델·이용 조건 기록이 없다 |
