[简体中文](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.zh-CN.md) / [English](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/README.md) / [日本語](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.ja.md) / [한국어](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.ko.md) / [繁體中文](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/docs/README.zh-TW.md)


ご不明な点がございましたら、新しい [issue](https://github.com/haierkeys/obsidian-custom-image-auto-uploader/issues/new) を作成するか、Telegram グループに参加して助けを求めてください: [https://t.me/obsidian_users](https://t.me/obsidian_users)



<h1 align="center">Obsidian Custom Image Auto Uploader</h1>

<p align="center">
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/releases"><img src="https://img.shields.io/github/release/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="release"></a>
    <a href="https://github.com/haierkeys/obsidian-custom-image-auto-uploader/blob/master/LICENSE"><img src="https://img.shields.io/github/license/haierkeys/obsidian-custom-image-auto-uploader?style=flat-square" alt="license"></a>
</p>

<p align="center">
  <strong>Obsidian ノート画像の一括クラウド同期および処理プラグイン</strong>
  <br>
  <em>一括ダウンロード / アップロード / 切り抜き / 圧縮 / 多様な画像ホスティングに対応</em>
</p>

<p align="center">
PCやモバイルデバイスからノート内の画像を一括ダウンロードしたり、リモートサーバー、家庭用NAS、WebDAV、またはクラウドストレージ（Aliyun OSS、Amazon S3、Cloudflare R2、MinIO）に一括アップロードして保存したりすることができます。また、画像の拡大縮小、切り抜き、サイズ変更も可能です。
</p>

<div align="center">
    <img src="https://github.com/user-attachments/assets/0878061b-d77c-48c5-aa61-cc5154612a7b" alt="preview" width="800" />
</div>

---

## ✨ 主な機能

* **⬇️ 一括ダウンロード**: ノート内のウェブ画像をワンクリックでローカルにダウンロード。
* **⬇️ 複数ノートの一括ダウンロード**: ヴォールト内のすべてのノートから画像を一括でダウンロード可能。
* **☁️ 一括アップロード**: ローカル画像をリモートサービスにアップロードし、多様なストレージバックエンドをサポート：
    * **セルフホストサービス**: [Custom Image Gateway](https://github.com/haierkeys/custom-image-gateway) と連携して使用。
    * **クラウドストレージ**: Aliyun OSS, Amazon S3, Cloudflare R2, MinIO など。
    * **汎用プロトコル**: WebDAV, リモートサーバー, 家庭用NAS。
* **☁️ 複数ノートの一括アップロード**: ヴォールト内のすべてのノートから画像を一括でアップロード可能。
* **✂️ 画像処理**: ノートのプロパティや本文で画像を即座に処理（ブログのカバー画像など）：
    * 等倍左上塗りつぶし (Cover)
    * 等倍中央塗りつぶし (Contain)
    * 固定サイズ引き伸ばし (Stretch)
    * 等倍フィット (Fit)
* **📱 全プラットフォーム対応**: Windows, MacOS, Linux, Android, iOS。
* **🖱️ 便利な操作**: ドラッグ＆ドロップ、貼り付けによる自動アップロードに対応。
* **🌍 多言語対応**: 多言語パックを内蔵。
* **🗑️ 未接続画像のクリーンアップ**: ノートに関連付けられていないヴォールト内のローカル画像をワンクリックで削除。

## 🗺️ ロードマップ

継続的な改善を行っています。今後の開発計画は以下の通りです：

- [x] **未接続画像のクリーンアップ**: ノートに関連付けられていないヴォールト内のローカル画像をワンクリックで削除。

> **改善の提案や新しいアイデアがある場合は、issue を通じてお気軽にお知らせください。適切な提案は慎重に評価し、採用させていただきます。**

## 🚀 クイックスタート

1.  **プラグインのインストール**
    Obsidian のコミュニティプラグイン市場で **Custom Image Auto Uploader** を検索してインストールします。

2.  **ゲートウェイの設定 (任意)**
    セルフホストの画像ホストを使用する場合は、**アップロード設定** > **API ゲートウェイアドレス** をあなたの **Custom Image Gateway** のアドレスに設定してください。
    > 例: `http://127.0.0.1:9000/api/upload`

3.  **認証の設定**
    セキュリティを確保するために **API アクセストークン** (Token) を設定します。

4.  **サービスの起動**
    リモートの **Custom Image Gateway** サービスが起動しており、アクセス可能であることを確認します。

5.  **検証**
    新しいノートを作成し、画像をコピーして貼り付け、アップロードが成功するか確認します。

## ⚙️ バックエンドサービス (API ゲートウェイ)

このプラグインの高度な機能には **Custom Image Gateway** の使用が必要です。

> **Custom Image Gateway** は、無料かつオープンソースの画像アップロードゲートウェイツールです。

*   **プロジェクトアドレス**: [haierkeys/custom-image-gateway](https://github.com/haierkeys/custom-image-gateway)
*   **デプロイメントドキュメント**: プロジェクトのホームページを参照してデプロイしてください。

## 📁 WebDAV ダイレクトアップロードモード

APIゲートウェイに加えて、プラグインはすべての画像と動画を **WebDAV** 経由で直接アップロードすることをサポートしています。ゲートウェイサーバーは不要です。ホームNAS（OpenList/AList など）を持つユーザーに最適です。

### プラグイン設定

プラグイン設定で **グローバルアップロードモード** を **WebDAV ダイレクト** に設定し、以下のフィールドを入力してください：

| 設定 | 例 | 備考 |
|------|-----|------|
| **WebDAV アドレス** | `http://127.0.0.1:52444/dav` | 末尾のスラッシュは不要 |
| **カスタム保存パス** | `Obsidian_Attachments/{YYYYMM}` | `{YYYYMM}` は現在の年月（例：`202605`）に自動置換されます。空欄にするとルートディレクトリにアップロードされます。 |
| **WebDAV ユーザー名** | `your_username` | |
| **WebDAV パスワード** | `your_password` | |
| **公開URLプレフィックス** | `http://your-nas.tailXXXX.ts.net/d` | 末尾のスラッシュは不要。空欄にすると `/dav` が自動的に `/d` に置換されます（OpenList/AList 向け）。 |

**例**: 上記の設定で `image.jpg` は以下のようになります：
- アップロード先：`http://127.0.0.1:52444/dav/Obsidian_Attachments/202605/image.jpg`
- ノートへの挿入：`http://your-nas.tailXXXX.ts.net/d/Obsidian_Attachments/202605/image.jpg`

### OpenList / AList の設定

[OpenList](https://github.com/OpenListTeam/OpenList) または [AList](https://github.com/AlistGo/alist) をWebDAVサーバーとして使用する場合：

1. OpenList/AList の設定でWebDAVを有効にします。
2. Obsidian の添付ファイル専用フォルダ（例：`Obsidian_Attachments`）を作成します。
3. **公開読み取り専用アクセス**：OpenList/AList で、特定のフォルダパスへのゲストユーザーアクセスを有効にして、ログインなしで公開ダイレクトリンク（`/d/` 経由）にアクセスできるようにします。

> ⚠️ **重要**：ゲストアクセスは Obsidian 添付ファイルフォルダのみに限定し、ストレージルート全体には絶対に設定しないでください。

### Tailscale でセキュアなリモートアクセス（推奨）

[Tailscale](https://tailscale.com/) を使用することで、ホームNASをパブリックインターネットに公開せずに、どこからでも安全にアクセスできます：

1. NAS とすべてのデバイスに Tailscale をインストールします。
2. NAS は `your-nas.tailXXXX.ts.net` のようなプライベートホスト名を取得します。
3. **公開URLプレフィックス** フィールドに入力：`http://your-nas.tailXXXX.ts.net/d`
4. Tailscale ネットワークに参加したデバイスのみがURLにアクセスできます。完全にプライベートで安全です。

> ⚠️ **セキュリティ注意**：Tailscale なしでNASをパブリックインターネットに公開する場合は以下を確認してください：
> - 強力なWebDAV認証情報を使用する
> - 特定の読み取り専用フォルダにのみゲストアクセスを許可し、書き込みアクセスは絶対に許可しない
> - NASでHTTPSを有効にする

## ☕ スポンサーとサポート

このプラグインが役に立ち、開発を継続的にサポートしたい場合は、コーヒーを一杯ご馳走していただけると幸いです：

[<img src="https://cdn.ko-fi.com/cdn/kofi3.png?v=3" alt="BuyMeACoffee" width="100">](https://ko-fi.com/haierkeys)
