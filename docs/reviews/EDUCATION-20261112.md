# 교육 내용 검토 · 2026-11-12

## 범위와 판정 근거

- 기준 버전은 교육 개선을 반영한 실행 코드 `35486baf8c86acbc426b981aa6728c877612cb74`와 운영 배포 `71a00e0b`다. 15개 경로, 20개 탐구 활동, 5개 탐정 사건, 개념 자막, 과학 낱말 설명, 보고서와 소개 카드의 내용을 대조하고 공개 주소에서 재검증했다.
- 경기도교육청 공식 자료의 인쇄 쪽수 92쪽에 제시된 2022 개정 과학과 성취기준과 코드·범위를 확인했다. 아래의 기준 설명은 검토용 요약이다.
- `4과12-01`은 균류·원생생물·세균의 특징과 사는 곳을 관찰 자료로 설명하는 활동에 연결한다. `4과12-02`는 생활에 미치는 영향을 조사하고 발표하는 활동에 연결한다. `4과12-03`은 생명과학 활용 사례를 소개하는 자료 제작·공유에 연결한다.
- 소스·자료 대조와 문구 수정을 마친 뒤 공개 주소의 교육 UI, 전체 탐구 흐름, 135개 페이지 화면, 180개 활동 화면, 35개 탐정 화면 검사 결과를 확인했다. 커밋 재빌드 175개 파일과 작업 빌드가 일치하고, 공개 검증 대상 174개 파일의 해시도 일치했다.
- 실제 교사의 최종 내용 승인과 초등학생의 사용·이해도 조사는 미확인 상태다. 소스의 `contentReview.needsReview=true`, `reviewer=null`을 유지한다.

근거 파일은 [활동·성취기준 데이터](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/curriculum.ts), [15개 경로 정의](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/content.ts), [활동 진행·제출](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/scenes/inquiry.ts), [학습용 모형과 자료 고지](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/inquiry-sources.ts)다.

## 15개 경로와 성취기준 연결

입구·출구 경로의 활동 구분은 정상 순차 진행을 기준으로 적었다. 각 연구소의 두 경로는 같은 장면 함수를 사용하며 저장된 활동 위치를 이어받는다.

| 경로 | 정상 진행의 교육 역할 | 연결 기준 | 확인할 산출물 또는 행동 |
| --- | --- | --- | --- |
| `main` | 탐험 목적과 조작 도입 | 01~03 학습 진입 지원 | 탐험 시작·이어하기 |
| `nature-map` | 연구소 선택과 탐구 순서 안내 | 01~03 활동 연결 | 연구소별 완료 기록과 다음 위치 |
| `fungi-field` | M1-1~2 발견 장소와 버섯 관찰 | 01 | 장소 연결, 주름·포자 관찰 기록 |
| `fungi-microscope` | M1-3~4 곰팡이 관찰과 두 표본 비교 | 01 | 관찰 사진, 특징·공통점 분류 |
| `water-sampling` | M2-1~2 표본 준비와 해캄 관찰 | 01 | 채집 장소·준비 과정, 해캄 사진 |
| `protist-observation` | M2-3~4 짚신벌레 움직임과 비교 | 01 | 같은 시야의 두 순간, 모양·장소 분류 |
| `bacteria-sources` | M3-1~2 자료의 종류와 세균 특징 | 01 | 관찰·추측 구별, 모양·크기·장소 근거 |
| `bacteria-profile` | M3-3~4 사는 곳과 주장 검토 | 01, 02 연결 준비 | 장소 자료 선택, 새 자료에 따른 생각 변화 |
| `impact-investigation` | M4-1~2 빵·낙엽 변화 비교 | 02 | 전후 고정, 변화 위치, 관련 작용 자료 |
| `impact-analysis` | M4-3~4 생활 영향의 상황별 비교 | 02 | 여섯 생활 사건의 영향 분류 |
| `solution-assembly` | M5-1~2 요구르트·빵 반죽 설계 | 03 | 재료·작용·결과 연결, 예상과 실행 비교 |
| `solution-run` | M5-3~4 낙엽 분해 활용과 소개 카드 | 03 | 활용 설계, 사례·작용·근거가 담긴 카드 |
| `final-report` | 다섯 탐구 기록 확인과 생활 사건 발표 준비 | 01~03 종합, 발표는 02 | 조사 사건·근거·생활 연결을 담은 발표 문장 |
| `core-restoration` | 유효한 탐구 기록을 다시 읽고 연결 | 01~03 복습 | 다섯 기록 연결과 발견 재확인 |
| `results` | 활용 사례 소개·공유와 자기 점검 | 03, 01~02 복습 | 소개 카드, PNG 저장·인쇄, 짝에게 설명하기 |

