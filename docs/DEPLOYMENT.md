# Cloudflare 배포

- 서비스: 생명 코드 연구소
- 프로젝트: `living-world-explorer`
- 기본 주소: https://living-world-explorer.pages.dev/
- 소스: https://github.com/yelmovie/living-world-explorer
- 운영 브랜치: `main`
- 빌드: `npm run build`, 출력 폴더 `dist/`
- 방식: 인증된 Wrangler CLI로 Cloudflare Pages에 정적 파일 직접 업로드

```powershell
$env:TEMP = 'D:\DevTemp'
$env:TMP = 'D:\DevTemp'
npm run build
wrangler pages deploy dist --project-name living-world-explorer --branch main
```

GitHub 푸시만으로 자동 배포되지는 않는다. 직접 업로드할 때 해당 Git 커밋을 배포 메타데이터에 연결하고, 배포 뒤 HTML·실행 번들·그림·영상의 실제 응답을 로컬 빌드와 대조한다.

학습 기록은 현재 기기·브라우저·접속 주소의 IndexedDB에 저장된다. localhost에서 저장한 기록은 운영 주소로 자동 이동하지 않는다. 서버로 학습 기록을 전송하지 않는다.

## 오프라인 (2026-10-25)

- 운영 빌드만 `sw.js`를 등록한다. 처음 온라인으로 연 뒤 게임 파일 83개(약 7.4MB)를 기기에 저장해, 와이파이가 끊겨도 새로고침하고 끝까지 진행할 수 있다. 개발 서버(`npm run dev`)에서는 등록하지 않는다.
- 저장 목록과 버전은 빌드 때 `vite.config.ts`의 `offlinePrecache()`가 `dist/sw.js`에 넣는다. 새로 배포하면 바뀐 파일만 다시 받는다. 학습 기록(IndexedDB)은 건드리지 않는다.
- 배경 음악 2곡은 처음 재생할 때 저장한다. 온라인에서 한 번 재생해야 오프라인에서도 나온다.
- `public/_headers`가 `sw.js`·`manifest.webmanifest`를 `no-cache`로 내보낸다(Cloudflare Pages가 적용, 파일 자체는 공개하지 않음).
- 확인: `npm run test:offline` — 빌드 후 미리보기 서버를 끄고 오프라인 새로고침으로 첫 화면·지도·탐구 그림을 확인한다.

실제 학교 태블릿·동시 접속 환경 및 교과 검수의 남은 범위는 `reviews/FINAL-CHECK-20261025.md`를 참고한다.
