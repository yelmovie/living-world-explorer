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

오프라인 새로고침, 실제 학교 태블릿·동시 접속 환경 및 교과 검수의 남은 범위는 `reviews/FINAL-CHECK-20261024.md`를 참고한다.