발표 기능은 조사한 생활 사건을 고르고 근거와 생활 연결을 작성·저장하도록 구성되어 있다. 실제 말하기와 상대 학생의 이해 여부는 수업 현장에서 확인해야 한다. 코어 복구는 다섯 기록을 재확인하는 이야기 연출로 해석한다. [보고서·결과 장면](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/main.ts), [코어 장면](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/scenes/solution.ts)

## 20개 활동별 관찰·증거·설명 연결

| 활동 | 기준 | 학습자가 다루는 자료·행동 | 설명으로 연결하는 내용 |
| --- | --- | --- | --- |
| M1-1 | 01 | 죽은 나무·축축한 빵의 발견 기록을 표본에 연결 | 이번 버섯·곰팡이가 발견된 장소 |
| M1-2 | 01 | 돋보기·현미경 모형에서 주름과 포자를 살피고 사진 기록 | 이번 버섯의 주름과 포자 관계 |
| M1-3 | 01 | 곰팡이 모형의 가는 실과 둥근 부분을 살피고 사진 기록 | 이번 곰팡이의 균사·포자주머니 |
| M1-4 | 01 | 두 관찰 기록과 균사 구조 설명 자료를 분류 | 두 표본의 다른 점·공통점, 균류의 예 |
| M2-1 | 01 | 장소 선택, 한 방울 채집, 유리판 준비 | 관찰 표본의 출처와 준비 순서 |
| M2-2 | 01 | 초록색의 길게 이어진 해캄 확대 모형을 기록 | 해캄의 모양과 물에서 얻은 표본 |
| M2-3 | 01 | 같은 짚신벌레의 서로 다른 순간을 고정하고 섬모 위치 표시 | 위치 변화와 이동에 관여하는 섬모 |
| M2-4 | 01 | 해캄·짚신벌레의 모양·움직임·장소 기록 분류 | 물에서 사는 두 원생생물의 차이와 공통점 |
| M3-1 | 01 | 세균 확대 모형과 확인 전 생각을 구별 | 확인한 내용과 추측의 차이 |
| M3-2 | 01 | 모양·크기·장소 자료 연결과 크기 사다리 | 여러 모양, 매우 작은 크기, 다양한 장소 |
| M3-3 | 01 | 세균 조사와 발견 장소가 함께 있는 자료 선택 | 생김새 자료와 장소 자료가 뒷받침하는 내용 |
| M3-4 | 01 | 처음 생각, 요구르트·상한 우유 자료, 유지·수정 기록 | 새 자료를 근거로 세균에 관한 주장 조정 |
| M4-1 | 02 | 같은 빵 모형의 전후를 고정하고 변화 표시 | 먹으려던 빵의 변질 사례 |
| M4-2 | 02 | 낙엽 전후 변화와 분해에 관한 조사 자료 확인 | 균류·세균이 분해에 관여한다는 설명 |
| M4-3 | 02 | 빵 변질·요구르트·낙엽·물속 먹이 관계 비교 | 생물의 생활 영향을 목적·상황에 따라 판단 |
| M4-4 | 02 | 효모의 빵 반죽·충치 자료를 추가로 비교 | 균류의 이용과 일부 세균의 해로운 영향 |
| M5-1 | 03 | 우유·유산균·요구르트 연결, 예상, 실행 비교 | 유산균의 당 이용·젖산 생성과 요구르트 변화 |
| M5-2 | 03 | 준비된 재료·결과 사이의 작용 선택, 예상, 실행 비교 | 효모가 만든 기체와 반죽의 부풂 |
| M5-3 | 03 | 낙엽 분해 작용 선택, 예상, 실행 비교 | 분해 작용을 퇴비 만들기에 활용하는 관계 |
| M5-4 | 03 | 소개 사례·생물 작용·근거 선택과 문장틀 또는 직접 문장 | 생활 속 생명과학 활용 사례를 소개하는 자료 |

