import { App, PluginSettingTab, Notice, Setting, Platform } from "obsidian";
import { createRoot } from "react-dom/client";
import * as React from "react";

import { SettingsView, CompressionView } from "./views/settings-view";
import CustomImageAutoUploader from "./main";
import { KofiImage } from "./lib/res";
import { $ } from "./lang/lang";


export const ImageSvrProcessMode = {
  // 不处理
  none: { label: $("不处理"), value: "none" },
  // 默认裁剪
  fillTopleft: { label: $("等比左上填充(裁剪)"), value: "fill-topleft" },
  // 居中裁剪
  fillCenter: { label: $("等比居中填充(裁剪)"), value: "fill-center" },
  // 固定尺寸拉伸
  resize: { label: $("固定尺寸拉伸"), value: "resize" },
  // 固定尺寸等比缩放不裁切
  fit: { label: $("等比适应"), value: "fit" },
}

export interface UploadSet {
  [key: string]: string
  key: string
  //设置宽度
  width: string
  //设置高度
  height: string
  // PropertyUploadSetType
  type: string
}

export interface PluginSettings {
  //是否自动上传
  isAutoUpload: boolean
  isAutoDown: boolean
  isCloseNotice: boolean
  afterUploadTimeout: number
  //API地址
  api: string
  // 视频上传方式: "api" 使用 API 网关协议, "webdav" 使用 WebDAV PUT 直传
  videoUploadType: "api" | "webdav"
  // 视频 API 地址（api 模式）或 WebDAV 基础目录地址（webdav 模式）
  videoApi: string
  // WebDAV 公共访问地址（webdav 模式，留空则自动将 /dav/ 替换为 /d/，适用于 OpenList/AList）
  videoWebdavPublicUrl: string
  //API Token
  apiToken: string
  clipboardReadTip: string
  //处理排除的域名清单
  excludeDomains: string
  //// 是否处理剪贴板图片
  // isHandleClipboard: boolean;
  //本地图片上传后是否删除
  isDeleteSource: boolean
  //上传后的图片是否随机后缀
  uploadImageRandomSearch: boolean
  isCompress: boolean
  compressMaxWidth: number
  compressMaxHeight: number
  compressQuality: number
  //内容部分上传设置
  contentSet: UploadSet
  //元数据上传设置
  propertyNeedSets: Array<UploadSet>
  // 视频上传最大大小限制 (MB)
  maxVideoSizeMB: number
  //  [propName: string]: any;
}

/**
 *

![这是图片](https://markdown.com.cn/assets/img/philly-magic-garden.9c0b4415.jpg)

 */

// 默认插件设置
export const DEFAULT_SETTINGS: PluginSettings = {
  // 是否自动上传
  isAutoUpload: true,
  // 是否自动下载
  isAutoDown: true,
  // 是否关闭提示
  isCloseNotice: true,
  // 上传后的超时时间，单位为毫秒
  afterUploadTimeout: 1000,
  // API 网关地址
  api: "http://127.0.0.1:36677/upload",
  // 视频上传方式
  videoUploadType: "api",
  // 视频 API 地址 / WebDAV 基础目录地址
  videoApi: "",
  // WebDAV 公共访问地址
  videoWebdavPublicUrl: "",
  // API 令牌
  apiToken: "",
  clipboardReadTip: "",
  // 排除的域名列表
  excludeDomains: "",
  // 本地图片上传后是否删除
  isDeleteSource: true,
  // 上传后的图片是否随机后缀
  uploadImageRandomSearch: true,
  // 图片预压缩设置
  isCompress: true,
  compressMaxWidth: 1200,
  compressMaxHeight: 1200,
  compressQuality: 1,
  // 内容部分上传设置
  contentSet: { key: "", type: ImageSvrProcessMode.none.value, width: "0", height: "0" },
  // 元数据上传设置
  propertyNeedSets: [
    { key: "cover", type: ImageSvrProcessMode.none.value, width: "0", height: "0" },
    { key: "images", type: ImageSvrProcessMode.none.value, width: "0", height: "0" },
  ],
  // 视频最大上传大小，默认 50 MB
  maxVideoSizeMB: 50,
}

export class SettingTab extends PluginSettingTab {
  plugin: CustomImageAutoUploader

  constructor(app: App, plugin: CustomImageAutoUploader) {
    super(app, plugin)
    this.plugin = plugin
  }


