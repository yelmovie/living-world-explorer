# 생명 코드 연구소 최종 납품 검토

## 조건부 배포 가능

성취기준·과학 문구·조작 안내·반응형·저장·배포 파일의 연결을 검토했다. 실행 코드 `35486ba`의 공개 주소 검증 결과와 파일 대조를 아래에 정리했다. 추가 스크린샷에서 발견한 375px 크기 사다리 재열기 표시도 수정하고 재검증했다. 실제 교사의 내용 승인, 학교 태블릿 실기 검사, 기존 생성 자료의 최종 이용 조건 확인은 남아 있다.

## 작업 기록과 실제 파일 대조

이전 `UPGRADE-RESULT-20261109`, `RESUME-20261110`, `RELEASE-REVIEW-20261110-NIGHT`, `GAMEPLAY-20261111`과 현재 코드·Git 이력을 대조했다.

| 기록된 변경 | 대조 결과 |
|---|---|
| 터치 크기·한글 대비·학습목표 | `78e31e4`, `ae71fc8`이 현재 이력에 포함됨 |
| 개념 영상·운영본 병합·과학 문구 | `fa9ddd2`, `1a69193`, `5dc432c` 포함. 영상 장면 선택과 자막 단일 원본 확인 |
| 효과음 조정·그림 악당·영상 압축 | `a434897`, `90b2f2f` 포함. 인트로 3,739,359바이트, 엔딩 4,156,440바이트 |
| 사건 5개·소개 음성 수정 | `44f0c2c`, `35d0ddc` 포함. 24개 음성의 등록 대사·실제 MP3·생성 기록 해시 일치 |
| 출처 파일 동봉 | 빌드에 `assets/CREDITS.md`를 실제로 출력하도록 복구 |
| 영상 제작용 글꼴 | UI에서 사용하지 않는 Jua를 `films/fonts/`에 보존하고 생성기의 경로를 연결. 외장 임시 사본에서 다섯 편의 영상 소스 재생성 통과 |

기록의 핵심 커밋 9개는 모두 현재 코드의 조상이다. 이번에 발견한 안내·상태·표시 문제는 아래에 구분해 기록했다.

## 적용한 교육·화면 개선

- 15개 경로와 20개 탐구를 `4과12-01~03`에 연결했다. M1~M3의 관찰·특징·사는 곳, M4의 생활 영향, M5의 활용 자료 제작이 기록과 보고서로 이어진다. 자세한 대응표와 공식 근거는 교육 검토 문서에 정리했다. [교육 검토](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/EDUCATION-20261112.md)
- 버섯 균사에 관한 설명 자료와 곰팡이의 직접 관찰을 구별했다. 발효 설명을 요구르트 사례로 한정하고, M4 목표에 원생생물의 먹이 관계를 포함했다.
- M4 개념 영상의 특정 일수 표현을 바꾸고 MP4·화면 글자·앱 자막·VTT·manifest·생성 템플릿을 맞췄다. 다른 네 편의 영상·포스터·VTT 12파일은 해시가 같다.
- 과학 낱말 14개에 쉬운 설명을 연결했다. 자료와 발견 기록에서 개념을 강조하고, 도움말·완료 기록의 낱말을 누르면 뜻을 볼 수 있다.
- 자료를 선택하면 ‘다음에 누를 칸’ 안내가 함께 보인다. 주장·작용을 다시 고르는 상태, 관찰 기록 재방문, 네 번째 발견 뒤 사건 설명까지 실제 버튼명으로 안내한다.
- 탐정 단서 선택 뒤 키보드 초점이 유지된다. 다음 단서와 두 분류 칸을 구분해 표시한다. 완료한 사건의 배치를 바꾸면 설명을 다시 확인해야 한다.
- 자동 관찰 중 기록 버튼이 다시 켜지는 문제와 곰팡이·해캄에 버섯 주름 설명이 나오던 문제를 수정했다. 직접 판단하는 활동과 제출은 학습자가 수행한다.
- 지도 조작 버튼과 힌트의 겹침, 짧은 가로 화면의 연결 보드·코어 마지막 포트 잘림, 휴대폰 사건 버튼 숨김, 현재 활동 번호 대비와 현미경 설명 잘림을 수정했다.
- 머리카락·균사 한 가닥과 평평한 받침 유리판을 새로 생성했다. 크기 사다리에 길이·너비·굵기를 명시하고, 표본 전체와 측정 부분을 구별했다. 그림 3개의 WebP 합계는 39,212바이트다. [원본·프롬프트·해시](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/assets/generated/20261112/provenance.json)
- 안내 반복 동작을 2~3회로 제한하고 시작 버튼의 그림자 반복을 transform으로 바꿨다. 미디어 캐시 저장 공간이 부족해도 온라인 재생 응답을 반환하도록 처리했다.