활동의 상세 문구와 제출 판정은 [활동 데이터](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/curriculum.ts), [판정 함수](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/inquiry-evaluate.ts), [기록 게시](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/inquiry-records.ts)에서 대조했다.

## 연구소별 과학적 흐름

- M1은 발견 장소에서 출발해 눈에 보이는 형태를 기록하고 구조 설명 자료를 보완한 뒤 공통점을 분류한다. 곰팡이에서 관찰한 균사와 버섯의 균사 구조를 알려 주는 설명 자료의 출처를 구분하도록 탐정 단서를 수정했다.
- M2는 표본의 출처·준비를 남기고 모양을 살핀 뒤 같은 표본·같은 시야의 두 순간으로 위치 변화를 확인한다. 같은 연못에서 발견되었다는 사실만으로 두 생물을 같은 종류로 판단하지 않도록 탐정 사건이 연결된다.
- M3는 확인한 자료와 추측을 구별하고, 모양·크기·장소 각각에 맞는 근거를 고른다. 처음 생각과 새 자료 이후의 생각을 보존해 주장 유지와 수정을 모두 허용한다. 모든 세균을 해롭다고 일반화하는 생각을 사례 비교로 검토한다.
- M4는 전후 모습을 기록하고 분해·변질의 설명 자료와 연결한다. 전후 그림만으로 모든 원인 생물을 알아냈다고 단정하는 것을 제한한다. 균류·원생생물·세균의 영향을 사례의 목적과 상황에 맞추어 비교하고 보고서 발표 기능으로 이어진다.
- M5는 재료·생물의 작용·결과를 연결하고 예상과 실행을 비교한다. 첫 예상의 정오보다 실행 후 근거와 비교를 중시한다. 마지막에는 선택한 사례와 작용을 카드로 만들어 공유하는 구조다.

탐정 사건의 판정은 단서를 설명의 근거와 단정할 수 없는 정보로 분류했는지 확인한다. 이를 힌트와 자료를 활용한 근거 연결 활동의 완료 지표로 해석한다. 학생이 스스로 말로 설명하는 능력은 별도 수업 관찰이 필요하다. [탐정 사건](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/detective-cases.ts), [탐정 판정·화면](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/detective-board.ts)

## 발견 사항과 조치

