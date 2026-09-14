# QWE Healing Clicker

Q, W, E 키만 감지해 파스텔 키캡이 내려가고 부드러운 합성 스위치 사운드가 재생되는 작은 Tauri 데스크톱 앱입니다.

## 포함된 기능

- Three.js/WebGL 기반 키캡과 굴절·투명 스위치 하우징
- 앱 포커스 여부와 무관한 Q/W/E keydown·keyup 감지
- 키 반복 입력 무시
- 마우스로 키캡 클릭 가능
- 투명한 프레임리스 창과 빈 영역 드래그 이동
- Compact → hover 설정 버튼 → Expanded 설정 패널
- Soft / Creamy / Clicky / Thock 사운드
- 볼륨, 4가지 색상 테마, Always on top
- 설정은 로컬 브라우저 저장소에만 보관
- 네트워크 전송 및 키 입력 기록 없음

## 개발 실행

Windows에서 Node.js 20+, Rust stable, Microsoft C++ Build Tools, WebView2가 필요합니다.

```powershell
npm install
npm run icon
npm run dev
```

## Windows 설치 파일 만들기

```powershell
npm run build
```

완성된 설치 파일은 보통 아래에 생성됩니다.

```text
src-tauri/target/release/bundle/msi/
src-tauri/target/release/bundle/nsis/
```

## GitHub Releases에 자동 배포

프로젝트를 GitHub 저장소에 올린 뒤 버전 태그를 푸시하면 GitHub Actions가 Windows에서 자동으로 빌드하고 Releases에 `.exe`와 `.msi`를 게시합니다.

먼저 `package.json`과 `src-tauri/tauri.conf.json`의 `version`을 배포할 버전으로 맞춥니다. 이번 변경은 둘 다 `0.2.0`입니다:

```bash
git tag v0.2.0
git push origin v0.2.0
```

Actions 탭의 `Release Windows installer` 작업이 끝나면 저장소의 Releases 페이지에서 설치 파일을 받을 수 있습니다. 일반 사용자는 이름에 `setup.exe`가 붙은 파일만 내려받아 실행하면 됩니다.

태그, `package.json`, `tauri.conf.json`의 버전이 서로 다르면 잘못된 설치 파일이 배포되지 않도록 작업이 실패하게 설정되어 있습니다.

## 웹 데모

`dist/`는 정적 웹사이트로도 배포할 수 있습니다. 웹에서는 보안 정책상 페이지가 활성화되어 있을 때만 Q/W/E를 감지하며, Always on top은 사용할 수 없습니다.

## 배포 전 권장 사항

다른 사람에게 널리 배포하려면 Windows 코드 서명 인증서로 MSI/NSIS 설치 파일에 서명하세요. 서명하지 않은 파일은 SmartScreen 경고가 나타날 수 있습니다. 사운드를 제품 수준으로 다듬을 때는 합성음 대신 직접 녹음했거나 상업적 사용 권리가 명확한 짧은 WAV press/release 샘플을 사용하세요.
