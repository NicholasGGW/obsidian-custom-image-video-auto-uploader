[简体中文](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.zh-CN.md) / [English](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/README.md) / [日本語](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.ja.md) / [한국어](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.ko.md) / [繁體中文](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.zh-TW.md)


문제가 있는 경우 새로운 [issue](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/issues/new)를 생성하거나, 텔레그램 그룹에 가입하여 도움을 받으세요: [https://t.me/obsidian_users](https://t.me/obsidian_users)



<h1 align="center">Obsidian Custom Image Auto Uploader</h1>

<p align="center">
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/releases"><img src="https://img.shields.io/github/release/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="release"></a>
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/LICENSE"><img src="https://img.shields.io/github/license/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="license"></a>
</p>

<p align="center">
  <strong>Obsidian 노트 이미지 원클릭 클라우드 동기화 및 처리 플러그인</strong>
  <br>
  <em>일괄 다운로드 / 업로드 / 자르기 / 압축 / 다양한 이미지 호스팅 지원</em>
</p>

<p align="center">
PC와 모바일 기기에서 노트의 이미지를 일괄 다운로드하거나, 원격 서버, 가정용 NAS, WebDAV 또는 클라우드 스토리지(Aliyun OSS, Amazon S3, Cloudflare R2, MinIO)에 일괄 업로드하여 저장할 수 있습니다. 또한 이미지 늘리기, 자르기 및 크기 조정이 가능합니다.
</p>

<div align="center">
    <img src="https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b" alt="preview" width="800" />
</div>

---

## ✨ 핵심 기능

* **⬇️ 일괄 다운로드**: 노트 내의 웹 이미지를 클릭 한 번으로 로컬에 다운로드합니다.
* **⬇️ 다중 노트 일괄 다운로드**: 전체 보관소의 모든 노트에서 이미지를 한 번에 다운로드할 수 있습니다.
* **☁️ 일괄 업로드**: 로컬 이미지를 원격 서비스로 업로드하며, 다양한 스토리지 백엔드를 지원합니다:
    * **자체 구축 서비스**: [Custom Image Gateway](https://github.com/haierkeys/custom-image-gateway)와 함께 사용하세요.
    * **클라우드 스토리지**: Aliyun OSS, Amazon S3, Cloudflare R2, MinIO 등.
    * **일반 프로토콜**: WebDAV, 원격 서버, 가정용 NAS.
* **☁️ 다중 노트 일괄 업로드**: 전체 보관소의 모든 노트에서 이미지를 한 번에 업로드할 수 있습니다.
* **✂️ 이미지 처리**: 노트 속성 또는 본문에서 이미지를 즉시 처리할 수 있습니다 (예: 블로그 커버 이미지):
    * 비율 유지 좌상단 채우기 (Cover)
    * 비율 유지 중앙 채우기 (Contain)
    * 고정 크기 늘리기 (Stretch)
    * 비율 유지 맞춤 (Fit)
* **📱 모든 플랫폼 지원**: Windows, MacOS, Linux, Android, iOS.
* **🖱️ 편리한 조작**: 드래그 앤 드롭, 붙여넣기 자동 업로드를 지원합니다.
* **🌍 다국어 지원**: 다국어 팩이 내장되어 있습니다.
* **🗑️ 연결되지 않은 이미지 정리**: 보관소에서 어떤 노트와도 연결되지 않은 로컬 이미지를 한 번에 정리할 수 있습니다.

## 🗺️ 로드맵

지속적으로 개선 중이며, 향후 개발 계획은 다음과 같습니다:

- [x] **연결되지 않은 이미지 정리**: 보관소에서 어떤 노트와도 연결되지 않은 로컬 이미지를 한 번에 정리할 수 있습니다.

> **개선 제안이나 새로운 아이디어가 있다면 issue를 통해 공유해 주세요. 적절한 제안을 신중하게 검토하여 반영하겠습니다.**

## 🚀 빠른 시작

1.  **플러그인 설치**
    Obsidian 커뮤니티 플러그인 시장에서 **Custom Image Auto Uploader**를 검색하여 설치합니다.

2.  **게이트웨이 설정 (선택 사항)**
    자체 구축 이미지 호스트를 사용하는 경우, **업로드 설정** > **API 게이트웨이 주소**를 사용자의 **Custom Image Gateway** 주소로 설정하세요.
    > 예: `http://127.0.0.1:9000/api/upload`

3.  **인증 설정**
    보안을 위해 **API 액세스 토큰** (Token)을 설정하세요.

4.  **서비스 시작**
    원격 **Custom Image Gateway** 서비스가 실행 중이고 액세스 가능한지 확인하세요.

5.  **확인**
    새 노트를 만들고 이미지를 복사해 넣어 업로드가 성공하는지 확인합니다.

## ⚙️ 백엔드 서비스 (API 게이트웨이)

이 플러그인의 고급 기능을 사용하려면 **Custom Image Gateway**가 필요합니다.

> **Custom Image Gateway**는 무료 오픈 소스 이미지 업로드 게이트웨이 도구입니다.

*   **프로젝트 주소**: [haierkeys/custom-image-gateway](https://github.com/haierkeys/custom-image-gateway)
*   **배포 문서**: 프로젝트 홈페이지를 참조하여 배포하세요.

## 📁 WebDAV 직접 업로드 모드

API 게이트웨이 외에도, 플러그인은 게이트웨이 서버 없이 **WebDAV**를 통해 모든 이미지와 동영상을 직접 업로드하는 것을 지원합니다. 홈 NAS(예: OpenList/AList 실행)를 보유한 사용자에게 이상적입니다.

### 플러그인 설정

플러그인 설정에서 **전역 업로드 모드**를 **WebDAV 직접**으로 설정하고 다음 필드를 입력하세요:

| 설정 | 예시 | 비고 |
|------|------|------|
| **WebDAV 주소** | `http://127.0.0.1:52444/dav` | 끝에 슬래시 불필요 |
| **사용자 정의 저장 경로** | `Obsidian_Attachments/{YYYYMM}` | `{YYYYMM}`은 현재 연월(예: `202605`)로 자동 교체됩니다. 비워 두면 루트 디렉토리에 업로드됩니다. |
| **WebDAV 사용자 이름** | `your_username` | |
| **WebDAV 비밀번호** | `your_password` | |
| **공개 URL 접두사** | `http://your-nas.tailXXXX.ts.net/d` | 끝에 슬래시 불필요. 비워 두면 `/dav`가 자동으로 `/d`로 교체됩니다(OpenList/AList용). |

**예시 결과**: 위 설정으로 `image.jpg` 파일은 다음과 같이 됩니다:
- 업로드 위치: `http://127.0.0.1:52444/dav/Obsidian_Attachments/202605/image.jpg`
- 노트에 삽입: `http://your-nas.tailXXXX.ts.net/d/Obsidian_Attachments/202605/image.jpg`

### OpenList / AList 설정

[OpenList](https://github.com/OpenListTeam/OpenList) 또는 [AList](https://github.com/AlistGo/alist)를 WebDAV 서버로 사용하는 경우:

1. OpenList/AList 설정에서 WebDAV를 활성화합니다.
2. Obsidian 첨부 파일 전용 폴더(예: `Obsidian_Attachments`)를 생성합니다.
3. **공개 읽기 전용 접근**: OpenList/AList에서 특정 폴더 경로에 대한 게스트 사용자 접근을 활성화하여 로그인 없이 공개 직접 링크(`/d/` 경유)에 접근할 수 있도록 합니다.

> ⚠️ **중요**: 게스트 접근은 Obsidian 첨부 파일 폴더에만 활성화하고, 전체 스토리지 루트에는 절대 설정하지 마세요.

### Tailscale을 이용한 안전한 원격 접근 (권장)

[Tailscale](https://tailscale.com/)을 사용하면 홈 NAS를 공인 인터넷에 노출하지 않고도 어디서나 안전하게 접근할 수 있습니다:

1. NAS와 모든 기기에 Tailscale을 설치합니다.
2. NAS는 `your-nas.tailXXXX.ts.net`과 같은 프라이빗 호스트 이름을 갖게 됩니다.
3. **공개 URL 접두사** 필드에 입력: `http://your-nas.tailXXXX.ts.net/d`
4. Tailscale 네트워크에 연결된 기기만 URL에 접근할 수 있습니다 — 완전히 비공개이며 안전합니다.

> ⚠️ **보안 참고**: Tailscale 없이 NAS를 공인 인터넷에 노출하려면 다음을 확인하세요:
> - 강력한 WebDAV 자격 증명 사용
> - 특정 읽기 전용 폴더에만 게스트 접근 허용, 쓰기 접근은 절대 허용 금지
> - NAS에서 HTTPS 활성화

## ☕ 후원 및 지원

이 플러그인이 유용하고 지속적인 개발을 지원하고 싶다면 커피 한 잔을 후원해 주세요:

[<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)