| 항목 | 근거와 조치 | 작성 시점 상태 |
| --- | --- | --- |
| M1 관찰과 설명 자료의 구별 | 탐정의 “두 관찰 모형에서 균사” 문구를 곰팡이의 가는 실 관찰과 버섯 균사 설명 자료 읽기로 나누었다. | 소스·배포 파일 일치, 공개 탐정 검사 통과 |
| 발효의 범위 | M5-1에서 미생물이 재료를 바꾸는 모든 과정을 발효로 읽을 수 있던 문장을 요구르트 사례의 발효로 한정했다. | 소스·배포 파일 일치, 공개 전체 흐름 검사 통과 |
| M4 목표의 생물 범위 | 실제 물속 먹이 관계 과제에 맞추어 목표에 원생생물을 포함하고 관련 자료 비교를 명시했다. | 소스·배포 파일 일치, 공개 활동 화면 검사 통과 |
| M4 영상의 시간 표현 | 활동의 순서 모형에 맞추어 특정 일수 표현을 바꾸고 자막·영상 글자·관련 메타데이터를 동기화했다. | 18초 MP4·VTT·앱 자막·manifest 동기화, 실제 프레임·자막 단위 검사, 공개 재생·장면 이동·자막 검사 통과 |
| 과학 낱말 도움 | 균류·균사·포자·섬모·발효 등 새 정의를 검토했다. 분해의 “더 작은 물질”을 “더 단순한 물질”로, 유산균은 알맞은 식품용 종류로, 충치는 입속의 일부 세균으로 구체화한 소스를 재확인했다. | 공개 교육 UI에서 다섯 연구소의 낱말 도움·강조와 안내 검사 통과 |
| M5 소개 글이 빈 경우 | 정상 제출은 빈 문장을 `introduction` 문장틀로 채운다. 카드에도 선택 사례·작용·설명이 포함된다. 글자 수를 추가 완료 조건으로 두지 않는다. | 정상 제출 경로 확인, 공개 전체 흐름·PNG 내보내기 통과 |
| 학습 효과와 교사 승인 | 활동·자료·피드백 구현을 확인했다. 실제 학생의 흥미, 이해, 성취 향상과 교사의 최종 승인은 실증 자료가 필요하다. | 현장 검증 미확인 |

수정 위치는 [M1 탐정 문구 5행](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/detective-cases.ts), [발효·M4 목표 44·61행](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/curriculum.ts)이다. 영상 추적 위치는 [개념 자막](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/concept-captions.json), [영상 데이터](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/films/films.data.mjs), [M4 영상 장면](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/films/concept-M4/index.html), [배포 자막](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/public/assets/concepts/M4.vtt), [배포 영상 메타데이터](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/public/assets/concepts/manifest.json)이다.

## 저장·음성·기존 기록에 관한 결정

- 소스·검토 문서·작업 산출물은 외장 `T7 Shield`의 해당 프로젝트에 둔다. 수정 전 USB 연결, 외장 장치, 쓰기 가능, 약 1.1TB 여유 공간을 확인했다. 도구 실행은 기존 외장 임시·캐시 환경을 사용했다.
- 이번 담당 수정은 탐정 문구, 활동의 성공 설명, 학습 목표 문구다. 기존 24개 녹음 대사의 파일과 대본을 보존했고 공개 주소에서 24개 음성의 재생 종료를 확인했다. 개념 영상의 자막과 화면 글자는 동기화를 마쳤으며 공개 영상 7편의 재생 검사도 통과했다.
- 활동 ID, 과제 정답 구조, 완료·보상 판정, 저장 형식과 과거 기록을 유지한다. 문장틀은 타이핑이 어려운 학습자도 과학 내용을 담은 소개 자료를 만들 수 있도록 계속 제공한다.
- M5 정상 제출의 빈 문장 복원, `publishRecord`의 검증된 기록 게시, `cardContent`의 사례·작용·설명 산출을 확인했다. 글 길이보다 사례·작용·근거를 평가하는 기존 회귀 의도를 유지한다.
- 초기 예상이 달라도 실행과 비교하면 탐구를 완료할 수 있다. 재탐구 초안이 기존 유효 기록을 덮어쓰지 않도록 한 기존 경로를 유지한다.

관련 근거는 [제출과 문장틀 복원](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/scenes/inquiry.ts), [문장틀 생성](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/inquiry-preparation.ts), [검증 기록 게시](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/inquiry-records.ts), [카드 산출](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/src/export.ts), [기존 회귀 의도](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/tests/review-regression.test.ts)다.

## 판정 해석과 후속 확인

