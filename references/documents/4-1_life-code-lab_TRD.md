# TRD — 생명 코드 연구소 (Life Code Lab)

- 문서 버전: **1.0**
- 작성일: **2026-08-25**
- Repository: `life-code-lab`
- Topic ID: `topic-12-microorganisms`
- 대상: 초등학교 4학년 과학
- 구조: **5 Stages / 10 Screens**
- 플랫폼: **Tablet-first Web / PWA**
- Frontend: **Vite + TypeScript (`strict: true`)**
- 2D/2.5D Gameplay: **Phaser 3 + Canvas 2D**
- 3D: **Three.js**
- UI: **HTML/CSS/SVG**
- Persistence: **IndexedDB + localStorage fallback**
- Export: **Canvas 2D PNG**
- 3D 핵심 화면: **01, 09, 10**
- 목표 성능: **저사양 태블릿 30fps 우선**

---

## 1. 기술 목표

1. Android 학교 태블릿과 iPad Safari에서 핵심 경로가 안정적으로 동작한다.
2. 3D는 Page 01, 09, 10에서만 사용한다.
3. Three.js와 Phaser 렌더 루프를 동시에 지속 실행하지 않는다.
4. 모든 필수 학습 행동은 터치만으로 수행 가능하다.
5. 한글 UI는 이미지·3D 텍스처에 굽지 않고 DOM/SVG로 분리한다.
6. 화면별 자산을 lazy load하고 종료 시 dispose한다.
7. 저사양 태블릿 30fps를 보수적 기준으로 한다.
8. 백엔드 없이 저장·이어하기를 지원한다.
9. Science World 허브와는 `MissionResult` 계약으로 결합한다.
10. 생물학 사실, 관찰 이미지 메타데이터, 사례 데이터는 코드에 흩어놓지 않고 JSON으로 분리한다.
11. 실제 현미경 관찰을 대체하는 것이 아니라 **관찰 절차 연습·증거 기록·비교·분석을 확장**하는 도구로 설계한다.
12. 세균, 원생생물, 균류의 관찰 화면은 과장된 3D 캐릭터보다 검수 가능한 2D/영상 자료를 우선한다.
13. Page 09의 생명과학 활용 시뮬레이션은 실제 공정의 정밀 재현이 아니라 **관계 기반 교육용 모델**로 구현한다.

## 2. 권장 기술 스택

```text
Vite
TypeScript
Phaser 3
Three.js
Canvas 2D
HTML / CSS
SVG
IndexedDB
Web Audio API
PWA / Service Worker
```

선택:
```text
GLTFLoader
MeshoptDecoder / DracoLoader
KTX2Loader
Web Share API
```

필수로 추가하지 않음:
```text
대형 rigid-body physics engine
서버 DB
실시간 멀티플레이 SDK
생성형 AI SDK
```

## 3. 런타임 아키텍처

```text
Science World Hub
        │ portal enter
        ▼
Hub suspend
        ▼
LifeCodeLessonHost
├─ LessonRouter
├─ RuntimeCoordinator
│  ├─ PhaserRoot
│  ├─ ThreeRoot
│  └─ UIOverlay
├─ TypedStore
├─ EventBus
├─ PersistenceService
├─ AssetManager
├─ AudioManager
├─ ContentRegistry
├─ AssessmentService
├─ ArtifactExportService
└─ MissionResultAdapter
        │
        ▼
MissionResult
        │
        ▼
Hub resume
```

권장 DOM:

```html
<div id="life-code-app">
  <div id="three-root"></div>
  <div id="phaser-root"></div>
  <div id="ui-overlay"></div>
</div>
```

### 렌더링 규칙
- Page 01/09/10: Three.js active, Phaser pause 또는 destroy
- Page 02~08: Phaser/Canvas active, Three.js RAF 완전 중지
- DOM Overlay는 공통 유지
- 화면 전환 시 `sceneToken` 갱신
- 종료한 Scene의 비동기 콜백은 현재 `sceneToken`과 다르면 상태 변경 금지
- 3D Scene 종료 시 geometry/material/texture/controls/listener/mixer/RAF 모두 정리

## 4. 화면별 구현 모드