  display(): void {
    const { containerEl: set } = this

    set.empty()

    new Setting(set)
      .setName("| " + $("通用"))
      .setHeading()
      .setClass("custom-image-auto-uploader-settings-tag")

    new Setting(set)
      .setName($("是否自动上传"))
      .setDesc($("如果关闭,您只能手动上传图片"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.isAutoUpload).onChange(async (value) => {
          this.plugin.settings.isAutoUpload = value
          this.display()
          await this.plugin.saveSettings()
        })
      )

    new Setting(set)
      .setName($("是否自动下载"))
      .setDesc($("如果关闭,您只能手动下载图片"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.isAutoDown).onChange(async (value) => {
          this.plugin.settings.isAutoDown = value
          this.display()
          await this.plugin.saveSettings()
        })
      )

    new Setting(set)
      .setName($("上传间隔时间"))
      .setDesc($("单位为毫秒,默认设置1s"))
      .addText((text) =>
        text.setValue(this.plugin.settings.afterUploadTimeout.toString()).onChange(async (value) => {
          this.plugin.settings.afterUploadTimeout = Number(value)
          await this.plugin.saveSettings()
        })
      )

    new Setting(set)
      .setName($("关闭提示"))
      .setDesc($("关闭右上角结果提示"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.isCloseNotice).onChange(async (value) => {
          this.plugin.settings.isCloseNotice = value
          this.display()
          await this.plugin.saveSettings()
        })
      )

    new Setting(set)
      .setName("| " + $("API 网关"))
      .setHeading()
      .setClass("custom-image-auto-uploader-settings-tag")

    const root2 = document.createElement("div")
    root2.className = "custom-image-auto-uploader-settings"
    set.appendChild(root2)

    const reactRoot2 = createRoot(root2)
    reactRoot2.render(<SettingsView plugin={this.plugin} />)

    const api = new Setting(set)
      .setName($("API 网关地址"))
      .setDesc($("Custom Image Gateway 地址"))
      .addText((text) =>
        text
          .setPlaceholder($("输入您的 Custom Image Gateway 地址"))
          .setValue(this.plugin.settings.api)
          .onChange(async (value) => {
            this.plugin.settings.api = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(set)
      .setName($("视频上传方式"))
      .setDesc($("选择视频文件的上传方式。Custom Image Gateway 目前仅支持图片，视频需选择 WebDAV 直传"))
      .addDropdown((drop) =>
        drop
          .addOption("api", $("API 网关（与图片相同）"))
          .addOption("webdav", $("WebDAV 直传"))
          .setValue(this.plugin.settings.videoUploadType)
          .onChange(async (value) => {
            this.plugin.settings.videoUploadType = value as "api" | "webdav"
            this.display()
            await this.plugin.saveSettings()
          })
      )

    if (this.plugin.settings.videoUploadType === "api") {
      new Setting(set)
        .setName($("视频 API 地址"))
        .setDesc($("视频上传的 API 地址，留空则使用上方图片 API 地址"))
        .addText((text) =>
          text
            .setPlaceholder($("留空则使用图片 API 地址"))
            .setValue(this.plugin.settings.videoApi)
            .onChange(async (value) => {
              this.plugin.settings.videoApi = value
              await this.plugin.saveSettings()
            })
        )
    }

    if (this.plugin.settings.videoUploadType === "webdav") {
      new Setting(set)
        .setName($("WebDAV 上传地址"))
        .setDesc($("WebDAV 基础目录地址，例如: http://host/dav/Obsidian/"))
        .addText((text) =>
          text
            .setPlaceholder("http://host/dav/Obsidian/")
            .setValue(this.plugin.settings.videoApi)
            .onChange(async (value) => {
              this.plugin.settings.videoApi = value
              await this.plugin.saveSettings()
            })
        )

      new Setting(set)
        .setName($("WebDAV 公共访问地址"))
        .setDesc($("文件公共下载基础地址，留空则自动将 /dav/ 替换为 /d/（适用于 OpenList/AList）"))
        .addText((text) =>
          text
            .setPlaceholder("http://host/d/Obsidian/")
            .setValue(this.plugin.settings.videoWebdavPublicUrl)
            .onChange(async (value) => {
              this.plugin.settings.videoWebdavPublicUrl = value
              await this.plugin.saveSettings()
            })
        )
    }

    const apiToken = new Setting(set)
      .setName($("API 访问令牌"))
      .setDesc($("用于访问API的令牌"))
      .addText((text) =>
        text
          .setPlaceholder($("输入您的 API 访问令牌"))
          .setValue(this.plugin.settings.apiToken)
          .onChange(async (value) => {
            this.plugin.settings.apiToken = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(set)
      .setName("| " + $("下载"))
      .setHeading()
      .setClass("custom-image-auto-uploader-settings-tag")

    new Setting(set)
      .setName($("下载域名排除"))
      .setDesc($("在排除名单内的图片地址不会被下载,一行一个域名,支持 * 通配符"))
      .addTextArea((text) =>
        text
          .setPlaceholder($("Enter your secret"))
          .setValue(this.plugin.settings.excludeDomains)
          .onChange(async (value) => {
            this.plugin.settings.excludeDomains = value
            await this.plugin.saveSettings()
          })
      )
    new Setting(set)
      .setName("| " + $("上传"))
      .setHeading()
      .setClass("custom-image-auto-uploader-settings-tag")

    new Setting(set)
      .setName($("上传速度优化"))
      .setDesc($("在图片上传前是否进行压缩"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.isCompress).onChange(async (value) => {
          this.plugin.settings.isCompress = value
          this.display()
          await this.plugin.saveSettings()
        })
      )

    if (this.plugin.settings.isCompress) {
      new Setting(set)
        .setName($("上传速度优化 - 压缩质量"))
        .setDesc($("压缩后的图片质量,范围0-1,默认0.8"))
        .addText((text) =>
          text.setValue(this.plugin.settings.compressQuality.toString()).onChange(async (value) => {
            this.plugin.settings.compressQuality = Number(value)
            await this.plugin.saveSettings()
          })
        )

      new Setting(set)
        .setName($("上传速度优化 - 最大宽度"))
        .setDesc($("压缩后的最大宽度,单位像素,默认1200"))
        .addText((text) =>
          text.setValue(this.plugin.settings.compressMaxWidth.toString()).onChange(async (value) => {
            this.plugin.settings.compressMaxWidth = Number(value)
            await this.plugin.saveSettings()
          })
        )

      new Setting(set)
        .setName($("上传速度优化 - 最大高度"))
        .setDesc($("压缩后的最大高度,单位像素,默认1200"))
        .addText((text) =>
          text.setValue(this.plugin.settings.compressMaxHeight.toString()).onChange(async (value) => {
            this.plugin.settings.compressMaxHeight = Number(value)
            await this.plugin.saveSettings()
          })
        )
    }

    new Setting(set)
      .setName($("是否上传后删除原图片"))
      .setDesc($("在图片上传后是否删除本地原图片"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.isDeleteSource).onChange(async (value) => {
          this.plugin.settings.isDeleteSource = value
          this.display()
          await this.plugin.saveSettings()
        })
      )

    new Setting(set)
      .setName($("图片上传地址增加随机查询"))
      .setDesc($("在图片地址末尾增加随机查询,用于规避CDN缓存") + " eg: https://domain.com/upload-image.png?Bh7OP5YGJ0")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.uploadImageRandomSearch).onChange(async (value) => {
          this.plugin.settings.uploadImageRandomSearch = value
          this.display()
          await this.plugin.saveSettings()
        })
      )

    new Setting(set)
      .setName($("视频上传最大大小"))
      .setDesc($("视频文件超出此大小将被跳过并提示错误，单位 MB，默认 50 MB。支持格式：mp4、mov"))
      .addText((text) =>
        text
          .setPlaceholder("50")
          .setValue(this.plugin.settings.maxVideoSizeMB.toString())
          .onChange(async (value) => {
            const num = Number(value)
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.maxVideoSizeMB = num
              await this.plugin.saveSettings()
            }
          })
      )

    const root = document.createElement("div")
    root.className = "custom-image-auto-uploader-settings"
    set.appendChild(root)

    const reactRoot = createRoot(root)
    reactRoot.render(<CompressionView plugin={this.plugin} />)

    new Setting(set)
      .setName("| " + $("支持"))
      .setHeading()
      .setClass("custom-image-auto-uploader-settings-tag")
    let y = new Setting(set)
      .setName($("捐赠"))
      .setDesc($("如果您喜欢这个插件，请考虑捐赠以支持继续开发。"))
      .settingEl.createEl("a", { href: "https://ko-fi.com/haierkeys" })
      .createEl("img", {
        attr: { src: KofiImage, height: "36", border: "0", alt: "Buy Me a Coffee at ko-fi.com", style: "height:36px!important;border:0px!important;" },
      })

    const debugDiv = set.createDiv()
    debugDiv.setAttr("align", "center")
    debugDiv.setAttr("style", "margin: var(--size-4-2)")

    const debugButton = debugDiv.createEl("button")
    debugButton.setText($("复制 Debug 信息"))
    debugButton.onclick = async () => {
      await window.navigator.clipboard.writeText(
        JSON.stringify(
          {
            settings: this.plugin.settings,
            pluginVersion: this.plugin.manifest.version,
          },
          null,
          4
        )
      )
      new Notice($("将调试信息复制到剪贴板, 可能包含敏感信!"))
    }

    if (Platform.isDesktopApp) {
      const info = set.createDiv()
      info.setAttr("align", "center")
      info.setText($("通过快捷键打开控制台，你可以看到这个插件和其他插件的日志"))

      const keys = set.createDiv()
      keys.setAttr("align", "center")
      keys.addClass("custom-shortcuts")
      if (Platform.isMacOS === true) {
        keys.createEl("kbd", { text: "CMD (⌘) + OPTION (⌥) + I" })
      } else {
        keys.createEl("kbd", { text: "CTRL + SHIFT + I" })
      }
    }
  }

}
