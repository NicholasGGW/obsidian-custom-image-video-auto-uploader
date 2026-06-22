import { requestUrl, TFile, Vault, Notice, Menu, MenuItem, setIcon, CachedMetadata } from "obsidian";
import { fileTypeFromBuffer, FileTypeResult } from "file-type";

import CustomImageAutoUploader from "../main";
import { UploadSet } from "../setting";
import { Metadata } from "./interface";
import { $ } from "../lang/lang";


export const IMAGE_MIME_TYPES: Record<string, string[]> = {
  "image/bmp": ["bmp"],
  "image/avif": ["avif"],
  "image/gif": ["gif"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
}
export const IMAGE_EXTENSIONS = Object.values(IMAGE_MIME_TYPES).flat()

export const VIDEO_MIME_TYPES: Record<string, string> = {
  "mp4": "video/mp4",
  "mov": "video/quicktime",
}
export const VIDEO_EXTENSIONS = Object.keys(VIDEO_MIME_TYPES)

export interface ImageDownResult {
  err: boolean
  msg: string
  path?: string
  type?: FileTypeResult
}

export interface ImageUploadResult {
  err: boolean
  msg: string
  imageUrl?: string
  apiError?: string
}

export interface VideoUploadResult {
  err: boolean
  msg: string
  videoUrl?: string
  posterUrl?: string
  /** true when the file was skipped due to size limit */
  sizeExceeded?: boolean
  /** original filename (populated when sizeExceeded) */
  fileName?: string
  /** actual file size in MB (populated when sizeExceeded) */
  fileSize?: number
}

/**
 * 从URL中提取文件名
 * @param url - 文件的URL
 * @param hasExt - 是否包含扩展名
 * @returns 提取的文件名
 */
export function getUrlFileName(url: string, hasExt: Boolean = true): string {
  let pathname = new URL(url).pathname
  let fileName = pathname.substring(pathname.lastIndexOf("/") + 1)
  fileName = fileName.substring(0, fileName.lastIndexOf("."))
  return decodeURI(fileName).replaceAll(/[\\\\/:*?\"<>|]/g, "-")
}

/**
 * 从给定的路径中提取目录名
 * @param path - 包含文件名的路径
 * @returns 路径中的目录名部分
 */
export function getDirname(path: string): string {
  let folderList = path.split("/")
  folderList.pop()
  return folderList.join("/")
}

/**
 * 生成指定长度的随机字符串
 * @param length - 随机字符串的长度
 * @returns 生成的随机字符串
 */
export function generateRandomString(length: number): string {
  // 定义包含所有可能字符的字符串
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  // 循环生成随机字符串
  for (let i = 0; i < length; i++) {
    // 生成一个随机索引
    const randomIndex = Math.floor(Math.random() * characters.length)
    // 将随机索引对应的字符添加到结果字符串中
    result += characters[randomIndex]
  }
  // 返回生成的随机字符串
  return result
}

/**
 * 生成文件的随机保存键
 * @returns 生成的随机保存键
 */
const nameSet = new Set()
export function getFileRandomSaveKey(): string {
  let name = (Math.random() + 1).toString(36).substr(2, 5)
  if (nameSet.has(name)) {
    name = `${name}-${(Math.random() + 1).toString(36).substr(2, 5)}`
  }
  nameSet.add(name)
  return name
}

/**
 * 检查并创建文件夹
 * @param path - 文件夹路径
 * @param vault - Vault实例
 */
export async function checkCreateFolder(path: string, vault: Vault) {
  if (path != "" && !vault.getFolderByPath(path)) {
    vault.createFolder(path)
  }
}

/**
 * 获取附件保存路径
 * @param file - 文件名
 * @param plugin - 插件实例
 * @returns 附件保存路径
 */
export async function getAttachmentSavePath(file: string, plugin: CustomImageAutoUploader): Promise<string> {
  return await plugin.app.fileManager.getAvailablePathForAttachment(file)
}

/**
 * 获取附件上传路径
 * @param image - 图片名
 * @param plugin - 插件实例
 * @returns 附件上传路径
 */
export async function getAttachmentUploadPath(image: string, plugin: CustomImageAutoUploader): Promise<TFile | null> {
  return plugin.app.metadataCache.getFirstLinkpathDest(image, image)
}

/**
 * 替换文本中的内容 (WikiLink format for Uploads)
 * @param content - 原始内容
 * @param search - 要替换的内容
 * @param desc - 描述 (alt text)
 * @param path - 路径 (URL or file path)
 * @returns 替换后的内容: ![desc](path)
 */
export function replaceInTextForUpload(content: string, search: string, desc: string, path: string): string {
  const newLink = `![${desc}](${path})`
  return content.split(search).join(newLink)
}

/**
 * 替换文本中的视频 WikiLink 为 HTML5 <video> 标签
 * @param content - 原始内容
 * @param search - 要替换的 WikiLink 文本
 * @param videoUrl - 视频URL
 * @param posterUrl - 预览图URL（可为空字符串）
 * @param ext - 视频扩展名 (mp4 / mov)
 * @returns 替换后的内容
 */
export function replaceInTextForVideoUpload(
  content: string,
  search: string,
  videoUrl: string,
  posterUrl: string,
  ext: string
): string {
  const mimeType = VIDEO_MIME_TYPES[ext.toLowerCase()] ?? `video/${ext.toLowerCase()}`
  const posterAttr = posterUrl ? ` poster="${posterUrl}"` : ""
  const newHtml = `<video controls${posterAttr}>\n<source src="${videoUrl}" type="${mimeType}">\n</video>`
  return content.split(search).join(newHtml)
}

/**
 * 替换文本中的内容 (WikiLink format for Downloads)
 * @param content - 原始内容
 * @param search - 要替换的内容
 * @param desc - 描述 (alt text)
 * @param path - 路径 (local path)
 * @returns 替换后的内容: ![[path|desc]]
 */
export function replaceInTextForDownload(content: string, search: string, desc: string, path: string): string {
  const newLink = desc ? `![[${path}|${desc}]]` : `![[${path}]]`
  return content.split(search).join(newLink)
}

/**
 * 替换文本中的内容 (Deprecated)
 * @deprecated Use replaceInTextForUpload or replaceInTextForDownload instead
 */
export function replaceInText(content: string, search: string, desc: string, path: string, url?: string): string {
  if (url) {
    return replaceInTextForUpload(content, search, desc, path)
  } else {
    return replaceInTextForDownload(content, search, desc, path)
  }
}

/**
 * 检查是否包含排除的域名
 * @param src - 源URL
 * @param excludeDomains - 排除的域名列表
 * @returns 是否包含排除的域名
 */
export function hasExcludeDomain(src: string, excludeDomains: string): boolean {
  if (excludeDomains.trim() === "" || !/^http/.test(src)) {
    return false
  }

  let url = new URL(src)
  let has = false

  const domain = url.hostname

  const excludeDomainList = excludeDomains.split("\n").filter((item) => item !== "")

  excludeDomainList.forEach(function (item) {
    item = item.replace(/\./g, "\\.") //将.替换为\.，因为.在正则表达式中有特殊含义
    item = item.replace("*", ".*")

    let patt = new RegExp("^" + item, "i") //正则表达式
    let res = patt.exec(domain) //执行匹配，并获取到匹配结果

    if (res != null) {
      has = true
      return
    }
  })
  return has
}

/**
 * 自动添加排除的域名
 * @param src - 源URL
 * @param plugin - 插件实例
 */
export function autoAddExcludeDomain(src: string, plugin: CustomImageAutoUploader): void {
  let url = new URL(src)
  const domain = url.hostname
  let has = hasExcludeDomain(src, plugin.settings.excludeDomains)

  if (!has) {
    plugin.settings.excludeDomains += `\n${domain}`
    plugin.settings.excludeDomains = plugin.settings.excludeDomains.trim()
  }
  plugin.saveSettings(false)
}

/**
 * 下载图片
 * @param url - 图片URL
 * @param plugin - 插件实例
 * @returns 下载结果
 */
export async function imageDown(url: string, plugin: CustomImageAutoUploader): Promise<ImageDownResult> {
  const response = await requestUrl({ url })

  if (response.status !== 200) {
    return { err: false, msg: $("网络错误,请检查网络是否通畅") }
  }

  let type = <FileTypeResult>await fileTypeFromBuffer(response.arrayBuffer)

  if (!IMAGE_EXTENSIONS.includes(type.ext) && type) {
    return { err: true, msg: $("下载文件不是允许的图片类型") }
  }

  let urlObj = new URL(url)

  try {
    const name = getUrlFileName(url, false) != "" ? getUrlFileName(url, false) : getFileRandomSaveKey()
    const path = `${name}.${type.ext}`
    const userPath = await getAttachmentSavePath(path, plugin)
    checkCreateFolder(getDirname(userPath), this.app.vault)

    await plugin.app.vault.createBinary(userPath, response.arrayBuffer)

    return { err: false, msg: "", path: path, type }
  } catch (err) {
    return { err: true, msg: $("图片文件创建失败:") + err.message }
  }
}

/**
 * 上传图片
 * @param path - 图片路径
 * @param postdata - 上传数据
 * @param plugin - 插件实例
 * @returns 上传结果
 */
export async function imageUpload(file: TFile, postData: UploadSet | undefined, plugin: CustomImageAutoUploader): Promise<ImageUploadResult> {
  if (!IMAGE_EXTENSIONS.includes(file.extension)) {
    return { err: true, msg: $("上传文件不是允许的图片类型") }
  }

  let body = await plugin.app.vault.readBinary(file)

  if (!postData) return { err: true, msg: $("扩展参数为空") }

  let compressedBody = body

  if (plugin.settings.isCompress) {
    try {
      const img = new Image()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      // 创建临时URL以加载图片
      const blob = new Blob([body], { type: `image/${file.extension}` })
      const url = URL.createObjectURL(blob)

      await new Promise((resolve, reject) => {
        img.onload = () => {
          // 设置压缩后的尺寸,保持宽高比
          const maxWidth = plugin.settings.compressMaxWidth
          const maxHeight = plugin.settings.compressMaxHeight
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }

          canvas.width = width
          canvas.height = height

          // 绘制并压缩
          ctx?.drawImage(img, 0, 0, width, height)

          // 转换为二进制
          canvas.toBlob(
            (blob) => {
              if (blob) {
                blob.arrayBuffer().then((buffer) => {
                  compressedBody = buffer
                  resolve(null)
                })
              }
            },
            `image/${file.extension}`,
            plugin.settings.compressQuality
          )
        }
        img.src = url
      })

      URL.revokeObjectURL(url)
    } catch (error) {
      return { err: true, msg: $("图片压缩失败:") + error.message }
    }
  }

  let requestData = new FormData()
  requestData.append("imagefile", new Blob([compressedBody], { type: `image/${file.extension}` }), file.name)

  Object.keys(postData).forEach((v, i, p) => {
    requestData.append(v, postData[v])
  })

  let response
  try {
    response = await fetch(plugin.settings.api, { method: "POST", headers: plugin.settings.apiToken == "" ? new Headers() : new Headers({ Authorization: plugin.settings.apiToken }), body: requestData })
  } catch (error) {
    return { err: true, msg: $("网络错误,请检查网络是否通畅") }
  }

  if (response && !response.ok) {
    let result = await response.text()
    return { err: true, msg: $("网络错误,请检查网络是否通畅") }
  }

  let result = await response.json()

  if (result && !result.status) {
    const detailsMsg = result.details && Array.isArray(result.details) ? result.details.join("") : ""
    return { err: true, msg: "API Error:" + result.message + detailsMsg, apiError: detailsMsg }
  } else {
    if (plugin.settings.isDeleteSource && file instanceof TFile) {
      plugin.app.fileManager.trashFile(file)
    }

    return { err: false, msg: result.message, imageUrl: result.data.imageUrl }
  }
}

/**
 * 处理文件的元数据缓存
 * @param activeFile - 当前活动文件
 * @param plugin - 插件实例
 * @returns 处理后的元数据数组
 */
export function metadataCacheHandle(cache: CachedMetadata, plugin: CustomImageAutoUploader): Metadata[] {
  let metadataNeedKeys = Array<string>()

  plugin.settings.propertyNeedSets.forEach((item, i) => {
    metadataNeedKeys[i] = item.key
  })

  let handleMetadata: Metadata[] = []

  if (cache?.frontmatter) {
    Object.keys(cache.frontmatter).forEach((key) => {
      if (cache?.frontmatter && metadataNeedKeys.includes(key)) {
        let i: number = metadataNeedKeys.indexOf(key)
        if (typeof cache.frontmatter[key] == "string") {
          const match = cache.frontmatter[key].match(/^\!\[\[(.*)\]\]$/)
          if (match) {
            cache.frontmatter[key] = match[1]
          }
          handleMetadata.push({ key: key, type: "string", value: [<string>cache.frontmatter[key]], params: plugin.settings.propertyNeedSets[i] })
        } else if (Array.isArray(cache.frontmatter[key])) {
          let pics = []
          for (let index = 0; index < cache.frontmatter[key].length; index++) {
            pics.push(<string>cache.frontmatter[key][index])
          }
          handleMetadata.push({ key: key, type: "array", value: pics, params: plugin.settings.propertyNeedSets[i] })
        }
      }
    })
  }

  return handleMetadata
}

/**
 * 显示任务结果通知
 * @param plugin 插件实例
 * @param type 任务类型：'download' | 'upload' | 'all'
 * @param isMetadata 是否为元数据任务
 */
export function showTaskNotice(plugin: CustomImageAutoUploader, type: "download" | "upload" | "all"): void {
  if (plugin.settings.isCloseNotice) return
  let message = ""
  if (type === "all") {
    // 显示下载和上传的所有信息
    if (plugin.downloadStatus.total > 0) {
      message += `${$("下载")}:\n`
      message += `succeed: ${plugin.downloadStatus.current} \n`
      message += `failed: ${plugin.downloadStatus.total - plugin.downloadStatus.current}\n\n`
    }
    if (plugin.uploadStatus.total > 0) {
      message += `${$("上传")}:\n`
      message += `succeed: ${plugin.uploadStatus.current} \n`
      message += `failed: ${plugin.uploadStatus.total - plugin.uploadStatus.current}`
    }
  } else {
    // 显示单个任务的信息
    const status = type === "download" ? plugin.downloadStatus : plugin.uploadStatus
    const typeText = type === "download" ? $("下载") : $("上传")
    message = `${typeText}:\nsucceed: ${status.current} \nfailed: ${status.total - status.current}`
  }
  if (message != "" && !plugin.settings.isCloseNotice) {
    new Notice(message)
  }
}

/**
 * 显示错误通知
 * @param message 错误信息
 */
export function showErrorNotice(message: string): void {
  new Notice(message)
}

/**
 * 检查插件状态
 * @param plugin - 插件实例
 */
export function statusCheck(plugin: CustomImageAutoUploader): void {
  if (plugin.statusBar.length == 0) {
    plugin.statusBar[0] = plugin.addStatusBarItem()
    plugin.statusBar[1] = plugin.addStatusBarItem()
    plugin.statusBar[2] = plugin.addStatusBarItem()
  }
  setIcon(plugin.statusBar[0], "image")
  plugin.statusBar[0].setAttrs({ title: "Custom Image Auto Uploader / " + $("Custom Image Auto Uploader") })

  setIcon(plugin.statusBar[1], "none")
  if (plugin.settings.isAutoUpload && plugin.settings.isAutoDown) {
    setIcon(plugin.statusBar[1], "arrow-down-up")
    plugin.statusBar[1].setAttrs({ title: $("自动上传下载") + ":" + $("已开启") })
  } else {
    if (plugin.settings.isAutoUpload) {
      setIcon(plugin.statusBar[1], "circle-arrow-up")
      plugin.statusBar[1].setAttrs({ title: $("自动上传") + ":" + $("已开启") + " / " + $("自动下载") + ":" + $("已关闭") })
    }
    if (plugin.settings.isAutoDown) {
      setIcon(plugin.statusBar[1], "circle-arrow-down")
      plugin.statusBar[1].setAttrs({ title: $("自动下载") + ":" + $("已开启") + " / " + $("自动上传") + ":" + $("已关闭") })
    }
  }

  let title = ""

  // 根据全局状态类型显示进度
  if (plugin.statusType !== "none") {
    if (plugin.statusType === "download" && plugin.downloadStatus.total > 0) {
      title += $("下载") + `: ${plugin.downloadStatus.current}/${plugin.downloadStatus.total}`
    } else if (plugin.statusType === "upload" && plugin.uploadStatus.total > 0) {
      title += $("上传") + `: ${plugin.uploadStatus.current}/${plugin.uploadStatus.total}`
    } else if (plugin.statusType === "all") {
      if (plugin.downloadStatus.total > 0 || plugin.uploadStatus.total > 0) {
        if (plugin.downloadStatus.total > 0) {
          title += $("下载") + `: ${plugin.downloadStatus.current}/${plugin.downloadStatus.total}`
        }
        if (plugin.uploadStatus.total > 0) {
          if (plugin.downloadStatus.total > 0) title += " "
          title += $("上传") + `: ${plugin.uploadStatus.current}/${plugin.uploadStatus.total}`
        }
      }
    }
  }

  plugin.statusBar[2].setText(title)
}

/**
 * 从视频文件中提取第一帧作为预览图（poster）
 * @param file - 视频 TFile
 * @param plugin - 插件实例
 * @returns JPEG 图片的 ArrayBuffer，失败时返回 null
 */
export async function generateVideoPoster(file: TFile, plugin: CustomImageAutoUploader): Promise<ArrayBuffer | null> {
  try {
    const body = await plugin.app.vault.readBinary(file)
    const ext = file.extension.toLowerCase()
    const mimeType = VIDEO_MIME_TYPES[ext] ?? `video/${ext}`
    const blob = new Blob([body], { type: mimeType })
    const url = URL.createObjectURL(blob)

    return await new Promise<ArrayBuffer | null>((resolve) => {
      const video = document.createElement("video")
      video.preload = "auto"
      video.muted = true
      video.playsInline = true

      let settled = false
      const settle = (val: ArrayBuffer | null) => {
        if (settled) return
        settled = true
        URL.revokeObjectURL(url)
        resolve(val)
      }

      // Timeout fallback
      const timer = setTimeout(() => settle(null), 15000)

      const captureFrame = () => {
        clearTimeout(timer)
        try {
          const canvas = document.createElement("canvas")
          canvas.width = video.videoWidth || 1280
          canvas.height = video.videoHeight || 720
          const ctx = canvas.getContext("2d")
          if (!ctx) { settle(null); return }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(
            (b) => {
              if (b) {
                b.arrayBuffer().then((buf) => settle(buf)).catch(() => settle(null))
              } else {
                settle(null)
              }
            },
            "image/jpeg",
            0.85
          )
        } catch {
          settle(null)
        }
      }

      video.addEventListener("loadeddata", captureFrame, { once: true })
      video.addEventListener("error", () => { clearTimeout(timer); settle(null) }, { once: true })
      video.src = url
    })
  } catch {
    return null
  }
}

/**
 * 解析自定义路径中的日期占位符
 * 花括号内可自由组合 YYYY / MM / DD，分隔符任意
 * 示例：
 *   {YYYYMM}      → "202605"
 *   {YYYY-MM}     → "2026-05"
 *   {YYYY_MM}     → "2026_05"
 *   {YYYY/MM/DD}  → "2026/05/27"
 *   {YYYY}        → "2026"
 *   {MM-DD}       → "05-27"
 */
/** Compute the WebDAV upload URL and public access URL for a given filename and config. */
function computeWebdavTargetUrls(
  fileName: string,
  webdavUrl: string,
  webdavCustomPath: string,
  webdavPublicUrlPrefix: string
): { uploadUrl: string; publicUrl: string } {
  const resolvedPath = resolveCustomPath((webdavCustomPath ?? "").replace(/^\/+|\/+$/g, ""))
  const base = webdavUrl.replace(/\/+$/, "")
  const publicBase = webdavPublicUrlPrefix?.trim()
    ? webdavPublicUrlPrefix.replace(/\/+$/, "")
    : base.replace(/\/dav(?=\/|$)/, "/d")
  const remotePath = resolvedPath ? `${resolvedPath}/${fileName}` : fileName
  return { uploadUrl: `${base}/${remotePath}`, publicUrl: `${publicBase}/${remotePath}` }
}

function resolveCustomPath(customPath: string): string {
  const now = new Date()
  const yyyy = now.getFullYear().toString()
  const mm = (now.getMonth() + 1).toString().padStart(2, "0")
  const dd = now.getDate().toString().padStart(2, "0")
  // 将每一个 {...} 块内的 YYYY / MM / DD 替换为实际日期，再去掉花括号
  return customPath.replace(/\{([^}]+)\}/g, (_match, inner: string) => {
    return inner
      .replace(/YYYY/g, yyyy)
      .replace(/MM/g, mm)
      .replace(/DD/g, dd)
  })
}

/**
 * WebDAV PUT 文件上传辅助函数
 * - 支持自定义保存路径（含日期占位符，如 {YYYY-MM}、{YYYY_MM_DD} 等）
 * - 逐段创建目录（progressive MKCOL），避免父目录不存在导致 PUT 失败
 * - 公共访问 URL 可自定义前缀，留空则自动将 /dav 替换为 /d
 * - 使用 Obsidian requestUrl 走 Electron native HTTP，
 *   避免 4xx 响应在浏览器 DevTools 控制台产生红色错误日志
 */
async function webdavUploadFile(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  webdavUrl: string,
  webdavCustomPath: string,
  webdavPublicUrlPrefix: string,
  webdavUser: string,
  webdavPassword: string,
  duplicateAction?: "overwrite" | "warn" | "reuse"
): Promise<{ url: string } | { error: string } | { duplicate: true; url: string }> {
  // Basic Auth（支持 Unicode 用户名/密码）
  const basicAuth = `Basic ${btoa(unescape(encodeURIComponent(`${webdavUser}:${webdavPassword}`)))}`

  const { uploadUrl, publicUrl } = computeWebdavTargetUrls(fileName, webdavUrl, webdavCustomPath, webdavPublicUrlPrefix)
  const base = webdavUrl.replace(/\/+$/, "")

  // 同名文件检查（非覆盖模式）
  if (duplicateAction && duplicateAction !== "overwrite") {
    try {
      const headResp = await requestUrl({ url: uploadUrl, method: "HEAD", headers: { Authorization: basicAuth }, throw: false })
      if (headResp.status === 200 || headResp.status === 204) {
        if (duplicateAction === "warn") return { duplicate: true, url: publicUrl }
        if (duplicateAction === "reuse") return { url: publicUrl }
      }
    } catch { /* ignore, proceed with upload */ }
  }

  // 逐段 MKCOL：依次创建每一级目录（201 = 创建成功；405 = 已存在；均继续）
  const resolvedPath = resolveCustomPath((webdavCustomPath ?? "").replace(/^\/+|\/+$/g, ""))
  if (resolvedPath) {
    const segments = resolvedPath.split("/")
    for (let i = 1; i <= segments.length; i++) {
      const dirPath = segments.slice(0, i).join("/")
      try {
        await requestUrl({ url: `${base}/${dirPath}`, method: "MKCOL", headers: { Authorization: basicAuth }, throw: false })
      } catch { /* ignore */ }
    }
  }

  // PUT：上传文件体
  let status: number
  try {
    const resp = await requestUrl({
      url: uploadUrl,
      method: "PUT",
      headers: { Authorization: basicAuth, "Content-Type": mimeType },
      body: buffer,
      throw: false,
    })
    status = resp.status
  } catch (e) {
    return { error: $("网络错误,请检查网络是否通畅") + ": " + (e as Error).message }
  }

  if (status === 200 || status === 201 || status === 204) return { url: publicUrl }
  return { error: `${$("WebDAV 上传失败")}: HTTP ${status}` }
}

/**
 * 通过 WebDAV 上传图片
 * 用于全局 WebDAV 模式（uploadMode === "webdav"）下的图片上传
 */
export async function imageUploadViaWebdav(file: TFile, plugin: CustomImageAutoUploader): Promise<ImageUploadResult> {
  if (!IMAGE_EXTENSIONS.includes(file.extension)) {
    return { err: true, msg: $("上传文件不是允许的图片类型") }
  }

  const webdavUrl = plugin.settings.webdavUrl?.trim() ?? ""
  if (!webdavUrl) {
    return { err: true, msg: $("WebDAV 地址未配置") }
  }

  let body: ArrayBuffer
  try {
    body = await plugin.app.vault.readBinary(file)
  } catch (e) {
    return { err: true, msg: $("图片文件创建失败:") + (e as Error).message }
  }

  const mimeType = `image/${file.extension}`
  const duplicateAction = plugin.settings.duplicateWebdavAction ?? "overwrite"
  const result = await webdavUploadFile(
    body,
    file.name,
    mimeType,
    webdavUrl,
    plugin.settings.webdavCustomPath ?? "",
    plugin.settings.webdavPublicUrlPrefix ?? "",
    plugin.settings.webdavUser ?? "",
    plugin.settings.webdavPassword ?? "",
    duplicateAction
  )

  if ("duplicate" in result) {
    return { err: true, msg: $("同名文件已存在，已跳过上传") }
  }
  if ("error" in result) {
    return { err: true, msg: result.error }
  }

  if (plugin.settings.isDeleteSource) {
    plugin.app.fileManager.trashFile(file)
  }

  return { err: false, msg: "success", imageUrl: result.url }
}

export async function videoUpload(file: TFile, plugin: CustomImageAutoUploader): Promise<VideoUploadResult> {
  const ext = file.extension.toLowerCase()

  // 校验格式
  if (!VIDEO_EXTENSIONS.includes(ext)) {
    return { err: true, msg: $("上传文件不是允许的视频类型") }
  }

  // 校验文件大小
  const fileSizeMB = file.stat.size / (1024 * 1024)
  if (fileSizeMB > plugin.settings.maxVideoSizeMB) {
    return {
      err: true,
      msg: `${file.name} (${fileSizeMB.toFixed(2)} MB) ${$("超出视频大小限制")} ${plugin.settings.maxVideoSizeMB} MB`,
      sizeExceeded: true,
      fileName: file.name,
      fileSize: fileSizeMB,
    }
  }

  const mimeType = VIDEO_MIME_TYPES[ext] ?? `video/${ext}`
  const authToken = plugin.settings.apiToken ?? ""

  // 确定实际上传方式：全局 webdav 模式 → webdav；否则取 videoUploadType
  const uploadMode = plugin.settings.uploadMode ?? "gateway"
  const uploadType = uploadMode === "webdav" ? "webdav" : (plugin.settings.videoUploadType ?? "api")

  // ══════════════════════════════════════════════════
  // WebDAV 直传模式（全局 webdav 或 gateway + webdav video）
  // ══════════════════════════════════════════════════
  if (uploadType === "webdav") {
    const webdavUrl = plugin.settings.webdavUrl?.trim() ?? ""
    if (!webdavUrl) {
      return { err: true, msg: $("WebDAV 地址未配置") }
    }
    const webdavCustomPath = plugin.settings.webdavCustomPath ?? ""
    const webdavPublicUrlPrefix = plugin.settings.webdavPublicUrlPrefix ?? ""
    const webdavUser = plugin.settings.webdavUser ?? ""
    const webdavPassword = plugin.settings.webdavPassword ?? ""
    const duplicateAction = plugin.settings.duplicateWebdavAction ?? "overwrite"

    // ── 同名文件检查（非覆盖模式）────────────────────────
    if (duplicateAction !== "overwrite") {
      const { uploadUrl: videoUploadUrl, publicUrl: videoPublicUrl } = computeWebdavTargetUrls(file.name, webdavUrl, webdavCustomPath, webdavPublicUrlPrefix)
      const { publicUrl: posterPublicUrl } = computeWebdavTargetUrls(`${file.basename}_poster.jpg`, webdavUrl, webdavCustomPath, webdavPublicUrlPrefix)
      const basicAuth = `Basic ${btoa(unescape(encodeURIComponent(`${webdavUser}:${webdavPassword}`)))}`
      try {
        const headResp = await requestUrl({ url: videoUploadUrl, method: "HEAD", headers: { Authorization: basicAuth }, throw: false })
        if (headResp.status === 200 || headResp.status === 204) {
          if (duplicateAction === "warn") {
            return { err: true, msg: $("同名文件已存在，已跳过上传") }
          }
          if (duplicateAction === "reuse") {
            if (plugin.settings.isDeleteSource) plugin.app.fileManager.trashFile(file)
            return { err: false, msg: "success", videoUrl: videoPublicUrl, posterUrl: posterPublicUrl }
          }
        }
      } catch { /* ignore, proceed with upload */ }
    }

    // ── Step 1: 生成并上传 poster（WebDAV）──────────────
    let posterUrl = ""
    const posterBuffer = await generateVideoPoster(file, plugin)
    if (posterBuffer) {
      const posterResult = await webdavUploadFile(
        posterBuffer,
        `${file.basename}_poster.jpg`,
        "image/jpeg",
        webdavUrl,
        webdavCustomPath,
        webdavPublicUrlPrefix,
        webdavUser,
        webdavPassword,
        duplicateAction
      )
      if ("url" in posterResult) posterUrl = posterResult.url
      // poster 失败不阻断视频上传
    }

    // ── Step 2: 读取并上传视频（WebDAV）─────────────────
    let videoBody: ArrayBuffer
    try {
      videoBody = await plugin.app.vault.readBinary(file)
    } catch (e) {
      return { err: true, msg: $("视频文件读取失败:") + (e as Error).message }
    }

    const videoResult = await webdavUploadFile(
      videoBody,
      file.name,
      mimeType,
      webdavUrl,
      webdavCustomPath,
      webdavPublicUrlPrefix,
      webdavUser,
      webdavPassword,
      duplicateAction
    )
    if ("error" in videoResult) {
      return { err: true, msg: videoResult.error }
    }

    if (plugin.settings.isDeleteSource) {
      plugin.app.fileManager.trashFile(file)
    }
    return { err: false, msg: "success", videoUrl: videoResult.url, posterUrl }
  }

  // ══════════════════════════════════════════════════
  // API 网关模式（Custom Image Gateway 协议）
  // ══════════════════════════════════════════════════
  const apiHeaders = authToken ? new Headers({ Authorization: authToken }) : new Headers()
  // poster 走图片 API（Custom Image Gateway 支持图片）
  const imageApiUrl = plugin.settings.api
  // 视频走独立 videoApi，未配置时 fallback 到图片 API
  const videoApiUrl = plugin.settings.videoApi?.trim() || plugin.settings.api

  // ── Step 1: 生成并上传 poster（API）─────────────────
  let posterUrl = ""
  const posterBuffer = await generateVideoPoster(file, plugin)
  if (posterBuffer) {
    try {
      const posterForm = new FormData()
      posterForm.append(
        "imagefile",
        new Blob([posterBuffer], { type: "image/jpeg" }),
        `${file.basename}_poster.jpg`
      )
      const posterResp = await fetch(imageApiUrl, { method: "POST", headers: apiHeaders, body: posterForm })
      if (posterResp.ok) {
        const posterJson = await posterResp.json()
        if (posterJson?.status && posterJson?.data?.imageUrl) {
          posterUrl = posterJson.data.imageUrl
        }
      }
    } catch {
      // poster 失败不阻断视频上传
    }
  }

  // ── Step 2: 上传视频（API）──────────────────────────
  let videoBody: ArrayBuffer
  try {
    videoBody = await plugin.app.vault.readBinary(file)
  } catch (e) {
    return { err: true, msg: $("视频文件读取失败:") + (e as Error).message }
  }

  const videoForm = new FormData()
  videoForm.append("imagefile", new Blob([videoBody], { type: mimeType }), file.name)

  let response: Response
  try {
    response = await fetch(videoApiUrl, { method: "POST", headers: apiHeaders, body: videoForm })
  } catch {
    return { err: true, msg: $("网络错误,请检查网络是否通畅") }
  }

  if (!response.ok) {
    return { err: true, msg: $("网络错误,请检查网络是否通畅") }
  }

  let result: any
  try {
    result = await response.json()
  } catch {
    return { err: true, msg: $("视频上传响应解析失败") }
  }

  if (!result?.status) {
    const details = Array.isArray(result?.details) ? result.details.join("") : ""
    return { err: true, msg: `API Error: ${result?.message ?? "unknown"}${details}` }
  }

  if (plugin.settings.isDeleteSource) {
    plugin.app.fileManager.trashFile(file)
  }
  return { err: false, msg: result.message, videoUrl: result.data.imageUrl, posterUrl }
}

export function setMenu(menu: Menu, plugin: CustomImageAutoUploader, isShowAuto: boolean = false, isNoteMenu: boolean = false) {
  if ((menu as any)._hasImageUploaderMenu) return
  (menu as any)._hasImageUploaderMenu = true

  if (isShowAuto) {

    //ddddd

    menu.addSeparator()
    menu.addItem((item: MenuItem) => {
      item
        .setIcon("arrow-down-up")
        .setTitle($("一键上下传照片"))
        .onClick(async () => {
          plugin.resetStatus("all", true)
          await plugin.ContentImageAutoHandle(true)
          await plugin.MetadataImageAutoHandle(true)
          showTaskNotice(plugin, "all")
          statusCheck(plugin)
        })
    })
  }
  menu.addItem((item: MenuItem) => {
    item
      .setIcon("download")
      .setTitle($("下载当前笔记图片"))
      .onClick(async () => {
        plugin.resetStatus("download", true)
        await plugin.ContentDownImage()
        await plugin.MetadataDownImage()
        showTaskNotice(plugin, "download")
        statusCheck(plugin)
      })
  })
  menu.addItem((item: MenuItem) => {
    item
      .setIcon("upload")
      .setTitle($("上传当前笔记图片"))
      .onClick(async () => {
        plugin.resetStatus("upload", true)
        await plugin.ContentUploadImage()
        await plugin.MetadataUploadImage()
        showTaskNotice(plugin, "upload")
        statusCheck(plugin)
      })
  })

  if (!isNoteMenu) {

    menu.addSeparator()

    menu.addItem((item: MenuItem) => {
      item
        .setIcon("download-cloud")
        .setTitle($("下载全库图片"))
        .onClick(async () => {
          plugin.resetStatus("download", true)
          await plugin.VaultDownImage()
          showTaskNotice(plugin, "download")
          statusCheck(plugin)
        })
    })
    menu.addItem((item: MenuItem) => {
      item
        .setIcon("upload-cloud")
        .setTitle($("上传全库图片"))
        .onClick(async () => {
          plugin.resetStatus("upload", true)
          await plugin.VaultUploadImage()
          showTaskNotice(plugin, "upload")
          statusCheck(plugin)
        })
    })

    menu.addItem((item: MenuItem) => {
      item
        .setIcon("trash")
        .setTitle($("删除未引用图片（全库）"))
        .onClick(async () => {
          await plugin.VaultDeleteUnreferencedImages()
        })
    })
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Media Manager utilities
// ══════════════════════════════════════════════════════════════════════════════

export interface UploadedMediaItem {
  id: string
  matchText: string
  url: string
  posterUrl?: string
  fileName: string
  mediaType: "image" | "video"
  notePath: string
  noteFile: TFile
}

function urlMatchesConfig(url: string, prefixes: string[], domains: string[]): boolean {
  for (const prefix of prefixes) {
    if (url.startsWith(prefix + "/") || url === prefix) return true
  }
  try {
    const hostname = new URL(url).hostname
    for (const domain of domains) {
      if (hostname === domain || hostname.endsWith("." + domain)) return true
    }
  } catch { /* invalid URL */ }
  return false
}

export function extractFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    return decodeURIComponent(pathname.split("/").pop() ?? "") || url
  } catch {
    return url.split("/").pop()?.split("?")[0] ?? url
  }
}

/**
 * Derive the set of URL prefixes / domains that identify "uploaded" media
 * based on the current plugin settings (WebDAV public prefix + excludeDomains).
 */
export function getUploadedMediaConfig(plugin: CustomImageAutoUploader): {
  prefixes: string[]
  domains: string[]
} {
  const prefixes: string[] = []
  const domains: string[] = []

  const pubPrefix = plugin.settings.webdavPublicUrlPrefix?.trim()
  if (pubPrefix) {
    prefixes.push(pubPrefix.replace(/\/+$/, ""))
  }

  // Auto-derive from webdavUrl when no explicit public prefix is set
  const webdavUrl = plugin.settings.webdavUrl?.trim()
  if (webdavUrl && !pubPrefix) {
    const derived = webdavUrl.replace(/\/+$/, "").replace(/\/dav(?=\/|$)/, "/d")
    if (derived !== webdavUrl.replace(/\/+$/, "")) {
      prefixes.push(derived)
    }
  }

  // Hostnames from excludeDomains list (these are domains of already-uploaded images)
  const excluded = (plugin.settings.excludeDomains ?? "")
    .split("\n")
    .map((d) => d.trim())
    .filter((d) => d && !d.startsWith("#"))
  for (const d of excluded) {
    const host = d.replace(/^\*\./, "").replace(/\*/g, "")
    if (host) domains.push(host)
  }

  return { prefixes, domains }
}

/**
 * Scan Markdown content for uploaded media items (images + videos) whose URLs
 * match the configured upload destinations.
 */
export function extractUploadedMediaItems(
  content: string,
  noteFile: TFile,
  prefixes: string[],
  domains: string[]
): UploadedMediaItem[] {
  const items: UploadedMediaItem[] = []
  let counter = 0
  const seen = new Set<string>()

  const matches = (url: string) => urlMatchesConfig(url, prefixes, domains)
  const makeId = () => `${noteFile.path}::${counter++}`

  // 1. Markdown images: ![alt](https://url) — with optional ?random suffix
  const mdImageRe = /!\[([^\]]*)\]\((https?:\/\/[^\s)"]+?)(?:\s+"[^"]*")?\)/g
  for (const m of content.matchAll(mdImageRe)) {
    const rawUrl = m[2]
    if (!matches(rawUrl) || seen.has(m[0])) continue
    seen.add(m[0])
    items.push({
      id: makeId(),
      matchText: m[0],
      url: rawUrl,
      fileName: extractFilenameFromUrl(rawUrl),
      mediaType: "image",
      notePath: noteFile.path,
      noteFile,
    })
  }

  // 2. HTML <img src="..."> tags
  const htmlImgRe = /<img\b[^>]+?\bsrc="(https?:\/\/[^"]+)"[^>]*\/?>/gi
  for (const m of content.matchAll(htmlImgRe)) {
    const rawUrl = m[1]
    if (!matches(rawUrl) || seen.has(m[0])) continue
    seen.add(m[0])
    items.push({
      id: makeId(),
      matchText: m[0],
      url: rawUrl,
      fileName: extractFilenameFromUrl(rawUrl),
      mediaType: "image",
      notePath: noteFile.path,
      noteFile,
    })
  }

  // 3. HTML <video ...poster="..."><source src="..."></video> blocks
  const videoBlockRe = /<video\b([^>]*)>([\s\S]*?)<\/video>/gi
  for (const m of content.matchAll(videoBlockRe)) {
    const attrs = m[1]
    const inner = m[2]
    const posterMatch = attrs.match(/\bposter="(https?:\/\/[^"]+)"/)
    const posterUrl = posterMatch?.[1]
    const srcMatch = inner.match(/<source\b[^>]+?\bsrc="(https?:\/\/[^"]+)"/)
    if (!srcMatch) continue
    const videoUrl = srcMatch[1]
    if (!matches(videoUrl) && !(posterUrl && matches(posterUrl))) continue
    if (seen.has(m[0])) continue
    seen.add(m[0])
    items.push({
      id: makeId(),
      matchText: m[0],
      url: videoUrl,
      posterUrl,
      fileName: extractFilenameFromUrl(videoUrl),
      mediaType: "video",
      notePath: noteFile.path,
      noteFile,
    })
  }

  return items
}