| Page | ID | 화면명 | Runtime | 3D |
|---|---|---|---|---|
| 01 | `lab-hub` | 생명 코드 연구소 | Three.js + DOM | **O** |
| 02 | `fungi-specimen` | 균류 표본실 | Phaser + DOM | X |
| 03 | `microscope-analysis` | 현미경 분석실 | Phaser + Canvas + DOM | X |
| 04 | `water-sampling` | 한 방울 채집실 | Phaser 2.5D | X |
| 05 | `protist-tracking` | 원생생물 추적실 | Phaser + Canvas + DOM | X |
| 06 | `bacteria-data` | 세균 데이터실 | DOM/SVG + Phaser | X |
| 07 | `impact-scene` | 생활 사건실 | Phaser 2.5D | X |
| 08 | `impact-analysis` | 영향 분석실 | DOM/SVG + Phaser | X |
| 09 | `bio-solution` | BIO 솔루션 연구소 | Three.js hybrid + DOM | **O** |
| 10 | `code-final` | 생명 코드 완성 | Three.js + DOM/Canvas | **O** |

## 5. 권장 프로젝트 구조

```text
src/
├─ app/
│  ├─ App.ts
│  ├─ router.ts
│  ├─ RuntimeCoordinator.ts
│  └─ lifecycle.ts
├─ lessons/
│  └─ life-code-lab/
│     ├─ index.ts
│     ├─ manifest.json
│     ├─ routes.ts
│     ├─ screens/
│     │  ├─ screen01-lab-hub-3d/
│     │  ├─ screen02-fungi-specimen/
│     │  ├─ screen03-microscope-analysis/
│     │  ├─ screen04-water-sampling/
│     │  ├─ screen05-protist-tracking/
│     │  ├─ screen06-bacteria-data/
│     │  ├─ screen07-impact-scene/
│     │  ├─ screen08-impact-analysis/
│     │  ├─ screen09-bio-solution-3d/
│     │  └─ screen10-code-final-3d/
│     ├─ content/
│     │  ├─ curriculum.json
│     │  ├─ organisms.json
│     │  ├─ fungi-observations.json
│     │  ├─ protist-observations.json
│     │  ├─ bacteria-evidence.json
│     │  ├─ habitats.json
│     │  ├─ impact-cases.json
│     │  ├─ life-science-cases.json
│     │  ├─ glossary.json
│     │  ├─ misconception-rules.json
│     │  └─ source-notes.json
│     ├─ state/
│     │  ├─ lifeCodeStore.ts
│     │  ├─ selectors.ts
│     │  └─ persistence.ts
│     ├─ events/
│     │  └─ lifeCodeEvents.ts
│     ├─ assessment/
│     │  ├─ observationEvaluator.ts
│     │  ├─ evidenceEvaluator.ts
│     │  ├─ impactEvaluator.ts
│     │  ├─ solutionEvaluator.ts
│     │  └─ missionResult.ts
│     ├─ systems/
│     │  ├─ MicroscopeStateModel.ts
│     │  ├─ AnnotationSystem.ts
│     │  ├─ SamplePreparationSystem.ts
│     │  ├─ ProtistTrackingSystem.ts
│     │  ├─ EvidenceRelevanceEngine.ts
│     │  ├─ ImpactCaseEngine.ts
│     │  ├─ BioSolutionEngine.ts
│     │  └─ ProgressSystem.ts
│     ├─ three/
│     │  ├─ LabHub3D.ts
│     │  ├─ BioSolutionWorkbench3D.ts
│     │  ├─ BioCoreFinal3D.ts
│     │  ├─ ThreeAssetManager.ts
│     │  └─ dispose.ts
│     ├─ phaser/
│     │  ├─ scenes/
│     │  └─ phaserConfig.ts
│     ├─ ui/
│     │  ├─ components/
│     │  ├─ overlays/
│     │  └─ styles/
│     └─ export/
│        ├─ researchCardRenderer.ts
│        └─ share.ts
├─ shared/
│  ├─ event-bus/
│  ├─ persistence/
│  ├─ audio/
│  ├─ accessibility/
│  └─ hub-contract/
└─ public/
   └─ assets/life-code-lab/
      ├─ 2d/
      ├─ 3d/
      ├─ ui/
      └─ audio/
```

## 6. 라우팅

```text
/life-code-lab/01
/life-code-lab/02
/life-code-lab/03
/life-code-lab/04
/life-code-lab/05
/life-code-lab/06
/life-code-lab/07
/life-code-lab/08
/life-code-lab/09
/life-code-lab/10
```

## 7. 핵심 상태 모델

