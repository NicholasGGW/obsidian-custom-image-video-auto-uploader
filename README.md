[简体中文](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.zh-CN.md) / [English](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/README.md) / [日本語](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.ja.md) / [한국어](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.ko.md) / [繁體中文](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.zh-TW.md)


If you have any questions, please create an [issue](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/issues/new), or join the Telegram group for help: [https://t.me/obsidian_users](https://t.me/obsidian_users)



<h1 align="center">Obsidian Custom Image Auto Uploader</h1>

<p align="center">
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/releases"><img src="https://img.shields.io/github/release/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="release"></a>
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/LICENSE"><img src="https://img.shields.io/github/license/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="license"></a>
</p>

<p align="center">
  <strong>One-click Cloud Sync and Processing Plugin for Obsidian Note Images</strong>
  <br>
  <em>Supports Batch Download / Upload / Crop / Compress / Multiple Image Hosting Support</em>
</p>

<p align="center">
You can batch download images from notes on PC and mobile devices, batch upload and save them to remote servers, home NAS, WebDAV, or cloud storage (Aliyun OSS, Amazon S3, Cloudflare R2, MinIO), and you can also stretch, crop, and resize images.
</p>

<div align="center">
    <img src="https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b" alt="preview" width="800" />
</div>

---

## ✨ Core Features

* **⬇️ Batch Download**: One-click download of web images within notes to local storage.
* **⬇️ Multi-note Batch Download**: Download images from all notes in the entire vault with one click.
* **☁️ Batch Upload**: Upload local images to remote services, supporting various storage backends:
    * **Self-hosted Service**: Use in conjunction with [Custom Image Gateway](https://github.com/haierkeys/custom-image-gateway).
    * **Cloud Storage**: Aliyun OSS, Amazon S3, Cloudflare R2, MinIO, etc.
    * **General Protocols**: WebDAV, Remote Server, Home NAS.
* **☁️ Multi-note Batch Upload**: Upload images from all notes in the entire vault with one click.
* **✂️ Image Processing**: Supports instant image processing in note properties or body (e.g., blog cover images):
    * Proportional Top-Left Fill (Cover)
    * Proportional Center Fill (Contain)
    * Fixed Dimension Stretch (Stretch)
    * Proportional Fit (Fit)
* **📱 Full Platform Support**: Windows, MacOS, Linux, Android, iOS.
* **🖱️ Convenient Operation**: Supports drag-and-drop and paste for automatic upload.
* **🌍 Multi-language Support**: Built-in multi-language packs.
* **🗑️ Clean Unconnected Images**: One-click cleanup of local images in the vault that are not linked to any notes.

## 🗺️ Roadmap

We are continuously improving; here are the future development plans:

- [x] **Clean Unconnected Images**: One-click cleanup of local images in the vault that are not linked to any notes.

> **If you have suggestions for improvement or new ideas, feel free to share them with us by submitting an issue—we will carefully evaluate and adopt suitable suggestions.**

## 🚀 Quick Start

1.  **Install Plugin**
    Open the Obsidian community plugin market, search for **Custom Image Auto Uploader**, and install.

2.  **Configure Gateway (Optional)**
    If using a self-hosted image host, please set **Upload Settings** > **API Gateway Address** to your **Custom Image Gateway** address.
    > Example: `http://127.0.0.1:9000/api/upload`

3.  **Configure Authentication**
    Set the **API Access Token** (Token) to ensure security.

4.  **Start Service**
    Ensure the remote **Custom Image Gateway** service is started and accessible.

5.  **Verification**
    Create a new note, copy an image into it, and check if the upload is successful.

## ⚙️ Backend Service (API Gateway)

The advanced features of this plugin require the use of **Custom Image Gateway**.

> **Custom Image Gateway** is a free and open-source image upload gateway tool.

*   **Project Address**: [haierkeys/custom-image-gateway](https://github.com/haierkeys/custom-image-gateway)
*   **Deployment Documentation**: Please refer to the project homepage for deployment.

## 📁 WebDAV Direct Upload Mode

In addition to the API Gateway, the plugin supports uploading all images and videos directly via **WebDAV** — no gateway server needed. This is ideal for home NAS users (e.g., running OpenList/AList) who want full control over their own storage.

### Plugin Settings

In the plugin settings, set **Global Upload Mode** to **WebDAV Direct**, then fill in the following fields:

| Setting | Example | Notes |
|---------|---------|-------|
| **WebDAV Address** | `http://127.0.0.1:52444/dav` | No trailing slash needed |
| **Custom Save Path** | `Obsidian_Attachments/{YYYYMM}` | `{YYYYMM}` is replaced with the current year+month (e.g. `202605`). Leave empty to upload to the root directory. |
| **WebDAV Username** | `your_username` | |
| **WebDAV Password** | `your_password` | |
| **Public URL Prefix** | `http://your-nas.tailXXXX.ts.net/d` | No trailing slash. Leave empty to auto-replace `/dav` with `/d` (for OpenList/AList). |

**Example result**: With the settings above, a file `image.jpg` will be:
- Uploaded to: `http://127.0.0.1:52444/dav/Obsidian_Attachments/202605/image.jpg`
- Inserted into notes as: `http://your-nas.tailXXXX.ts.net/d/Obsidian_Attachments/202605/image.jpg`

### Setting Up OpenList / AList

If you use [OpenList](https://github.com/OpenListTeam/OpenList) or [AList](https://github.com/AlistGo/alist) as your WebDAV server:

1. Enable WebDAV in OpenList/AList settings.
2. Create a dedicated folder for Obsidian attachments (e.g., `Obsidian_Attachments`).
3. **For public read-only access**: In OpenList/AList, enable guest user access on the specific folder path so that public direct-link URLs (via `/d/`) work without login.

> ⚠️ **Important**: Only enable guest access for the Obsidian attachments folder, not your entire storage root.

### Secure Remote Access with Tailscale (Recommended)

To access your home NAS securely from anywhere (mobile, remote, etc.) without exposing it to the public internet:

1. Install [Tailscale](https://tailscale.com/) on both your NAS and all your devices.
2. Your NAS will get a private hostname like `your-nas.tailXXXX.ts.net`.
3. Use this hostname in the **Public URL Prefix** field: `http://your-nas.tailXXXX.ts.net/d`
4. Only devices in your Tailscale network can access the URLs — completely private and secure.

> ⚠️ **Security Note**: If you choose to expose your NAS to the public internet (without Tailscale), ensure you:
> - Use strong WebDAV credentials
> - Grant guest access only to specific read-only folders, never write access
> - Enable HTTPS on your NAS

## ☕ Sponsorship & Support

If you find this plugin very useful and want to support its continued development, feel free to buy me a coffee:

[<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)
