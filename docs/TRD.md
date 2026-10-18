# TRD 생명 코드 연구소

> 2026-10-18 변경: 현재 구현 기준은 [가로 태블릿 탐험 v1.2](TABLET_EXPLORATION.md)다. 2D Phaser 탐험·작업대·코어와 단계별 도구 UI가 이전 3D/2.5D 지정을 대체한다. 아래 v1.1 내용은 당시 설계 기록이며, 학습 완료 조건은 유지한다.

- 버전 1.1 · 작성일 2026-10-15 · 수정일 2026-10-16 · 상태: 구현 전 기술 설계.
- 기준: [PRD](PRD.md), [태블릿 탐구 경험 설계](INTERACTION_DESIGN.md), [mvp-spec.json](mvp-spec.json). 화면 ID·미션 ID·완료 조건은 동일하게 유지한다. 16절은 v1.1 상호작용 추가 계약이며 기존 상태 모델과 판정기를 확장한다.

## 1 기술 선택

| 영역 | 선택 | 책임 |
|---|---|---|
| 빌드 | Vite + TypeScript strict + npm lockfile | 정적 웹 배포, 타입 검사, 에셋 해시 |
| 2D·지도 | Phaser 3, Canvas 2D | 지도 이동·가림·표본 조작·현미경·추적 |
| 3D | Three.js + GLTFLoader | 5장 조립/가동과 최종 코어 |
| 공통 UI | HTML/CSS/SVG | 한글, 코너 제어, 대화, 자료 패널, 설정, 접근성 |
| 상태 | 타입 있는 단일 Store와 순수 reducer/evaluator | 학습 규칙과 렌더러 분리 |
| 저장 | IndexedDB, 설정용 localStorage | 사진 Blob과 초안/연구 기록 저장 |
| 결과물 | Canvas 2D, 브라우저 인쇄 | 연구 카드 PNG, 인증서 A4 |
| 검증 | Vitest, Playwright | 핵심 판정·저장·대표 브라우저 흐름 |

추가 UI 프레임워크·물리 엔진·서버 DB는 필요하지 않다. 정확한 라이브러리 버전은 구현 시작 시 호환 조합을 확인해 고정하고 lockfile을 커밋한다. 본 설계는 설치 결과나 최신 버전 검증 보고서가 아니다.