```ts
type StageId =
  | "stage-1-fungi"
  | "stage-2-protists"
  | "stage-3-bacteria"
  | "stage-4-impact"
  | "stage-5-application";

type BioCodeId =
  | "fungi"
  | "protists"
  | "bacteria"
  | "impact"
  | "application";

type ScreenId =
  | "screen-01-lab-hub"
  | "screen-02-fungi-specimen"
  | "screen-03-microscope-analysis"
  | "screen-04-water-sampling"
  | "screen-05-protist-tracking"
  | "screen-06-bacteria-data"
  | "screen-07-impact-scene"
  | "screen-08-impact-analysis"
  | "screen-09-bio-solution"
  | "screen-10-code-final";

interface LifeCodeState {
  schemaVersion: "1.0.0";
  lessonId: "topic-12-microorganisms";
  currentScreen: ScreenId;
  unlockedScreens: ScreenId[];
  completedStages: StageId[];
  restoredCodes: BioCodeId[];

  fungiEvidence: FungiEvidenceRecord[];
  microscopeRecords: MicroscopeRecord[];

  waterSamples: WaterSampleRecord[];
  protistObservations: ProtistObservationRecord[];

  bacteriaEvidence: BacteriaEvidenceRecord[];
  bacteriaProfile?: BacteriaProfile;

  impactInvestigations: ImpactInvestigation[];
  impactReports: ImpactReport[];

  solutionDraft?: BioSolutionDraft;
  solutionRuns: BioSolutionRun[];

  finalArtifact?: BioResearchCard;
  finalExportId?: string;

  starsByStage: Record<StageId, 0 | 1 | 2 | 3>;
  hintCount: number;
  retryCount: number;

  accessibility: {
    reducedMotion: boolean;
    textScale: "normal" | "large";
    bgmMuted: boolean;
    sfxMuted: boolean;
  };

  updatedAt: string;
}
```

## 8. 콘텐츠 데이터 원칙

생물학 정보는 TypeScript 코드에 하드코딩하지 않고 JSON으로 관리한다.

```ts
type OrganismGroup = "fungi" | "protist" | "bacteria";

interface OrganismSpec {
  id: string;
  nameKo: string;
  group: OrganismGroup;
  observableTraits: string[];
  habitatEvidenceIds: string[];
  mediaIds: string[];
  curriculumLevel: 4;
  sourceNoteIds: string[];
}

interface ObservationMedia {
  id: string;
  organismId: string;
  type: "image" | "video-clip" | "animated-sequence";
  assetId: string;
  verifiedObservationTags: string[];
  cropHotspots?: ObservationHotspot[];
  sourceNoteId: string;
}
```

원칙:
- 실제 관찰 자료를 기반으로 한 경우 출처/라이선스를 `source-notes.json`에 기록
- AI 생성 관찰 이미지를 사실 자료처럼 사용하지 않음
- 미술용 배경과 과학 관찰 자료를 자산 레벨에서 분리

## 9. Page 01 — LabHub3D

장면 구조:

```text
LabHubRoot
├─ CentralBioCore
├─ ZoneFungi
├─ ZoneProtist
├─ ZoneBacteria
├─ ZoneImpact
├─ ZoneApplication
├─ CodeSlots
└─ AmbientProps
```

카메라:
- PerspectiveCamera
- 고정 3/4 기본
- 수평 회전 제한 ±50°
- 수직 회전 제한 ±15°
- pan 금지
- pinch zoom 제한

입력:
- 1 finger drag: 연구소 제한 회전
- zone tap: Stage 정보 열기
- unlocked zone tap: 진입
- BIO CORE tap: 현재 수집 코드 보기

성능:
- low 기준 visible triangles 120k 이하 권장
- 실시간 그림자 low OFF
- 반복 소품 InstancedMesh

## 10. Page 02 — FungiSpecimenScene

```ts
interface FungiEvidenceRecord {
  id: string;
  specimenId: string;
  evidenceType:
    | "appearance"
    | "location"
    | "environment"
    | "time-change";
  evidenceId: string;
  selectedByStudent: boolean;
  createdAt: number;
}
```

규칙:
- 최소 2개 서로 다른 evidenceType 필요
- 표본 이름만 맞혀서는 완료 불가
- 관찰하지 않은 정보 자동 저장 금지
- 일반화 문구 대신 현재 표본에서 확인한 사실을 우선 제시

## 11. Page 03 — MicroscopeStateModel

```ts
type MagnificationBand = "low" | "high";

interface MicroscopeState {
  specimenId: string;
  magnification: MagnificationBand;
  brightness: number; // 0..1 internal
  focus: number;      // 0..1 internal
  stageOffset: { x: number; y: number };
}

interface FocusProfile {
  optimalMin: number;
  optimalMax: number;
  brightnessMin: number;
  brightnessMax: number;
}
```