## 완성도 목표에 적용한 순서

1. 성취기준과 페이지별 산출물을 대응시켰다.
2. 관찰·조사·추측을 구별하고 과학 문구의 범위를 조정했다.
3. 과학 낱말의 강조와 뜻 보기를 연결했다.
4. 실제 버튼명과 선택 상태에 맞춰 다음 행동을 안내했다.
5. 정답 위치를 미리 알려주는 안내를 관찰·판단 안내로 바꿨다.
6. 단서 선택·배치·설명·재수정의 상태를 일관되게 만들었다.
7. 관찰 자동재생과 학습자의 판단·제출을 분리했다.
8. 길이·굵기와 유리판의 형태를 설명하는 그림을 보강했다.
9. 태블릿·짧은 가로·휴대폰 화면과 키보드 접근을 검사했다.
10. 저장 원본·다른 탭·교사 시연 분리를 검사했다.
11. 커밋에서 다시 빌드하고 공개 파일 해시를 비교했다.
12. 운영 주소에서 활동·영상·음성·보고서·코어·내보내기를 실행했다.

## 검사 기준과 한계

`edu-design`, `yelsam-design`, `game-final-check`, `edu-final-check`와 프로젝트 디자인·상호작용 문서를 적용했다. Impeccable 실행 엔진은 제공되지 않아 프로젝트 코드·실제 화면·브라우저 측정으로 검토했다. 새 그림은 기본 생성기의 내장 저장 경로를 피하기 위해 Higgsfield 연결 도구에서 생성하고 외장 SSD로 직접 받았다.

브라우저 검사는 Mac Chrome 헤드리스의 화면·터치 에뮬레이션이다. Three.js 검사는 SwiftShader를 포함한다. 실제 iPad Safari의 가장자리 제스처, 학교 저사양 태블릿의 FPS·메모리, 40분 학급 수업, 모바일 실물 공유·인쇄, 스피커 청취는 확인하지 못했다. `contentReview.needsReview=true`를 유지했다. 학생의 흥미·이해·성취 향상률은 측정하지 않았다.

일부 옛 보조 검사에는 현재 UI와 맞지 않는 선택자가 남아 있다. 실행한 검사의 결과는 최종 증거 표에 한정한다. 원래 미추적 생성 자료와 출력 폴더는 보존했다.

## 최종 실행·배포 증거