- 성취기준 연결과 과학 문구는 위 소스와 공식 자료를 대조해 판단했다. 개념 도움말·예상·관찰 비교·수정 피드백·소개 카드가 학습을 지원하는 구조는 확인했다.
- 흥미·재미·성취 향상에 대한 관찰 수치나 효과 크기는 확보되지 않았다. 만족도 점수나 성취 향상률은 기재하지 않는다.
- 실제 초등학생에게 과학 낱말의 이해, 같은 표본의 시간 비교, 분해와 음식 활용의 구별, 자료를 근거로 한 설명을 확인할 필요가 있다. 교사의 내용 승인과 실제 발표·공유 관찰을 후속 검증에 남긴다.
- 공개 주소에서 9개 화면 크기의 135개 페이지·180개 활동 화면을 검사해 레이아웃 실패와 브라우저 오류 0건을 확인했다. 7개 화면 크기의 탐정 사건 35개, 교육 도움말, 선택형 자동 관찰 7개와 학습자 수행 활동 13개도 통과했다. 이 결과의 적용 범위는 Mac Chrome의 화면·터치 에뮬레이션이다.
- 이후 실제 스크린샷 추가 검토에서 375px 크기 사다리를 다시 열 때 제목이 위로 밀리는 상태를 발견했다. 제목·닫기 버튼의 공간을 유지하고 목록 내부만 스크롤하도록 수정했다. 최종 공개 코드에서 처음 풀기와 재열기, 375×812·915×412·1024×768 검사를 통과했다.

## 공개 실행 증거

- 전체 흐름은 20개 활동과 M1 재탐구, 보상·유효 기록 보존, 새로고침 복원, 교사 시연 분리, 소개 카드 PNG 생성을 통과했다. [전체 흐름 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-full-flow.json)
- 교육 UI는 375×812·915×412·1024×768의 크기 사다리, 다섯 연구소의 낱말 도움, 자료 선택 안내, 개념 강조, 유리판 그림과 학습자 기록 분리를 통과했다. [교육 UI 로그](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-education-ux.log)
- 공개 화면은 135개 페이지, 180개 활동, 35개 탐정 검사의 실패·오류 목록이 모두 비어 있다. [페이지 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-browser.json), [활동 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-stage.json), [탐정 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-detective.json)
- 영상 7편과 음성 24개, 저장 원본·다른 탭 보호, 오프라인·지연 캐시 검사가 통과했다. [미디어 로그](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-media.log), [저장 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-storage.json), [추가 검사 종료 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/verification-summary.json)
- 커밋 재빌드와 공개 파일의 일치 결과를 실행 코드 버전과 함께 보관했다. [커밋 재빌드 대조](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/build-parity-final.json), [공개 파일 대조](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/production-files.json)

## 공식 기관 원문 근거

- 경기도교육청 공식 자료의 92쪽에서 `4과12-01~03`의 범위와 조사·발표·자료 제작 활동을 확인했다. [2022 개정 교육과정 관련 자료](https://www.goe.go.kr/resource/goe/na/bbs_2675/2025/11/b05e123f-8c12-4929-9914-319dea9b2099.pdf)
- 호주 국립식물원 자료에서 균사·균사체, 버섯을 이루는 균사, 포자를 만드는 구조를 확인했다. [What is a fungus?](https://anbg.gov.au/fungi/what-is-fungus.html)
- 농촌진흥청 국립식량과학원의 농식품올바로에서 발효 미생물의 작용과 유산균의 당 이용·젖산 생성을 확인했다. [발효미생물 데이터베이스 소개](https://www.nics.go.kr/food/kfi/fermicro/fermicroDbIntro)
- 미국 국립치과·두개안면연구소에서 세균이 당을 이용하며 만든 산과 치아 손상·충치의 관계를 확인했다. [The Tooth Decay Process](https://www.nidcr.nih.gov/health-info/tooth-decay/more-info/tooth-decay-process)
- 미국 환경보호청에서 퇴비 만들기의 미생물 분해와 재료·물·공기 조건을 확인했다. [Composting at Home](https://www.epa.gov/recycle/composting-home)
- 기존 요구르트 참고 링크의 FAO 부록 VII는 발효유 표준 개정 초안으로 표시되어 있다. 요구르트 관련 세균을 설명하는 보조 문헌 수준으로 취급하며 최신 채택 표준 여부는 별도 대조 대상이다. [FAO Appendix VII](https://www.fao.org/4/x4888e/x4888e0h.htm)