`brightness`, `focus`는 실제 장비의 정밀 수치처럼 학생에게 노출하지 않는다.

렌더링:
- focus blur amount
- over/under exposure overlay
- magnification별 검수 관찰 이미지 variant

캡처:

```ts
interface MicroscopeRecord {
  id: string;
  specimenId: string;
  magnification: MagnificationBand;
  imageAssetId: string;
  viewport: { x: number; y: number; zoom: number };
  annotations: AnnotationStroke[];
  validEvidenceTags: string[];
  createdAt: number;
}
```

완료 조건:
- low에서 관찰 시작
- 유효 초점 범위 진입
- 유효 관찰 기록 2개 이상
- 특징 주석 2개 이상
- 공통 증거 설명 1개

## 12. AnnotationSystem

```ts
interface AnnotationStroke {
  id: string;
  kind: "circle" | "line" | "freehand";
  points: Array<{ x: number; y: number }>;
  labelId?: string;
}
```

- 최대 20 strokes 권장
- Undo/Redo 10 step
- 관찰 이미지 원본에는 직접 굽지 않고 overlay JSON으로 저장
- export 때 Canvas에 합성

## 13. Page 04 — SamplePreparationSystem

```ts
interface WaterSampleRecord {
  id: string;
  locationId: string;
  dropAmountBand: "too-small" | "suitable" | "too-large";
  prepared: boolean;
  createdAt: number;
}
```

입력:
- 스포이드 body drag
- squeeze press state
- sample pickup
- slide drop

규칙:
- `suitable`에서 다음 화면의 관찰 가독성이 가장 좋게 설정
- 너무 적거나 많아도 재시도 가능
- 실패를 벌점이 아니라 표본 제작 피드백으로 사용

## 14. Page 05 — ProtistTrackingSystem

관찰 대상:
- 해캄
- 짚신벌레

```ts
interface ProtistObservationRecord {
  id: string;
  organismId: string;
  sampleId: string;
  captureId: string;
  trackedSeconds?: number;
  evidenceTags: string[];
  annotationIds: string[];
  createdAt: number;
}
```

Tracking 원칙:
- 짚신벌레 이동은 검수된 애니메이션 경로 세트에서 재생
- 무작위 움직임을 사실 모델처럼 사용하지 않음
- 세션 seed로 경로 선택 가능
- 학생은 viewport를 이동해 target을 유지
- 일정 시간 시야 안에 유지하면 촬영 가능 상태

해캄:
- 움직임 추적보다 형태 관찰 중심
- 확대 위치 선택 후 촬영

비교:
- A/B split view
- `생김새`, `움직임`, `채집 장소` 항목에서 증거 선택

## 15. Page 06 — EvidenceRelevanceEngine

```ts
interface BacteriaEvidenceRecord {
  id: string;
  sourceCardId: string;
  questionId: string;
  relevance: "relevant" | "irrelevant" | "insufficient";
  selected: boolean;
  createdAt: number;
}

interface BacteriaProfile {
  evidenceIds: string[];
  observableTraitIds: string[];
  habitatEvidenceIds: string[];
  explanationKo: string;
}
```

자료 카드:
- 확대 이미지
- 영상 프레임
- 발견 장소 기록
- 실험 관찰 메모
- 근거 없는 추측
- 질문과 무관한 자료

규칙:
- 최소 3개 근거 필요
- 동일 유형 카드만 3개 선택해서 통과 금지
- 근거 없는 추측만으로 완료 금지
- 4학년 범위를 벗어나는 종명·병리 지식 암기 금지

## 16. Page 07 — ImpactCaseEngine

```ts
type ImpactKind = "helpful" | "harmful" | "context-dependent";

interface ImpactCase {
  id: string;
  titleKo: string;
  sceneAssetId: string;
  relatedGroup: OrganismGroup;
  evidenceIds: string[];
  verifiedImpact: ImpactKind;
  explanationId: string;
  curriculumApproved: boolean;
}

interface ImpactInvestigation {
  caseId: string;
  scannedHotspots: string[];
  collectedEvidenceIds: string[];
  observationNotes: string[];
}
```

규칙:
- 최소 3개 사건 제공
- 유익/문제 사례가 모두 포함되도록 구성
- 특정 생물군 전체를 하나의 영향으로 일반화하지 않도록 사건 조합 설계
- `curriculumApproved=true`만 학생용 콘텐츠에 노출

## 17. Page 08 — ImpactEvaluator

