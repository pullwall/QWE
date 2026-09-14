# QWE Healing Clicker

Q, W, E 키만 감지해 파스텔 키캡이 내려가고 부드러운 합성 스위치 사운드가 재생되는 작은 Tauri 데스크톱 앱입니다.

## 포함된 기능

- 앱이 다른 창 뒤에 있어도 Q/W/E keydown·keyup 감지
- 키 반복 입력 무시
- 마우스로 키캡 클릭 가능
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

## 웹 데모

`dist/`는 정적 웹사이트로도 배포할 수 있습니다. 웹에서는 보안 정책상 페이지가 활성화되어 있을 때만 Q/W/E를 감지하며, Always on top은 사용할 수 없습니다.

## 배포 전 권장 사항

다른 사람에게 널리 배포하려면 Windows 코드 서명 인증서로 MSI/NSIS 설치 파일에 서명하세요. 서명하지 않은 파일은 SmartScreen 경고가 나타날 수 있습니다. 사운드를 제품 수준으로 다듬을 때는 합성음 대신 직접 녹음했거나 상업적 사용 권리가 명확한 짧은 WAV press/release 샘플을 사용하세요.
