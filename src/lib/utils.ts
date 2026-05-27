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
  webdavPassword: string
): Promise<{ url: string } | { error: string }> {
  // 解析路径占位符，去掉首尾 /
  const resolvedPath = resolveCustomPath((webdavCustomPath ?? "").replace(/^\/+|\/+$/g, ""))
  const base = webdavUrl.replace(/\/+$/, "")
  // 公共访问地址前缀：优先使用用户配置，否则将 /dav → /d（OpenList/AList 惯例）
  const publicBase = (webdavPublicUrlPrefix?.trim()
    ? webdavPublicUrlPrefix.replace(/\/+$/, "")
    : base.replace(/\/dav(?=\/|$)/, "/d"))

  // Basic Auth（支持 Unicode 用户名/密码）
  const basicAuth = `Basic ${btoa(unescape(encodeURIComponent(`${webdavUser}:${webdavPassword}`)))}`

  // 逐段 MKCOL：依次创建每一级目录
  // 201 = 目录创建成功；405 = 目录已存在；均视为正常，继续上传
  if (resolvedPath) {
    const segments = resolvedPath.split("/")
    for (let i = 1; i <= segments.length; i++) {
      const dirPath = segments.slice(0, i).join("/")
      try {
        await requestUrl({
          url: `${base}/${dirPath}`,
          method: "MKCOL",
          headers: { Authorization: basicAuth },
          throw: false,
        })
      } catch {
        // 网络异常时忽略，PUT 会给出更明确的错误
      }
    }
  }

  const remotePath = resolvedPath ? `${resolvedPath}/${fileName}` : fileName
  const uploadUrl = `${base}/${remotePath}`
  const publicUrl = `${publicBase}/${remotePath}`

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

  // 201 Created / 204 No Content / 200 OK 均视为成功
  if (status === 200 || status === 201 || status === 204) {
    return { url: publicUrl }
  }
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
  const result = await webdavUploadFile(
    body,
    file.name,
    mimeType,
    webdavUrl,
    plugin.settings.webdavCustomPath ?? "",
    plugin.settings.webdavPublicUrlPrefix ?? "",
    plugin.settings.webdavUser ?? "",
    plugin.settings.webdavPassword ?? ""
  )

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
        webdavPassword
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
      webdavPassword
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