```ts
interface ImpactReport {
  caseId: string;
  relatedEvidenceIds: string[];
  selectedImpact: "helpful" | "harmful";
  explanationEvidenceId: string;
  explanationKo: string;
  valid: boolean;
}

type MisconceptionFlag =
  | "ALL_BACTERIA_HARMFUL"
  | "ALL_FUNGI_HARMFUL"
  | "GROUP_EQUALS_IMPACT"
  | "CLAIM_WITHOUT_EVIDENCE"
  | "EVIDENCE_IRRELEVANT";
```

완료 판정:
1. 사건을 실제로 조사했는가
2. 관련 생물/자료가 사건과 맞는가
3. 영향 판단이 현재 사건과 맞는가
4. 근거가 연결되어 있는가

오개념 flag는 벌점이 아니라 재조사 힌트 선택에 사용한다.

## 18. Page 09 — BioSolutionWorkbench3D

장면 구조:

```text
BioSolutionWorkbench
├─ Workbench
├─ ProblemDisplay
├─ InputModuleAnchors
├─ ProcessModuleAnchors
├─ OutputModuleAnchors
├─ BioModuleTray
├─ FlowTubes
└─ ResultChamber
```

```ts
interface BioSolutionDraft {
  id: string;
  problemId: string;
  caseId: string;
  organismOrProcessId: string;
  traitOrActionId: string;
  modulePlacements: PlacedBioModule[];
  evidenceIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface PlacedBioModule {
  instanceId: string;
  moduleId: string;
  anchorId: string;
  rotationStep: 0 | 90 | 180 | 270;
}
```

자유 CAD 금지:
- anchor/snap 기반
- 최대 모듈 6개
- scale 자유 조절 금지
- 회전 90° step
- 한글 텍스트는 DOM

입력:
- tap: 모듈 선택
- drag: anchor 이동
- rotate button: 90° 회전
- connect: 흐름 연결
- undo/redo
- RUN

## 19. BioSolutionEngine

```ts
interface BioSolutionRule {
  problemId: string;
  validCaseIds: string[];
  requiredRelations: Array<
    | { type: "case-selected" }
    | { type: "trait-matches-case" }
    | { type: "input-connected" }
    | { type: "process-connected" }
    | { type: "output-connected" }
  >;
}

interface BioSolutionRun {
  id: string;
  draftId: string;
  passed: boolean;
  checks: Array<{
    id: string;
    passed: boolean;
    observationKo: string;
  }>;
  revisionIndex: number;
  createdAt: string;
}
```

원칙:
- 가능한 해결 구성이 1개 이상 존재할 수 있음
- 실제 공정의 정량 효율을 계산하지 않음
- 전문 생명공학 원리를 암기시키지 않음
- 실패 시 정답 위치가 아니라 미작동 관계만 알림

## 20. Page 10 — BioCoreFinal3D

```text
BioCoreFinal
├─ CentralCore
├─ CodeFungi
├─ CodeProtists
├─ CodeBacteria
├─ CodeImpact
├─ CodeApplication
├─ CompletionFX
└─ ResultCardPortal
```

흐름:
- Stage 결과 검증
- 5 code mesh 순차 결합
- 중앙 core 활성화
- Page 09 결과와 Stage 기록을 읽어 최종 카드 편집기 오픈
- PNG export
- MissionResult emit

제한:
- 새 개념 평가 금지
- particle 과다 금지
- low profile에서 bloom OFF
- 학생 이름 자동 삽입 금지

## 21. 최종 연구 카드 데이터

```ts
interface BioResearchCard {
  id: string;
  titleKo: string;
  applicationCaseId: string;
  relatedOrganismOrProcessId: string;
  traitOrActionId: string;
  usageExplanationKo: string;
  evidenceIds: string[];
  representativeObservationId?: string;
  authorNameOptional?: string;
  createdAt: number;
}
```

완료 항목:
- 제목
- 활용 사례
- 관련 생물/생명 현상
- 이용하는 특징/작용
- 생활에서의 이용 설명
- 근거 1개 이상

Export:
```text
Canvas 2D composition
→ toBlob("image/png")
→ local download
→ Web Share API optional
```

## 22. EventBus 계약