공식 설계 참고: [Phaser Scenes](https://docs.phaser.io/phaser/concepts/scenes)는 화면별 생명주기와 입력/시간/자산의 책임을, [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)는 트랜잭션 저장 구조를 참고했다. 3D 세부 API는 구현 때 고정한 Three.js 버전 문서와 대조한다.

## 2 런타임 구조

```text
AppShell
├─ Router / RouteGuard
├─ GlobalToolbar / Settings / ResearchKit / Dialogue
├─ SceneHost
│  └─ 현재 RouteController 하나
│     └─ Phaser 또는 Canvas2D 또는 Three 또는 DOM renderer
├─ Store / ActionDispatcher
├─ Domain Evaluators
├─ PersistenceService / AssetLoader / AudioService
└─ ResultExporter

입력 → Action → 상태 갱신 → 규칙 판정 → 저장 → 렌더 상태 반영
```

게임 규칙은 DOM이나 Three/Phaser 오브젝트를 참조하지 않는다. Renderer는 상태를 그려 주고 의미 있는 입력만 전달한다. 공통 Toolbar를 Scene마다 복제하지 않는다. DOM 뒤의 캔버스가 같은 터치를 중복 처리하지 않게 한다.

RouteController 계약:

```ts
interface RouteController {
  enter(context: SceneContext): Promise<void>;
  pause(reason: "overlay" | "hidden" | "navigation"): void;
  resume(): void;
  flushDraft(): Promise<void>;
  dispose(): Promise<void>;
}
interface LearningRenderer {
  mount(host: HTMLElement): Promise<void>;
  render(state: Readonly<RenderState>): void;
  pause(): void;
  dispose(): Promise<void>;
}
```

Router는 전환 토큰을 발급한다. 늦게 끝난 이전 화면의 로드 결과가 새 화면에 붙지 않게 한다. 떠나는 화면은 입력 차단 → 초안 저장 → 루프/구독 종료 → 새 화면 마운트 순으로 전환한다. 저장 실패 시 초안을 메모리에 유지하고 저장 상태를 표시한다.

## 3 라우트와 해금

URL hash 기반 `#/nature-map` 형태로 정적 호스트의 새로고침에 대응한다. 화면 목록과 기본 이전 경로는 mvp-spec.json의 15개 route를 사용한다.

일반 학습 경로:
- 메인과 지도는 항상 허용한다.
- M1 진입은 사건 의뢰 수령 후 허용한다.
- M2~M5 진입은 직전 미션의 실제 완료 연구 기록이 있어야 한다.
- 각 장의 두 번째 화면은 첫 번째 활동의 준비 상태를 요구한다.
- final-report는 E1~E5 실제 기록 모두를 요구한다.
- core-restoration은 최종 보고의 5종 확인을 요구한다.
- results는 실제 코어 가동 완료를 요구한다.

관리자 모드에서는 모든 경로와 준비 조건을 미리보기용으로 우회한다. 직접 URL 입력도 동일 RouteGuard를 통과한다. 일반 모드의 잠긴 주소는 지도와 필요한 조건 안내로 보낸다.

이전은 열린 모달/기록 뷰어 닫기를 우선한다. 일반 화면 이동은 명세상의 부모를 사용하고, 근거 원본 확인은 일시적 `returnTo`로 원래 작업에 복귀한다. 브라우저 뒤로 가기도 RouteGuard를 거친다. 화면 이동은 미션 완료를 발생시키지 않는다.

## 4 상태와 기록 모델

```ts
type StageId = "M1" | "M2" | "M3" | "M4" | "M5";
type EvidenceId = "E1" | "E2" | "E3" | "E4" | "E5";
type Origin = "learner" | "demo";
type Mode = "learner" | "admin-preview";

interface AppState {
  schemaVersion: 1;
  activeLearnerAttemptId: string;
  mode: Mode;
  settings: Settings;
  learner: AttemptState;
  preview?: AttemptState;
}
interface AttemptState {
  id: string;
  routeId: string;
  introAccepted: boolean;
  mapPosition: { x: number; y: number; facing: string };
  drafts: Partial<Record<StageId, StageDraft>>;
  evidence: Partial<Record<EvidenceId, EvidencePacket>>;
  finalReport: { confirmedEvidence: EvidenceId[] };
  restoration: {
    bindings: Partial<Record<EvidenceId, string>>;
    activated: boolean;
  };
  revision: number;
  updatedAt: string;
}
interface EvidencePacket {
  id: EvidenceId;
  stageId: StageId;
  attemptId: string;
  origin: Origin;
  assessmentEligible: boolean;
  recordIds: string[];
  captureIds: string[];
  passedCriteria: string[];
  contentVersion: string;
  createdAt: string;
}
interface CaptureRecord {
  id: string;
  attemptId: string;
  organismId: string;
  specimenAssetId: string;
  sourceId: string;
  blobId: string;
  view: { magnificationId: string; brightness: number;
          focus: number; panX: number; panY: number };
  quality: { focused: boolean; exposed: boolean; targetVisible: boolean };
  annotations: Array<{ points: Array<[number, number]>; featureId?: string }>;
}
```

JSON에 Blob·DOM 노드·Three Mesh·Phaser 객체·함수를 넣지 않는다. `blobId`로 별도 사진 저장소를 참조한다. 시간은 ISO 문자열, 관찰 좌표와 주석은 0~1 정규화 좌표를 쓴다.

완료 여부와 지도 시설 변화는 EvidencePacket에서 도출한다. 별도의 unlockedScreens/completedFlags를 서로 독립적으로 저장해 불일치를 만들지 않는다. 완료 기록은 불변 스냅샷으로 둔다. 완료 후 재탐색은 원본을 읽고 연습 초안을 사용하며, 새로운 정식 연구는 새 attemptId에서 수행한다.

## 5 관리자 전체 해금

`settings.adminUnlockAll` 한 개만 노출한다.

켜기:
1. 일반 학습 초안을 저장하고 learner 복귀 위치를 보존한다.
2. mode를 admin-preview로 전환한다.
3. 15개 화면의 접근 제한을 해제한다.
4. 빠진 선행 자료는 fixture에서 제공하고 모든 출력의 origin을 demo로 고정한다.
5. 화면에 “전체 해금 미리보기”와 예시 자료 표시를 둔다.

끄기:
1. preview 초안을 별도 공간에 보관한다.
2. mode를 learner로 바꾸고 일반 지도 위치로 복귀한다.
3. 일반 해금 조건과 실제 완료 기록을 다시 적용한다.

예시 자료와 미리보기 사진·완료·최종 가동은 일반 evaluator와 결과 내보내기의 학습 완료 근거로 사용할 수 없다. 미리보기 결과물을 내보내면 예시임을 표시한다. 스위치는 로컬 수업·시연 기능이며 서버 관리자 인증 기능이 아니다.

새로 시작할 때 저장된 adminUnlockAll을 읽어 mode를 결정한다. 켜져 있으면 preview 저장을 복원하고 꺼져 있으면 learner 저장을 복원한다. preview의 마지막 화면을 일반 학습의 이어하기 주소로 사용하지 않는다.

## 6 미션 판정기

각 판정은 `{ passed, missingCriteria, feedbackCodes }`를 반환한다. 누적 탭 수·정답 위치·다음 버튼 클릭을 완료 근거로 사용하지 않는다.

| 판정기 | 입력과 검증 |
|---|---|
| FungiEvaluator | 환경 단서 2종, 두 표본의 적정 초점/노출/시야 사진, 특징 영역과 주석의 연결, 근거 문장 |
| SampleEvaluator | 스포이드 단계 순서와 관찰 가능한 표본 상태 |
| ProtistEvaluator | 두 생물 기록, 추적 또는 보조 관찰, 비교 3항목, 같은 대상의 서로 다른 시점 근거 |
| BacteriaEvaluator | 관련 근거 최소 3개와 자료 유형 3종, 주장별 검수된 source/segment 연결 |
| ImpactEvaluator | 사건 4개, 사건별 독립 근거 2개, 빵의 유효 시점 쌍·변화 표시, 맥락 비교 |
| SolutionEvaluator | 검수 사례·생물/작용·유효 그래프, 현재 설계 버전의 RUN 성공, 실행 전 예상·결과 대조·설명 |
| FinalEvaluator | 같은 learner attempt의 E1~E5, 보고 5개 확인, 유효 포트 연결, 가동 입력 |

MVP의 설명은 선택 문장 조각과 근거 ID 연결로 검증한다. 자유 글을 생성형 AI나 키워드 검색으로 자동 채점하지 않는다.

### 현미경과 추적

현미경은 표본별 검수 메타데이터의 초점 범위, 적정 노출 범위, 특징 영역을 사용한다. 범위 밖에서는 표시 영상도 실제로 흐리거나 어두워진다. 특징 표시 판정은 정규화 좌표에서 수행한다. 표시 영상이 가짜 선명도 점수만 바꾸는 구조는 허용하지 않는다.

짚신벌레 이동은 교육용 애니메이션 경로임을 명시하고, 프레임 시간에 따른 이동으로 구현한다. 유지 시간은 설정값으로 분리한다. 멈춤·보조 관찰 방식은 동일한 형태 관찰·기록 결과를 요구한다. 모달이 열린 동안 시간과 대상 이동은 정지한다.

### 3D 조립과 가동

```ts
interface SolutionDraft {
  caseId: "yogurt";
  selectedEvidenceIds: string[];
  modulePlacements: Array<{
    id: string;
    moduleId: "input" | "bioprocess" | "output";
    dockId: "dock-0" | "dock-1" | "dock-2";
    rotationStep: 0 | 90 | 180 | 270;
  }>;
  payloadChoices: Record<string, string>;
  edges: Array<{ fromPort: string; toPort: string }>;
}
interface RunResult {
  draftRevision: number;
  passed: boolean;
  stoppedRelation?: string;
  observedOutcomeId: string;
  checks: Array<{ criterion: string; passed: boolean }>;
}
```

물리 시뮬레이션 없이 anchor/snap으로 배치한다. 같은 모듈을 중복 생성하지 않고 dock 하나에 모듈 하나만 둔다. 모듈 선택 → 자리 선택 방식도 드래그와 같은 Action을 호출한다.

배치 순서의 보기 좋은 정렬만으로 통과하지 않는다. payloadChoices의 생물·작용과 사례 자료, edges의 흐름을 함께 검증한다. RUN 중 배치는 잠그고 중지/돌아가기에서 초안을 유지한다. 실패한 연결과 관찰 결과를 보여주고 성공 위치를 자동 배치하지 않는다.

SolutionScene2D와 SolutionScene3D는 같은 SolutionDraft와 evaluator를 공유한다. 렌더러 전환으로 새로운 판정이나 다른 완료 조건이 생기지 않는다.

## 7 지도 좌표와 픽셀아트

- 지도는 사선으로 그린 2D 스프라이트를 사용한다. 3D 공간, 자유 카메라 회전, 점프·전투는 없다.
- 기본 픽셀 뷰포트 320×180, 월드 최대 960×540을 제작 시작 기준으로 둔다. UI는 별도 DOM 해상도다.
- 지도 픽셀 버퍼는 사용 가능한 영역에서 정수 배율로 확대하고 중앙 배치한다. 1280×720은 4배, 1024폭은 가용 영역에 따라 3배를 우선 검토한다. 안전영역·실제 표시 크기는 실측한다.
- 바닥 타일은 32×16 기준, 플레이어 기준 셀은 24×32로 잡는다. 다른 픽셀 단위를 섞지 않고 시안 확정 때 함께 조정한다.
- 충돌/길찾기는 화면상의 walkable grid와 입구 trigger 영역으로 별도 정의한다. 건물 그림의 픽셀 색으로 경로를 추정하지 않는다.
- 탭을 역변환한 지도 좌표에서 A* 경로를 구하고, 이동 중 재탭하면 현재 위치에서 재탐색한다. 키보드 입력은 자동 이동을 취소한다.
- 캐릭터 발 위치와 foreground 기준점을 사용해 Y 깊이 순서로 그린다. 복구 전후 시설은 같은 좌표와 충돌 영역을 유지한다.
- 마지막으로 들어간 입구 근처 안전 좌표를 복귀 위치로 저장한다. 잘못된 좌표는 중앙의 유효 spawn으로 보정한다.

## 8 공통 UI와 입력 책임

AppShell 안에 scene host와 DOM overlay를 형제로 둔다. overlay 기본 영역은 pointer-events:none, 버튼·패널만 auto다. Renderer 입력은 UI가 소비한 터치를 받지 않는다.

- 코너 제어는 실제 CSS 48px 이상이며 DPR·캔버스 배율로 작아지지 않는다.
- z-index는 배경 0, scene 10, HUD 20, 기록 패널 30, modal 40, 긴급 상태 50을 사용한다.
- 초점 가능한 컨트롤에는 한글 접근성 이름과 키보드 초점 표시를 제공한다.
- 모달에서 초점을 제한하고 닫을 때 호출 버튼으로 돌린다. 지도·추적·RUN은 pause한다.
- 슬라이더는 키보드 지원 DOM range를 기준으로 하고 원형 다이얼은 시각 표현으로 덧붙인다.
- pointercancel, 창 이탈, 설정 열기에서 드래그를 취소하고 마지막 확정 위치를 복원한다.
- 캔버스 좌표를 따라가는 DOM 표시만 실제 canvas rect와 world/camera transform으로 변환한다. 전체 overlay가 같은 크기라고 가정하지 않는다.
- home/back은 저장 진행 상태를 반영하며 연속 입력으로 두 번 전환하지 않는다.
- 소리 설정은 모든 화면이 AudioService 하나를 통해 사용한다. 최초 사용자 입력 이후 재생을 활성화한다.

색은 기존 배경의 청록·남색·밝은 연구 노트 패널을 따른다. 기준 토큰은 surface #FFFDF5, text #16323F, primary #0B6B63, reward #F2C66D다. 색상별 대비는 구현 화면에서 계산하며 문서의 색만으로 통과 판정하지 않는다. 글꼴은 로컬 설치 시스템 한글 sans-serif를 기본으로 하고, 별도 폰트는 라이선스와 용량 확인 후 동봉한다.

## 9 저장과 오류 복구

DB `life-code-lab`, version 1:

| Object store | 키와 내용 |
|---|---|
| attempts | attemptId → 학습/미리보기 상태와 revision |
| captures | captureId → Blob과 촬영·주석 메타데이터 |
| evidence | attemptId:evidenceId → 완료 스냅샷 |
| artifacts | attemptId:artifactId → 카드 초안과 내보내기 정보 |

설정은 `life-code:settings:v1` localStorage에 저장한다. 마지막 학습 시도 ID만 `life-code:last-attempt:v1`로 둔다. localStorage를 사용할 수 없으면 설정도 메모리에서 유지한다.

- 사진 저장과 그 사진을 참조하는 상태 갱신, 미션 완료 기록과 상태 갱신은 각각 하나의 IndexedDB 트랜잭션으로 처리한다.
- 촬영·기록 확정·RUN 종료·보고 확인·코어 가동은 즉시 저장한다. 연속 초안 변경은 500ms debounce한다.
- 전환 시 명시적으로 flush한다. visibilitychange에서도 저장을 시도하되 종료 직전 비동기 작업만을 유일한 저장 수단으로 삼지 않는다.
- DB 사용 불가는 MemoryRepository로 전환하고 “이번 화면을 닫으면 기록이 사라질 수 있어” 상태를 표시한다. 세션 안에서는 완주·PNG 내보내기를 지원한다. localStorage에 사진까지 영구 보존한다고 약속하지 않는다.
- quota 초과는 기존 기록을 지우지 않고 현재 초안을 보존한다. 메모리 저장과 영구 저장 상태를 구분해 알린다.
- 복원할 때 schemaVersion·routeId·참조 사진 존재 여부를 검증한다. 깨진 기록을 완료로 인정하지 않고 복구 가능한 초안과 마지막 유효 화면으로 돌아간다.
- 향후 버전의 DB는 명시적 migration을 거친다. JSON을 읽지 못했다고 전체 초기화하지 않는다.

## 10 렌더 루프와 3D 자원

DOM 화면에는 지속적인 게임 루프가 필요 없다. 추적/지도/가동 등 현재 활동에 필요한 루프만 실행한다.

Three 진입 전에 Phaser 업데이트·렌더 루프를 멈추고 Phaser 입력을 해제한다. Three 종료 시 animation frame, controls, 이벤트 구독을 정리한다. 재사용하지 않는 geometry/material/texture를 해제하고 AssetLoader의 공유 자원 참조 수를 관리한다. 사진의 Object URL도 패널 종료 때 해제한다.

3D 파일이 없거나 실패하면:
1. 기능 개발에서는 코드로 만든 단순 형태 모델을 사용하고 임시 에셋 상태를 기록한다.
2. WebGL 불가·컨텍스트 손실·반복 로드 실패에서는 같은 초안을 사용하는 2D renderer로 전환한다.
3. 사용자에게 다시 처음부터 시작하도록 요구하지 않는다.
4. 최종 시각 수용 검증은 승인된 3D 에셋을 적용한 뒤 수행한다.

## 11 자산과 성능 목표

초기 메인은 엔진·대형 이미지 전체를 미리 받지 않는다. 지도는 지도 묶음, 3D는 첫 진입에 필요한 모듈만 동적 로드한다. 다음 미션의 소형 자료만 유휴 시점에 미리 받을 수 있다.

| 항목 | MVP 목표 예산 |
|---|---|
| 최초 화면 필수 전송량 | 압축 합계 2MB 이하 목표 |
| 개별 2D 배경 | WebP 0.5MB 이하 목표, 필요 시 화면별 예외 기록 |
| 지도 묶음 | 이미지·애니메이션 합계 2MB 이하 목표 |
| 활성 3D 장면 | 화면 내 삼각형 80k 이하 목표 |
| 3D 모델·텍스처 한 묶음 | 압축 전송량 5MB 이하 목표 |
| 3D 텍스처 | 기본 1024, 필요한 단일 atlas만 2048 |
| 3D 렌더 | 낮은 프로필 DPR 1, 동적 그림자·후처리 없음 |
| 동작 | 목표 학교 태블릿 30fps 이상, 일반 데스크톱 60fps 목표 |

위 수치는 예산이며 측정 결과가 아니다. 공통 연출은 입자 대신 단순 재질 발광·흐름 표시를 우선한다. 3D 카메라는 제한된 회전·확대만 지원하며 오브젝트 드래그 중 회전을 잠근다. 홈/지도/3D를 3회 왕복하면서 계속 증가하는 renderer·이벤트·Object URL이 없는지 확인한다.

## 12 콘텐츠와 결과물

런타임 콘텐츠는 organisms, observation-sources, bacteria-sources, impact-cases, solution-cases, dialogue, asset-manifest로 분리한다. 배포 manifest에 다음 정보를 포함한다.

```ts
interface ContentSource {
  id: string;
  version: string;
  sourceUrl?: string;
  credit: string;
  rights: string;
  reviewStatus: "draft" | "approved" | "rejected";
  visualType: "observation" | "diagram" | "game-art";
}
```

release에서 사용하는 과학 자료는 approved와 사용 권한을 요구한다. 개발용 모형은 diagram으로 표시하고 관찰 사진이라고 부르지 않는다. 학생 학습 데이터와 관리자 fixture는 별도 파일·저장 공간을 사용한다.

연구 카드는 같은 출처에서 제공한 이미지 Blob과 로컬 UI만 Canvas 2D에 합성한다. 학생 입력을 HTML로 실행하지 않는다. PNG 목표 1600×1000, 내용이 넘치면 문장을 줄여 편집하도록 안내하고 조용히 잘라내지 않는다. 인증서는 결과 화면의 인쇄용 DOM과 A4 print CSS를 사용한다. 외부 공유 API·카메라·마이크는 필수 기능이 아니다.

장별 완료 판정과 최종 결과는 attemptId로 멱등 처리한다. 재방문·새로고침·레버 중복 클릭이 기록이나 보상을 추가하지 않는다.

## 13 구현 파일 구조

다음은 앞으로 만들 구조이며 현재 실행 소스가 존재한다는 뜻은 아니다.

```text
src/
  app/              router, app shell, state, actions
  ui/               toolbar, settings, dialogue, research kit
  domains/          stage evaluators, solution graph, final evaluator
  scenes/           map, fungi, protist, bacteria, impact
  renderers/        solution-3d, solution-2d, core-3d, core-2d
  services/         persistence, audio, assets, exports
  content/          versioned content and approved source metadata
public/assets/
  backgrounds/ characters/ map/ observations/ models/ audio/
tests/
  unit/             domain and storage contracts
  e2e/              learner, admin preview, fallback, resume
docs/               이번 설계 문서와 mvp-spec.json
references/         원본 자료와 압축 해제본
```

## 14 구현 시 검증

- 순수 판정기: 정상 근거, 누락 근거, 무관 자료, 잘못된 그래프, 다른 attempt/demo 출처 거부.
- 저장: 사진+상태의 원자성, 새로고침 복원, quota/저장소 차단, 완료 중복 방지.
- 브라우저: 전체 일반 경로, 관리자 전체 해금과 복귀, 3D 실패→2D 전환, 카드 내보내기.
- 화면: 1280×800·1024×768·1280×720에서 UI 겹침, 48px 터치 영역, 모달 입력 차단, 글자 확대.
- 실제 기기: Android Chrome과 iPad Safari에서 저장·터치·가동·내보내기 및 성능. 기기가 없으면 미검증으로 남긴다.

[MVP 구현 순서와 수용 검증](IMPLEMENTATION_PLAN.md)에 단계별 완료 조건을 연결한다.

## 15 개발 파일 위치

작업 루트는 현재 F:/iscreammedia_sc34/8 creatures다. 앱·생성 자산·빌드·다운로드·패키지 캐시·임시파일은 이 프로젝트 안에 둔다. 개발 명령의 TEMP/TMP는 프로젝트 안의 .tmp, npm 캐시는 .cache/npm으로 지정한다. 이전 문서의 D: 경로는 현재 실행 경로로 사용하지 않는다.

기존 exFAT 환경의 제약을 고려해 npm을 사용하고 심볼릭 링크·하드링크·NTFS 권한에 의존하는 구성을 기본값으로 택하지 않는다. 현재 F:의 파일시스템 종류는 별도 확인 전까지 단정하지 않는다. C:로 프로젝트를 복제하거나 대용량 런타임·캐시를 설치하지 않는다.

## 16 v1.1 탐구 상호작용 계약

앱 구현 전이므로 저장 schemaVersion은 1로 유지하고 콘텐츠/설계 버전을 1.1로 둔다. 아래 모델은 구현용 계약이며 이미 배포된 API라는 뜻이 아니다. 실제 저장본이 발견되면 무조건 초기화하지 않고 마이그레이션 필요성을 확인한다.

### 자료와 좌표

```ts
interface ObservationFrame {
  id: string;
  assetId: string;
  order: number;
  observedAt?: string;          // 원자료에 있는 시각만
  elapsedSeconds?: number;     // 원자료에 있는 경과 시간만
  frameToSpecimen: number[];   // 검수된 2D 좌표 변환; 없으면 겹침 비교 금지
}
interface ObservationSequence {
  id: string;
  sourceId: string;
  specimenId: string;
  contentVersion: string;
  visualType: "observation" | "diagram";
  frames: ObservationFrame[];
  validComparisons: Array<{
    beforeId: string; afterId: string;
    changeRegions: Array<{ id: string; polygon: Array<[number, number]> }>;
  }>;
}
interface TemporalEvidence {
  id: string;
  attemptId: string;
  origin: Origin;
  sequenceId: string;
  sourceId: string;
  contentVersion: string;
  specimenId: string;
  beforeFrameId: string;
  afterFrameId: string;
  annotations: Array<{ frameId: string; points: Array<[number, number]>; featureId?: string }>;
  trackId?: string;            // M2에서 같은 개체를 식별하는 ID
}
```

TemporalEvidence의 trackId는 M2에서 같은 개체를 식별하는 데 사용한다.

관찰 이미지 안의 정규화 좌표와 화면 좌표를 분리한다. M1 촬영 사진은 촬영 시 view를 고정하고 이후 실시간 시야 변경으로 주석을 움직이지 않는다. M2는 대상 위치와 카메라 위치를 별도로 저장하고 재생·경로는 표본 좌표로 그린다. M4 비교는 검수된 변환으로 위치를 맞춘다. 변환을 신뢰할 수 없는 자료는 나란히 표시만 하고 정렬 오차를 실제 변화처럼 강조하지 않는다.

### 미션별 상태와 Action

| 미션 | 초안에 추가할 상태 | 의미 있는 Action | 판정/저장 시점 |
|---|---|---|---|
| M1 | baselineCaptureId, observation/annotation 모드, 주석 초안 | baseline.pin, view.change, capture.create, annotation.commit | 촬영·표시 확정 즉시 저장; 연속 조절은 debounce |
| M2 | recordingId, trackId, playbackFrameId, A/B, 경로 표시 여부 | playback.seek, frame.pin, comparison.commit | 시점 고정·비교 확정 즉시 저장 |
| M3 | claimId, sourceId/segmentId 연결, 설명 선택 | evidence.bind/unbind, claim.change | 해당 주장 재판정 후 초안 저장 |
| M4 | caseId, sequenceId, A/B, 변화 표시, 관련 작용 자료 | timeline.seek, pair.pin, change.mark, report.commit | 시점 쌍·표시·사건 보고 확정 즉시 저장 |
| M5 | designRevision, predictions, runs, selectedRunId, reflection | design.change, prediction.commit, run.start/finish/cancel, reflection.commit | 예상·실행 시작/종료·대조 확정 즉시 저장 |

M1 baseline은 기존 CaptureRecord ID를 참조하며 사진 Blob을 중복 복사하지 않는다. M2는 검수된 영상의 frame ID 또는 버전이 고정된 교육용 이동 경로+대상 ID+시점으로 재생한다. 생방송 카메라 녹화나 매 프레임 화면 저장은 필요 없다. 모형 궤적을 실측 자료로 내보내지 않는다.

M2의 A/B는 같은 recording/source/track에서 서로 다른 시점이며 의미 있는 위치 변화를 확인할 수 있어야 한다. M4의 A/B는 같은 sequence/specimen, before.order < after.order이며 validComparisons에 등록된 조합을 사용한다. changeRegions는 해당 쌍에 대한 허용 영역이다. UI의 점 하나와 정확히 일치해야 한다는 판정을 피하고 검수된 영역과 합리적인 터치 허용치를 사용한다. 동일 프레임·다른 표본·무관 표시를 거부한다. 시점 쌍 두 이미지를 사건 근거 두 종류로 중복 계산하지 않는다.

### 주장과 원문 구간

```ts
interface SourceSegment {
  id: string;
  sourceId: string;
  contentVersion: string;
  textRange?: [number, number];
  imageRegion?: Array<[number, number]>;
  supportedClaimIds: string[];
  incompatibleClaimIds: string[];
}
interface ClaimBinding {
  claimId: string;
  sourceId: string;
  segmentId: string;
}
```

segment는 이미지 영역 또는 원문 구간을 가리킨다. 학생이 선택한 구간이 해당 원자료에 속하는지 검증한다. 선택한 구간의 검수 관계로만 상태를 도출한다. 지원 구간이 없으면 ‘근거 부족’, 불일치 구간이 있으면 ‘이 자료와 맞지 않음’, 지원이 있고 미해결 불일치가 없으면 ‘확인 가능’이다. 무관 자료는 불일치가 아니라 부족 상태다. 불일치와 지원 자료를 동시에 붙인 상태는 설명 확인 전까지 통과하지 않는다. 반대 자료를 몰래 삭제하지 않고 각각의 원문을 보여준다. 자유 글은 자동 채점하지 않는다.

### 예상·실행 이력

기존 SolutionDraft/RunResult에 아래 계약을 확장한다. designRevision은 모듈 내용·배치·연결이 바뀔 때 증가하며 UI 탭·카메라 이동·이전 결과 조회로는 바뀌지 않는다.

```ts
interface PredictionRecord {
  id: string;
  designRevision: number;
  expectedOutcomeId: string;
  reasonId: string;
  evidenceIds: string[];
}
interface RunRecord {
  id: string;
  attemptId: string;
  origin: Origin;
  contentVersion: string;
  designRevision: number;
  predictionId: string;
  designSnapshot: SolutionDraft;
  result?: RunResult;          // draftRevision은 designRevision과 동일
  status: "running" | "completed" | "interrupted";
  reflection?: { relation: "matches" | "differs"; explanationId: string; evidenceIds: string[] };
}
```

RUN은 현재 designRevision에 연결된 예상이 있어야 시작할 수 있다. 예상의 옳고 그름은 시작/완료 제한으로 쓰지 않는다. start 시 예상·설계 스냅샷을 고정하고 runId로 멱등 처리한다. RUN 중 배치를 잠근다. 중지·화면 이탈·새로고침으로 미완료 실행이 남으면 interrupted로 보존하고 결과를 만들어 내지 않는다. 같은 설계의 새 실행은 기존 예상을 확인해 사용할 수 있다.

RunResult는 해당 스냅샷만 평가한다. 모델 판정 결과를 단계별로 재생하며 연출 종료 여부가 성공 판정을 바꾸지 않는다. 완료 후 예상/관찰의 일치 여부와 설명을 검수된 선택지로 확인한다. 이전 RUN과 비교할 때 각 결과는 자신의 스냅샷·예상을 유지하고 현재 초안으로 덮어쓰지 않는다. 성공 후 설계 수정 시 이전 성공은 이력으로 남지만 현재 초안 완료에는 사용할 수 없다. renderer 전환은 runId·designRevision·진행 상태를 유지한다.

대표 결과 코드는 connection-missing / action-unsupported / outcome-unsupported / supported다. 연결 누락을 먼저 확인하고 그 다음 사례와 작용, 결과 관계 순으로 안내한다. 이 코드는 실제 제조 실패의 과학적 원인을 시뮬레이션하는 값이 아니다.

### 저장·기록·복원

attempts에는 위 초안·TemporalEvidence·ClaimBinding·PredictionRecord·RunRecord를 저장한다. 원자료는 contentVersion/source ID로 참조하고 captures에는 학생 사진 Blob만 둔다. 완료 EvidencePacket의 recordIds는 해당 attempt의 기록을 참조한다. E2는 시점 쌍, E3는 주장/구간 연결, E4는 시점 쌍과 사건 보고, E5는 성공 RUN과 대조를 포함한다.

사용 중인 완료 기록·비교 대상으로 고정한 기록은 용량 확보를 이유로 자동 삭제하지 않는다. 자료 버전 불일치나 누락 참조는 ‘자료 재확인 필요’로 표시하고 초안을 유지한다. 새로운 실제 기록으로 자동 대체하거나 예시 기록을 넣어 통과시키지 않는다. 미리보기는 기존 origin=demo 격리를 그대로 적용한다.

최종 코어의 회고 썸네일은 recordIds/captureIds에서 만들며 그림만으로 새 완료 근거를 생성하지 않는다. 재생을 건너뛰어도 기존 보고 확인과 최종 가동 조건은 동일하다.

### UI·성능·검증

시간 탐색·재생에는 현재 묶음만 로드한다. M4의 4개 사건 전체 고해상도 시퀀스를 첫 화면에 내려받지 않는다. 공통 초기 2MB 예산은 유지한다. 대표 빵 시퀀스는 최소 4개의 정렬된 관찰 이미지로 시작하고 전송량은 실제 자산 확보 후 산정한다. 로딩 실패 시 현재 시점을 유지하며 재시도한다. 아직 없는 프레임을 빈 사진이나 임의 합성으로 대신하지 않는다.

undo는 확정된 주석·시점 고정·근거 연결·모듈 배치의 직전 초안 변경에 적용한다. 완료 기록과 실행 스냅샷은 바꾸지 않는다. 모달·pointercancel·창 비활성화 시 미확정 드래그를 취소하고 재생·시간을 정지한다. 모든 제스처는 단일 포인터와 버튼 대체를 제공한다.

AC-13~19를 추가하고 세 화면 크기(1280×800·1024×768·1280×720), 보조 입력, 예시 격리, 자료 누락, 중단 실행, 오래된 성공 결과 사용, 카메라 이동과 생물 이동 혼동을 회귀 검증한다. 이는 예정된 검증이며 실행 결과가 아니다.