운영 검증 대상은 실행 코드 `35486baf8c86acbc426b981aa6728c877612cb74`, Cloudflare Pages 배포 `71a00e0b`다. 배포 완료 시각은 2026-11-12 01시 15분 46초 KST다. 아래 결과는 해당 공개 실행본에 대한 기록이다. [운영 주소](https://living-world-explorer.pages.dev)

| 검사 | 확인 결과 | 증거 |
|---|---|---|
| 커밋 재빌드 대조 | 작업 빌드 175개와 커밋 빌드 175개 파일 일치, 불일치 0개 | [빌드 대조](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/build-parity-final.json) |
| 공개 파일 대조 | 서버 설정 파일 `_headers`를 제외한 공개 174개가 HTTP 200이며 커밋 빌드와 해시 일치 | [공개 파일 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/production-files.json) |
| 교육 UI | 3개 화면 크기의 크기 사다리와 375px 처음 풀기·재열기, 다섯 연구소 낱말 도움, 자료 안내·개념 강조·유리판·학습자 기록 분리 통과 | [교육 UI 로그](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-education-ux.log) |
| 전체 학습 흐름 | 20개 활동, M1 재탐구, 보상·유효 기록 보존, 새로고침 복원, 교사 시연 분리, PNG 내보내기 통과 | [전체 흐름 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-full-flow.json) |
| 선택형 자동 관찰 | 자동 관찰 7개, 학습자 수행 활동 13개, 조작 인계와 교사 재로딩 분리 통과 | [자동 관찰 로그](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-observation-playback.log) |
| 페이지 반응형 | 15개 경로 × 9개 화면 크기, 총 135개 화면 통과. 레이아웃 실패·오류·실패 요청 0건 | [페이지 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-browser.json) |
| 활동 반응형 | 20개 활동 × 9개 화면 크기, 총 180개 화면 통과. 실패·오류 0건 | [활동 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-stage.json) |
| 탐정 사건 | 5개 연구소 × 7개 화면 크기, 총 35개 검사 통과. 오류 0건 | [탐정 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-detective.json) |
| 코어 표시·조작 | 이미지 기반 코어와 Three.js 코어의 6개 화면 크기, 터치·키보드·개별 점등·중복 방지·재방문·가동·대체 표시 통과 | [이미지 코어 로그](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-core-figure.log), [Three.js 최종 검사 로그](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-core-webgl.log) |
| 영상·음성 | 개념 영상 5편과 인트로·엔딩 재생, 개념 장면 이동·자막, 음성 24개 재생 종료 통과 | [미디어 로그](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-media.log) |
| 저장 보호 | null·미래 버전·잘못된 원본 보존, 오래된 두 번째 탭의 원자적 저장 차단 통과 | [저장 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/release-storage.json) |
| 추가 검사 | 공개 지도 그림·이야기 음성 통과. 공개 사이트의 오프라인 전환·Range 재생 통과. 로컬 지연 캐시·저장 용량 초과 회귀 검사 통과 | [추가 검사 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/verification-summary.json) |

첫 Three.js 코어 검사는 촬영 중 5초 자동 결과 이동이 끝난 뒤 건너뛰기 버튼을 찾아 시간 초과했다. 같은 실행 코드의 무수정 재시도는 통과했다. 자동 이동이 완료된 상태를 허용하고 재방문 직후 직접 건너뛰기도 검증하도록 검사를 보강했다. 최종 공개 실행본의 보강 검사도 통과했다. 첫 실행 종료 코드 1과 재시도 PASS를 함께 보관한다. [첫 실행 종료 결과](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/initial-flow-exits.txt), [첫 코어 로그](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/final-public-core-webgl.log), [재검증 로그](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/final-public-core-webgl-retry.log)

위 자동 화면 검사 뒤 추가 스크린샷에서 375px 크기 사다리 재열기 시 제목이 위로 밀리는 상태를 확인했다. 제목·닫기 버튼의 공간을 유지하고 목록 내부만 스크롤하도록 수정했다. 최종 공개 코드의 처음 풀기·재열기 검사가 통과했으며 실제 화면에서도 제목과 설명·닫기 버튼을 확인했다.

단위 검사 17개 파일·165개 사례와 타입 검사·배포 빌드가 통과했다. 최초 로컬 로딩 편차와 코어 검사 시간 초과는 원문 증거에 남겼다. [단위 검사](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/ladder-unit.log), [빌드](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/ladder-build.log), [점수와 로딩 기준](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/SCORE-20261112.md)

## 최종 화면 증거

새 그림과 과학 낱말 도움말을 실제 공개 페이지에서 확인했다. 크기 사다리는 완료 상태 재열기에서 제목·설명·닫기 버튼을 유지한다. [태블릿 크기 사다리](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/ladder-1024.png), [휴대폰 크기 사다리](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/ladder-375.png), [짧은 가로 화면](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/ladder-915.png), [과학 낱말 도움말](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/science-word.png), [받침 유리판](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/flat-slide.png)

운영 배포의 원본 식별자와 통합 결과를 보관했다. [배포 상태](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/deployment.json), [검증 요약](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/verification-summary.json), [작업 기록·커밋·음성 대조](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/worklog-parity.json), [영상 소스 재생성](/Volumes/T7%20Shield/iscreammedia_sc34/8%20creatures/docs/reviews/evidence/20261112/film-source-rebuild.log)