```ts
type LifeCodeEvent =
  | { type: "SCREEN_ENTER"; screenId: ScreenId }
  | { type: "SCREEN_EXIT"; screenId: ScreenId }
  | { type: "FUNGI_EVIDENCE_COLLECTED"; recordId: string }
  | { type: "MICROSCOPE_STATE_CHANGED"; specimenId: string }
  | { type: "MICROSCOPE_CAPTURED"; recordId: string }
  | { type: "ANNOTATION_ADDED"; recordId: string }
  | { type: "WATER_SAMPLE_PREPARED"; sampleId: string }
  | { type: "PROTIST_TRACKED"; observationId: string }
  | { type: "PROTIST_CAPTURED"; observationId: string }
  | { type: "BACTERIA_EVIDENCE_SELECTED"; recordId: string }
  | { type: "BACTERIA_PROFILE_COMPLETED" }
  | { type: "IMPACT_EVIDENCE_COLLECTED"; caseId: string }
  | { type: "IMPACT_REPORT_SUBMITTED"; caseId: string }
  | { type: "SOLUTION_DRAFT_UPDATED"; draftId: string }
  | { type: "SOLUTION_RUN_COMPLETED"; runId: string }
  | { type: "SOLUTION_REVISED"; draftId: string }
  | { type: "BIO_CODE_RESTORED"; codeId: BioCodeId }
  | { type: "ARTIFACT_UPDATED"; artifactId: string }
  | { type: "ARTIFACT_EXPORTED"; artifactId: string }
  | { type: "STAGE_COMPLETED"; stageId: StageId }
  | { type: "LESSON_COMPLETED"; result: MissionResult };
```

Three.js/Phaser Scene은 공통 DOM을 직접 수정하지 않고 Store/EventBus를 통해 상태를 교환한다.

## 23. Stage 흐름

```text
MAIN
P01 Lab Hub
  ↓
STAGE 1 — FUNGI
P02 Fungi Specimen
  ↓
P03 Microscope Analysis
  ↓ restore fungi code

STAGE 2 — PROTISTS
P04 Water Sampling
  ↓
P05 Protist Tracking
  ↓ restore protists code

STAGE 3 — BACTERIA
P06 Bacteria Data
  ↓ restore bacteria code

STAGE 4 — IMPACT
P07 Impact Scene
  ↓
P08 Impact Analysis
  ↓ restore impact code

STAGE 5 — APPLICATION
P09 Bio Solution
  ↓
P10 Bio Code Final + Artifact
  ↓ restore application code
  ↓ MissionResult
```

## 24. MissionResult

```ts
interface MissionResult {
  topicId: "topic-12-microorganisms";
  attemptId: string;
  completed: boolean;
  score: number;
  stars: 1 | 2 | 3;
  stageResults: {
    stageId: StageId;
    passed: boolean;
    score: number;
  }[];
  metrics: {
    fungiEvidenceCount: number;
    microscopeCaptureCount: number;
    annotationCount: number;
    waterSampleRetryCount: number;
    protistObservationCount: number;
    bacteriaEvidenceCount: number;
    impactCasesInvestigated: number;
    impactReportsCompleted: number;
    solutionRunCount: number;
    solutionRevisionCount: number;
    artifactCompleted: boolean;
    hintCount: number;
  };
  unlocks: string[];
  completedAt: string;
}
```

단원은 허브 재화·보상을 직접 수정하지 않는다. 상위 `RewardService`가 결과를 받아 최종 보상을 확정한다.

## 25. 저장/오프라인

IndexedDB stores:
```text
life_code_state
life_code_observations
life_code_annotations
life_code_impact_records
life_code_solution_drafts
life_code_artifacts
life_code_mission_results
```

localStorage:
- 음량
- reduced motion
- text scale
- quality profile
- 마지막 route fallback

Service Worker:
- app shell
- 공통 SVG/UI
- 현재 Stage의 필수 자산
- 대형 GLB/영상은 첫 진입 전체 precache 금지

## 26. 자산 정책

### 3D GLB

Page 01:
```text
env_life_code_lab.glb
prop_bio_core_inactive.glb
prop_code_slot_ring.glb
zone_fungi_lab.glb
zone_protist_lab.glb
zone_bacteria_lab.glb
zone_impact_lab.glb
zone_application_lab.glb
```

Page 09:
```text
env_bio_solution_workbench.glb
prop_bio_module_input.glb
prop_bio_module_process.glb
prop_bio_module_output.glb
prop_result_chamber.glb
prop_flow_connector.glb
```

Page 10:
```text
env_life_code_final.glb
prop_bio_core_final.glb
prop_code_fungi.glb
prop_code_protists.glb
prop_code_bacteria.glb
prop_code_impact.glb
prop_code_application.glb
```

### 2D/2.5D
```text
bg_life_code_02_fungi_lab.webp
bg_life_code_03_microscope.webp
bg_life_code_04_sampling.webp
bg_life_code_05_protist_lab.webp
bg_life_code_06_data_room.webp
bg_life_code_07_impact_scene.webp
bg_life_code_08_analysis.webp

obs_fungi_*.webp
obs_mold_*.webp
obs_spirogyra_*.webp
obs_paramecium_*.webp
obs_bacteria_*.webp
impact_case_*.webp
```

