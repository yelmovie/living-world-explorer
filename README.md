# 생명 코드 연구소

초등학교 4학년 과학 단원을 위한 가로 태블릿 탐험 게임이다. 현재는 5개 스테이지 × 4개 탐구, 총 20개 활동의 관찰·비교·근거 연결·시간 탐색·설계 실행으로 증거를 모아 연구소와 BIO CORE를 복구한다.

## 실행

운영 주소: [생명 코드 연구소](https://living-world-explorer.pages.dev/). 배포 방법과 저장 주소의 차이는 [Cloudflare 배포 안내](docs/DEPLOYMENT.md)에 있어요.

```powershell
npm ci
npm run dev
npm test
npm run build
```

의존성이 이미 설치되어 있으면 `npm ci`는 생략한다. 프로젝트·빌드·임시 자료는 현재 D: 프로젝트에 보관한다.

## 브라우저 검증

서버와 테스트 터미널에서 임시 폴더와 브라우저 캐시를 프로젝트 안에 지정한다.

```powershell
New-Item -ItemType Directory -Force .tmp | Out-Null
$env:TEMP = Join-Path $PWD '.tmp'
$env:TMP = $env:TEMP
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $PWD '.cache/browsers'
```

최초 한 번 `node node_modules/@playwright/test/cli.js install chromium`으로 브라우저를 준비하고, 서버 터미널에서 `npm run dev -- --port 5176 --strictPort`를 실행한다. 테스트 터미널에서는 다음 명령을 사용한다.

```powershell
npm run test:browser
npm run test:flow
node tests/storage-safety.mjs
```

`test:browser`는 15개 경로를 6개 화면 크기로 검사한다. `test:flow`는 실제 학생 흐름으로 20개 탐구와 최종 보고·코어 복구를 완주하고 PNG 저장·새로고침 복원·시연 원본 분리를 확인한다. `storage-safety.mjs`는 잘못된 저장 구조와 다른 창의 동시 저장으로 원본이 덮이지 않는지 확인한다. 결과와 스크린샷은 Git에서 제외한 `.tmp/`에 저장한다. Phaser 캔버스는 장면이 그려진 뒤 촬영한다. 다른 서버는 `APP_URL`, 브라우저 실행 파일은 `BROWSER_PATH` 환경변수로 지정할 수 있다. 기존 `.cache/browser-manual/chrome-win/chrome.exe`가 있으면 우선 사용한다.

## 현재 기준

- [2026-10-24 고도화·최종점검](docs/reviews/FINAL-CHECK-20261024.md): 현재 20개 활동·화면·저장 검증과 남은 항목. 아래 2026-10-18 문서는 초기 구현의 기록이다.
- [새 생성 이미지 기록](docs/ART_GENERATION_20261024.md): 지도·표본·복구 장면 10장, 프롬프트와 원본 위치.

- [가로 태블릿 탐험 설계 v1.2](docs/TABLET_EXPLORATION.md): 2026-10-18 요청에 따른 현재 구현과 보상·화면 흐름.
- [태블릿 검증 결과](docs/TABLET_VERIFICATION.md): 테스트 범위와 남은 검증.
- [영상 제작 캔버스](https://chatgpt.com/space/page_b460050fb99081919a7ca655d9b2e6c5): 도입 6초와 엔딩 8초 제작 프롬프트.
- [미션 계약](docs/mvp-spec.json): 5장·학습 활동 10개·전체 15개 화면.
- [이전 탐구 상호작용 설계](docs/INTERACTION_DESIGN.md): 현미경·비교·근거·시간·실행의 완료 조건. 렌더러와 레이아웃은 v1.2 우선.

지도와 스테이지는 2D Phaser를 중심으로 구성하며 촬영·주석·증거 썸네일에는 Canvas 2D, 도구에는 DOM을 사용한다. 과거 3D 파일은 보존했지만 현재 실행 경로에서 사용하지 않는다. 과학 관찰 자료는 설명용 모형이므로 수업 배포 전 자료·교과 검수가 필요하다.

## 자료 위치

| 경로 | 내용 | 수량 |
|---|---|---:|
| `references/documents/` | 기존 PRD, TRD, 심화설계 v2, 화면 디자인 프롬프트 JSON | 4 |
| `references/archives/` | 원본 디자인 팩 ZIP | 1 |
| `references/extracted/life-code-lab-design-pack/` | ZIP 압축 해제본 | 3 |
| `references/images/screen-overviews/` | 여러 화면을 모은 전체 흐름 시안 | 7 |
| `references/images/screen-mockups/` | 개별 활동 화면 시안 | 10 |
| `references/images/backgrounds/` | 연구소·연못 등 배경 이미지 | 10 |
| `references/images/characters/` | 연구원·탐험가·보조 캐릭터 설정화 | 9 |
| `references/images/branding/` | 로고 후보 | 2 |
| `references/previews/` | 원본 이미지 38장의 검토용 연락판 | 4 |

[원본 경로·새 경로·SHA256 목록](references/source-inventory.csv)

원본 파일명과 내용을 유지하여 43개 파일을 이동했고, 이동 전후 SHA256 일치를 확인했다. ZIP 안의 3개 파일은 `references/documents/`의 동명 파일과 SHA256이 동일하다. 중복 원본은 삭제하지 않았다.

## 확인된 시나리오와 문서 차이

학습 흐름은 균류 관찰 → 원생생물 비교 → 세균 자료 분석 → 생활 영향 조사 → 생명과학 활용이다.

- 기존 PRD/TRD v1의 10화면에는 메인과 엔딩이 포함된다.
- 심화설계 v2는 **5장 × 활동 2개 = 핵심 학습 화면 10개**이며 도입, 지도, 최종 보고, 최종 복구, 엔딩은 별도 공통 흐름이다.
- v2에는 실제 탐구 기록 5종, 미션 후 연구소 변화, 모아 연구원에게 최종 보고, 학생의 직접 BIO CORE 복구 행동이 추가되어 있다.
- 두 버전의 페이지 번호와 3D 범위가 다르므로 구현에 바로 혼용하지 않는다. 현재 구현은 위 v1.2의 2D Phaser 기준을 따른다.
- 심화설계에 있는 `YES` 품질 표는 기획 의도이며 실제 구현·검증 결과가 아니다.

## 에셋 검토 결과

- 전체 시안과 개별 화면은 레이아웃·분위기 참고용이다. 이미지에 포함된 버튼과 문구는 실제 UI가 아니다.
- 배경 10장은 2D 장소 화면 후보로 활용할 수 있다.
- 캐릭터 9장은 여러 자세·표정을 모은 설정화다. 개별 컷 분리와 투명도, 크기 통일 여부를 구현 전에 확인해야 한다.
- 현재 실행에는 2.5D 픽셀 지도, 방향별 캐릭터 이미지, 생성 시설·표본 그림, 로컬 Kenney 효과음과 자체 합성 배경 음악이 있다. 독립 타일셋·연속 보행 스프라이트시트·3D 모델은 사용하지 않는다.
- 과학 관찰 이미지의 출처와 교과 검수 상태는 확인되지 않았다. 화면 시안 속 생물 이미지를 검증된 관찰 자료로 간주하지 않는다.

## 공유 대화 확인 상태

참조: <https://chatgpt.com/share/6accea16-e770-83ee-adad-82c972670d4b>

2026-10-12 확인 시 브라우저에서 대화 제목 `8다양한생물과우리생활_4-1`까지 표시된 뒤 로그인 오류로 이동했다. 본문을 읽지 못했으므로 이번 시나리오 정리는 로컬 문서·이미지와 현재 사용자 메시지를 근거로 한다.

2026-10-15에는 설계 문서만 작성했다. 2026-10-18 구현과 검증 상태는 위 v1.2 설계 및 검증 보고서를 기준으로 확인한다.
