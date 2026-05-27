[简体中文](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.zh-CN.md) / [English](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/README.md) / [日本語](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.ja.md) / [한국어](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.ko.md) / [繁體中文](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.zh-TW.md)


有问题请新建 [issue](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/issues/new) , 或加入电报交流群寻求帮助: [https://t.me/obsidian_users](https://t.me/obsidian_users)



<h1 align="center">Obsidian Custom Image Auto Uploader</h1>

<p align="center">
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/releases"><img src="https://img.shields.io/github/release/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="release"></a>
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/LICENSE"><img src="https://img.shields.io/github/license/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="license"></a>
</p>

<p align="center">
  <strong>Obsidian 笔记图片一键云端同步与处理插件</strong>
  <br>
  <em>支持 批量下载 / 上传 / 裁剪 / 压缩 / 多图床支持</em>
</p>

<p align="center">
您可以在 电脑和手机 端上将笔记中的图片批量下载, 批量上传保存到远端服务器、家庭 NAS、WebDAV 或者云存储上（阿里云 OSS 、亚马逊 S3 、Cloudflare R2 、MinIO ），并且您还可以对图片进行拉伸裁剪以及修改尺寸。
</p>

<div align="center">
    <img src="https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b" alt="preview" width="800" />
</div>

---

## ✨ 核心功能

* **⬇️ 批量下载**：一键将笔记内的网络图片下载至本地。
* **⬇️ 多笔记批量下载**：可以一键下载整个笔记仓库所有笔记中的图片。
* **☁️ 批量上传**：将本地图片上传至远端服务，支持多种存储后端：
    * **自建服务**：配合 [Custom Image Gateway](https://github.com/haierkeys/custom-image-gateway) 使用。
    * **云存储**：阿里云 OSS, Amazon S3, Cloudflare R2, MinIO 等。
    * **通用协议**：WebDAV, 远端服务器, 家庭 NAS。
* **☁️ 多笔记批量上传**：可以一键上传整个笔记仓库所有笔记中的图片。
* **✂️ 图片处理**：支持在笔记属性或正文中即时处理图片（如博客封面图）：
    * 等比左上填充 (Cover)
    * 等比居中填充 (Contain)
    * 固定尺寸拉伸 (Stretch)
    * 等比适应 (Fit)
* **📱 全平台支持**：Windows, MacOS, Linux, Android, iOS。
* **🖱️ 便捷操作**：支持拖拽, 粘贴自动上传。
* **🌍 多语言支持**：内置多国语言包。
* **🗑️ 清理未连接图片**：可以一键清理笔记仓库中未和笔记连接的本地图片。

## 🗺️ 路线图 (Roadmap)

我们正在持续改进，以下是未来的开发计划：

- [x] **清理未连接图片**：可以一键清理笔记仓库中未和笔记连接的本地图片。

> **如果您有改进建议或新想法，欢迎通过提交 issue 与我们分享——我们会认真评估并采纳合适的建议。**

## 🚀 快速开始

1.  **安装插件**
    打开 Obsidian 社区插件市场，搜索 **Custom Image Auto Uploader** 并安装。

2.  **配置网关 (可选)**
    若使用自建图床，请将 **上传设置** > **API 网关地址** 设置为您的 **Custom Image Gateway** 地址。
    > 例如: `http://127.0.0.1:9000/api/upload`

3.  **配置鉴权**
    设置 **API 访问令牌** (Token) 以确保安全。

4.  **启动服务**
    确保远端 **Custom Image Gateway** 服务已启动并可访问。

5.  **验证**
    创建一个新笔记，复制图片进去，检查是否上传成功。

## ⚙️ 后端服务 (API 网关)

本插件的高级功能需要配合 **Custom Image Gateway** 使用。

> **Custom Image Gateway** 是一个免费开源的图片上传网关工具。

*   **项目地址**: [haierkeys/custom-image-gateway](https://github.com/haierkeys/custom-image-gateway)
*   **部署文档**: 请参考项目主页进行部署。

## 📁 WebDAV 直传模式

除 API 网关外，插件支持通过 **WebDAV** 直接上传所有图片和视频——无需网关服务器。适合拥有家庭 NAS（例如运行 OpenList/AList）、希望完全自主管理存储的用户。

### 插件设置

在插件设置中，将 **全局上传模式** 设置为 **WebDAV 直传**，然后填写以下字段：

| 设置项 | 示例 | 说明 |
|--------|------|------|
| **WebDAV 地址** | `http://127.0.0.1:52444/dav` | 不需要末尾加 / |
| **自定义保存路径** | `Obsidian_Attachments/{YYYYMM}` | `{YYYYMM}` 会自动替换为当前年月（如 `202605`）。留空则上传到根目录。 |
| **WebDAV 用户名** | `your_username` | |
| **WebDAV 密码** | `your_password` | |
| **公共访问地址前缀** | `http://your-nas.tailXXXX.ts.net/d` | 不需要末尾加 /。留空则自动将 `/dav` 替换为 `/d`（适用于 OpenList/AList）。 |

**示例结果**：使用以上设置，文件 `image.jpg` 将会：
- 上传到：`http://127.0.0.1:52444/dav/Obsidian_Attachments/202605/image.jpg`
- 在笔记中插入为：`http://your-nas.tailXXXX.ts.net/d/Obsidian_Attachments/202605/image.jpg`

### 配置 OpenList / AList

如果您使用 [OpenList](https://github.com/OpenListTeam/OpenList) 或 [AList](https://github.com/AlistGo/alist) 作为 WebDAV 服务器：

1. 在 OpenList/AList 设置中启用 WebDAV。
2. 创建一个专用的 Obsidian 附件文件夹（例如 `Obsidian_Attachments`）。
3. **公共只读访问**：在 OpenList/AList 中，为该文件夹路径开启访客用户访问权限，使公共直链（通过 `/d/`）无需登录即可访问。

> ⚠️ **注意**：仅对 Obsidian 附件文件夹开放访客权限，切勿对整个存储根目录开放。

### 使用 Tailscale 安全远程访问（推荐）

使用 [Tailscale](https://tailscale.com/) 可在任何地方（手机、远程办公等）安全访问家庭 NAS，无需将 NAS 暴露到公共互联网：

1. 在 NAS 和所有设备上安装 Tailscale。
2. NAS 将获得一个私有主机名，例如 `your-nas.tailXXXX.ts.net`。
3. 在 **公共访问地址前缀** 中填写：`http://your-nas.tailXXXX.ts.net/d`
4. 只有加入您 Tailscale 网络的设备才能访问链接——完全私密、安全。

> ⚠️ **安全提示**：如果选择将 NAS 暴露到公共互联网（不使用 Tailscale），请确保：
> - 使用强 WebDAV 密码
> - 仅对特定只读文件夹开放访客权限，禁止写入访问
> - 为 NAS 启用 HTTPS

## ☕ 赞助与支持

如果觉得这个插件很有用，并且想要支持它的继续开发，欢迎请我喝杯咖啡：

[<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)