과학 관찰 자료는 미술 배경 자산과 폴더를 분리한다.

## 27. UI 아이콘

```text
icon_bio_lens.svg
icon_scan.svg
icon_microscope.svg
icon_focus.svg
icon_brightness.svg
icon_magnification.svg
icon_camera.svg
icon_annotation.svg
icon_dropper.svg
icon_slide.svg
icon_track.svg
icon_compare.svg
icon_evidence.svg
icon_case.svg
icon_impact.svg
icon_solution.svg
icon_run.svg
icon_revision.svg
icon_bio_code.svg
```

공통:
- transparent SVG
- 64x64 viewBox 권장
- 한글 텍스트 없음
- 32px/64px에서 판독 가능

## 28. 오디오

BGM:
```text
bgm_life_code_main.ogg/mp3
bgm_life_code_stage1.ogg/mp3
bgm_life_code_stage2.ogg/mp3
bgm_life_code_stage3.ogg/mp3
bgm_life_code_stage4.ogg/mp3
bgm_life_code_stage5.ogg/mp3
```

SFX:
```text
sfx_scan
sfx_focus_turn
sfx_focus_lock
sfx_capture
sfx_annotation
sfx_dropper
sfx_sample_ready
sfx_track
sfx_evidence_pick
sfx_case_scan
sfx_evidence_link
sfx_module_snap
sfx_solution_run
sfx_solution_fail
sfx_solution_success
sfx_code_restore
sfx_bio_core_final
```

첫 사용자 제스처 이후 AudioContext resume.

## 29. 3D 성능 예산

Low:
```text
fps target: 30
pixel ratio: 1.0
shadow: off
post-processing: off
particles: low
texture max: 1024
```

Medium:
```text
pixel ratio: 1.25
shadow: key light 1개 이하
post-processing: off
particles: medium
```

High:
```text
pixel ratio: max 1.5
shadow: limited
optional weak bloom: Page 10 only
particles: medium
```

권장 triangles:
- Page 01: low 120k 이하
- Page 09: low 150k 이하
- Page 10: low 150k 이하

금지:
- realtime reflection
- 여러 개 동적 shadow light
- volumetric fog
- Page 09 자유 물리 시뮬레이션

## 30. 터치 입력 규칙

- 최소 타깃 44 CSS px, 권장 48px
- drag threshold 8~12px
- long press가 필요하면 500~650ms
- 3D viewport만 `touch-action: none`
- pinch 중 tap submit 방지
- 3D object drag와 camera orbit 동시 활성 금지
- Page 03 다이얼 조작 중 표본 drag 잠금
- Page 05 tracking 중 toolbar accidental tap 방지
- `pointercancel` 처리
- hover 전용 기능 금지

## 31. 접근성

- 성공/실패: 색 + 아이콘 + 텍스트
- reduced motion
- BGM/SFX 개별 mute
- 큰 글씨 옵션
- 중요한 3D zone은 DOM mirror button 제공
- 색각에 의존하는 영향 판정 금지
- 소리만으로 관찰 대상 위치 전달 금지
- 마우스/키보드 기본 지원
- 모든 핵심 활동은 카메라/마이크 없이 가능

## 32. 오류/Fallback

- WebGL 불가:
  - Page 01: 2.5D 연구소 지도 fallback
  - Page 09: 2D 모듈 작업대 fallback
  - Page 10: 2.5D 코어 결합 fallback
- GLB 로드 실패: proxy mesh + 핵심 기능 유지
- 이미지 로드 실패: 대체 검수 자산 또는 오류 안내
- 오디오 실패: 무음 진행
- IndexedDB 실패: session/local fallback
- portrait: 가로 회전 권장, 필수 제출은 가능
- Web Share 미지원: PNG 저장만 노출

## 33. 과학적 안전·오개념 방지

1. 실제 곰팡이 표본을 맨손으로 다루도록 유도하지 않는다.
2. 세균을 모두 병원균처럼 표현하지 않는다.
3. 균류를 모두 해롭다고 일반화하지 않는다.
4. 원생생물을 모두 같은 모습/움직임으로 표현하지 않는다.
5. 해캄과 짚신벌레의 관찰 특징을 게임 캐릭터 특징으로 대체하지 않는다.
6. 생명과학 활용 사례는 검수 데이터만 사용한다.
7. 5학년/6학년 자료의 전문 사례를 넣더라도 4학년 수준의 “어떻게 이용되는가” 범위로 단순화하고 세부 공정 원리를 필수 평가하지 않는다.
8. Page 09의 RUN 결과는 교육용 논리 검증 결과이며 실제 산업 효율·안전성을 의미하지 않는다.
9. 모든 관찰 자료의 출처/라이선스/검수 상태를 `source-notes.json`에 기록한다.