/** Return the effective public URL prefix (explicit config or auto-derived from webdavUrl). */
export function getEffectivePublicPrefix(plugin: CustomImageAutoUploader): string {
  const explicit = plugin.settings.webdavPublicUrlPrefix?.trim()
  if (explicit) return explicit.replace(/\/+$/, "")
  return (plugin.settings.webdavUrl ?? "").replace(/\/+$/, "").replace(/\/dav(?=\/|$)/, "/d")
}

/** Convert a public-access file URL back to its internal WebDAV URL for server-side operations. */
export function publicUrlToWebdavUrl(
  fileUrl: string,
  publicPrefix: string,
  webdavBase: string
): string | null {
  const cleanPrefix = publicPrefix.replace(/\/+$/, "")
  const cleanBase = webdavBase.replace(/\/+$/, "")
  if (!fileUrl.startsWith(cleanPrefix + "/") && fileUrl !== cleanPrefix) return null
  const relPath = fileUrl.slice(cleanPrefix.length).replace(/^\/+/, "")
  return `${cleanBase}/${relPath}`
}

/** Send a WebDAV DELETE request for a single file. */
export async function webdavDeleteRemoteFile(
  webdavFileUrl: string,
  basicAuth: string
): Promise<{ ok: true } | { notFound: true } | { error: string }> {
  try {
    const resp = await requestUrl({
      url: webdavFileUrl,
      method: "DELETE",
      headers: { Authorization: basicAuth },
      throw: false,
    })
    if (resp.status === 204 || resp.status === 200) return { ok: true }
    if (resp.status === 404) return { notFound: true }
    return { error: `HTTP ${resp.status}` }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

/** Fetch the file size of a remote WebDAV resource via PROPFIND. Returns null on failure. */
export async function webdavGetRemoteFileSize(
  webdavFileUrl: string,
  basicAuth: string
): Promise<number | null> {
  try {
    const body = `<?xml version="1.0" encoding="UTF-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:getcontentlength/></D:prop></D:propfind>`
    const resp = await requestUrl({
      url: webdavFileUrl,
      method: "PROPFIND",
      headers: {
        Authorization: basicAuth,
        "Content-Type": "text/xml; charset=utf-8",
        Depth: "0",
      },
      body,
      throw: false,
    })
    if (resp.status !== 207) return null
    const m = resp.text.match(
      /<(?:[a-z]+:)?getcontentlength[^>]*>(\d+)<\/(?:[a-z]+:)?getcontentlength>/i
    )
    return m ? parseInt(m[1], 10) : null
  } catch {
    return null
  }
}

/** Format a byte count as a human-readable string. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

// ── Remote WebDAV scan ────────────────────────────────────────────────────────

export interface RemoteMediaFile {
  href: string
  webdavUrl: string
  publicUrl: string
  fileName: string
  size: number
  contentType: string
  mediaType: "image" | "video"
  referencedBy: string[]
}

const MEDIA_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "bmp", "svg"])
const MEDIA_VIDEO_EXTS = new Set(["mp4", "mov", "avi", "mkv", "webm", "m4v"])

function mediaTypeFromEntry(contentType: string, fileName: string): "image" | "video" | "unknown" {
  if (contentType.startsWith("image/")) return "image"
  if (contentType.startsWith("video/")) return "video"
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  if (MEDIA_IMAGE_EXTS.has(ext)) return "image"
  if (MEDIA_VIDEO_EXTS.has(ext)) return "video"
  return "unknown"
}

interface PropfindEntry {
  href: string
  isDir: boolean
  size: number
  contentType: string
}

function parsePropfindXml(xml: string): PropfindEntry[] {
  const entries: PropfindEntry[] = []
  const responseRe = /<[^>]*:?response\b[^>]*>([\s\S]*?)<\/[^>]*:?response>/gi
  for (const block of xml.matchAll(responseRe)) {
    const inner = block[1]
    const hrefMatch = inner.match(/<[^>]*:?href[^>]*>([\s\S]*?)<\/[^>]*:?href>/i)
    if (!hrefMatch) continue
    const href = decodeURIComponent(hrefMatch[1].trim())
    const isDir = /<[^>]*:?collection\b/i.test(inner)
    const sizeMatch = inner.match(/<[^>]*:?getcontentlength[^>]*>(\d+)<\/[^>]*:?getcontentlength>/i)
    const typeMatch = inner.match(/<[^>]*:?getcontenttype[^>]*>([^<]+)<\/[^>]*:?getcontenttype>/i)
    entries.push({
      href,
      isDir,
      size: sizeMatch ? parseInt(sizeMatch[1], 10) : 0,
      contentType: typeMatch ? typeMatch[1].trim().split(";")[0].trim() : "",
    })
  }
  return entries
}

async function propfindDir(
  url: string,
  basicAuth: string,
  propfindBody: string,
  depth: string
): Promise<PropfindEntry[] | { error: string }> {
  try {
    const resp = await requestUrl({
      url: url.endsWith("/") ? url : url + "/",
      method: "PROPFIND",
      headers: { Authorization: basicAuth, "Content-Type": "text/xml; charset=utf-8", Depth: depth },
      body: propfindBody,
      throw: false,
    })
    if (resp.status !== 207) return { error: `HTTP ${resp.status}` }
    return parsePropfindXml(resp.text)
  } catch (e) {
    return { error: (e as Error).message }
  }
}

async function scanDirRecursive(
  dirUrl: string,
  basicAuth: string,
  propfindBody: string,
  webdavBase: string,
  publicBase: string,
  results: RemoteMediaFile[],
  depth: number
): Promise<{ error: string } | null> {
  if (depth <= 0) return null
  const entries = await propfindDir(dirUrl, basicAuth, propfindBody, "1")
  if ("error" in entries) return entries

  const dirHref = new URL(dirUrl).pathname.replace(/\/?$/, "/")

  for (const entry of entries) {
    // skip the directory itself
    const entryPath = entry.href.replace(/\/?$/, entry.isDir ? "/" : "")
    if (entryPath === dirHref || entry.href === dirHref.replace(/\/$/, "")) continue

    const fullUrl = new URL(entry.href, webdavBase + "/").href

    if (entry.isDir) {
      const sub = await scanDirRecursive(fullUrl, basicAuth, propfindBody, webdavBase, publicBase, results, depth - 1)
      if (sub) return sub
    } else {
      const fileName = decodeURIComponent(entry.href.split("/").pop() ?? "")
      const mt = mediaTypeFromEntry(entry.contentType, fileName)
      if (mt === "unknown") continue

      // Compute public URL: replace webdavBase path with publicBase path
      const webdavBasePath = new URL(webdavBase).pathname.replace(/\/?$/, "")
      const relPath = entry.href.startsWith(webdavBasePath)
        ? entry.href.slice(webdavBasePath.length).replace(/^\//, "")
        : decodeURIComponent(entry.href).replace(/^\//, "")
      const publicUrl = `${publicBase}/${relPath}`

      results.push({
        href: entry.href,
        webdavUrl: fullUrl,
        publicUrl,
        fileName,
        size: entry.size,
        contentType: entry.contentType,
        mediaType: mt,
        referencedBy: [],
      })
    }
  }
  return null
}

/**
 * Scan the configured WebDAV server for all media files.
 * Tries Depth: infinity first; falls back to recursive Depth: 1 if server rejects it.
 */
export async function scanRemoteWebdavFiles(
  plugin: CustomImageAutoUploader,
  basicAuth: string
): Promise<RemoteMediaFile[] | { error: string }> {
  const webdavBase = plugin.settings.webdavUrl?.trim()
  if (!webdavBase) return { error: $("WebDAV 地址未配置") }

  const cleanBase = webdavBase.replace(/\/+$/, "")
  const publicBase = getEffectivePublicPrefix(plugin)

  const propfindBody = `<?xml version="1.0" encoding="UTF-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:getcontentlength/><D:getcontenttype/><D:resourcetype/></D:prop></D:propfind>`

  // Try Depth: infinity first
  try {
    const resp = await requestUrl({
      url: cleanBase + "/",
      method: "PROPFIND",
      headers: { Authorization: basicAuth, "Content-Type": "text/xml; charset=utf-8", Depth: "infinity" },
      body: propfindBody,
      throw: false,
    })
    if (resp.status === 207) {
      const entries = parsePropfindXml(resp.text)
      const results: RemoteMediaFile[] = []
      const webdavBasePath = new URL(cleanBase).pathname.replace(/\/?$/, "")
      for (const entry of entries) {
        if (entry.isDir) continue
        const fileName = decodeURIComponent(entry.href.split("/").pop() ?? "")
        const mt = mediaTypeFromEntry(entry.contentType, fileName)
        if (mt === "unknown") continue
        const relPath = entry.href.startsWith(webdavBasePath)
          ? entry.href.slice(webdavBasePath.length).replace(/^\//, "")
          : decodeURIComponent(entry.href).replace(/^\//, "")
        results.push({
          href: entry.href,
          webdavUrl: new URL(entry.href, cleanBase + "/").href,
          publicUrl: `${publicBase}/${relPath}`,
          fileName,
          size: entry.size,
          contentType: entry.contentType,
          mediaType: mt,
          referencedBy: [],
        })
      }
      return results
    }
    // Fall through to recursive scan if not 207
  } catch { /* fall through */ }

  // Recursive Depth: 1 fallback
  const results: RemoteMediaFile[] = []
  const err = await scanDirRecursive(cleanBase, basicAuth, propfindBody, cleanBase, publicBase, results, 10)
  if (err) return err
  return results
}

/**
 * Scan the entire vault for uploaded media URLs and return a Map<url, notePaths[]>.
 * Used to cross-reference remote files with local notes.
 */
export async function buildVaultMediaUrlIndex(
  plugin: CustomImageAutoUploader
): Promise<Map<string, string[]>> {
  const { prefixes, domains } = getUploadedMediaConfig(plugin)
  const index = new Map<string, string[]>()

  const files = plugin.app.vault.getMarkdownFiles()
  for (const file of files) {
    const content = await plugin.app.vault.read(file)
    const items = extractUploadedMediaItems(content, file, prefixes, domains)
    for (const item of items) {
      const addUrl = (u: string) => {
        const list = index.get(u) ?? []
        if (!list.includes(file.path)) list.push(file.path)
        index.set(u, list)
      }
      addUrl(item.url)
      if (item.posterUrl) addUrl(item.posterUrl)
    }
  }
  return index
}