## 34. QA — 기능

- 10 route 진입/퇴장
- Stage 순차 해금
- 저장/복원
- Page 01 zone unlock
- Page 02 evidence collection
- Page 03 focus/brightness/magnification/capture
- annotation undo/redo
- Page 04 dropper/sample states
- Page 05 tracking/capture/compare
- Page 06 evidence relevance
- Page 07 hotspot scan
- Page 08 report validation
- Page 09 snap/connect/run/revise
- Page 10 code restore/artifact/export
- MissionResult 생성
- 허브 복귀

## 35. QA — 교육

- [4과12-01]이 이름 암기만으로 통과되지 않는가
- 균류 관찰에 실제 관찰 증거가 필요한가
- 현미경 조작에서 낮은 배율 → 초점/밝기 → 관찰 흐름이 반영되는가
- 해캄과 짚신벌레가 서로 다른 관찰 행동을 요구하는가
- 세균 화면이 자료 선별·근거 판단을 요구하는가
- 세균=나쁨, 균류=나쁨 오개념을 강화하지 않는가
- 생활 영향이 상황별로 판단되도록 구성되었는가
- [4과12-03]에서 학생이 실제 소개 자료를 제작하는가
- Page 09에 고등 생명공학 지식을 요구하지 않는가
- Page 10이 새 개념 시험이 아니라 종합·표현 화면인가

## 36. QA — 디바이스

우선순위:
1. Android Chrome
2. iPad Safari
3. Chromebook Chrome
4. Desktop Chrome/Edge

반복 메모리 테스트:
```text
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10
→ 09 → 10
```

3회 반복 후 renderer/texture/material/event listener 사용량이 회차마다 계속 증가하지 않는지 확인.

## 37. 분석 이벤트

```text
screen_enter
stage_complete

fungi_evidence_count
microscope_focus_attempt_count
microscope_capture_count
annotation_count

water_sample_retry_count
protist_tracking_attempt_count
protist_capture_count
protist_compare_count

bacteria_evidence_selected_count
bacteria_evidence_revision_count

impact_hotspot_count
impact_report_revision_count
impact_case_complete_count

solution_module_change_count
solution_run_count
solution_revision_count

artifact_revision_count
artifact_exported
lesson_complete
```

속도 자체를 학습 성취 지표로 과도하게 사용하지 않는다.

## 38. 개발 우선순위

### Vertical Slice
1. AppShell + Store + EventBus + Persistence
2. Page 03 현미경 분석실
3. Page 05 원생생물 추적실
4. Page 06 세균 데이터실
5. Page 09 최소 3D 모듈 조립 → RUN
6. Page 10 최소 BIO CORE 결합

검증:
- 터치 다이얼
- Canvas 관찰 합성
- Phaser ↔ Three.js 전환
- JSON 콘텐츠 로딩
- Page 09 draft serialization
- WebGL dispose
- state restore

### 2차
- Page 01, 02, 04

### 3차
- Page 07, 08

### 4차
- 최종 카드, 오디오, 접근성, PWA, 허브 연동

## 39. 완료 정의

- TypeScript strict error 0
- JSON validation 통과
- 10 Screen route 연결
- Page 01/09/10 3D lazy load
- 3D scene dispose 확인
- Phaser event/timer/audio 정리
- 새로고침 상태 복원
- 현미경 상태 판정 단위 테스트
- EvidenceRelevanceEngine 단위 테스트
- ImpactEvaluator 단위 테스트
- BioSolutionEngine 단위 테스트
- OX/객관식만으로 Stage 통과 불가
- 카메라/마이크 없이 완주
- 최종 연구 카드 PNG export
- MissionResult 생성
- 저사양 태블릿 30fps 목표
- Android/iPad 핵심 경로 QA
- 교사용 안내에 “실제 관찰을 보조·확장하는 디지털 도구”임을 명시

## 40. GitHub

Repository:
```text
life-code-lab
```

Description:
```text
An interactive Grade 4 science game for exploring fungi, protists, bacteria, their impacts on daily life, and applications of life science through observation, evidence analysis, and problem-solving.
```
