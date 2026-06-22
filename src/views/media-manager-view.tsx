import { ItemView, WorkspaceLeaf, TFile, Notice } from "obsidian"
import { createRoot, Root } from "react-dom/client"
import * as React from "react"
import { useState, useCallback } from "react"

import CustomImageAutoUploader from "../main"
import { $ } from "../lang/lang"
import {
  UploadedMediaItem,
  extractUploadedMediaItems,
  getUploadedMediaConfig,
  getEffectivePublicPrefix,
  publicUrlToWebdavUrl,
  webdavDeleteRemoteFile,
  webdavGetRemoteFileSize,
  formatFileSize,
  extractFilenameFromUrl,
} from "../lib/utils"

export const MEDIA_MANAGER_VIEW_TYPE = "custom-media-manager"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScanResult extends UploadedMediaItem {
  size?: number
  sizeLoading: boolean
  deleting: boolean
  deleted: boolean
  deleteError?: string
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface MediaManagerPanelProps {
  plugin: CustomImageAutoUploader
}

function MediaManagerPanel({ plugin }: MediaManagerPanelProps) {
  const [mode, setMode] = useState<"current" | "vault">("current")
  const [items, setItems] = useState<ScanResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [deleteRemote, setDeleteRemote] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const isWebdavMode = (plugin.settings.uploadMode ?? "gateway") === "webdav"
  const canDeleteRemote = isWebdavMode && !!plugin.settings.webdavUrl?.trim()

  const getAuth = useCallback((): string => {
    const u = plugin.settings.webdavUser ?? ""
    const p = plugin.settings.webdavPassword ?? ""
    return `Basic ${btoa(unescape(encodeURIComponent(`${u}:${p}`)))}`
  }, [plugin.settings])

  // ── Load remote file sizes (background, WebDAV only) ────────────────────────
  const loadSizes = useCallback(
    async (scanItems: ScanResult[]) => {
      if (!canDeleteRemote) return
      const publicPrefix = getEffectivePublicPrefix(plugin)
      const webdavBase = plugin.settings.webdavUrl?.trim() ?? ""
      const auth = getAuth()

      for (const item of scanItems) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, sizeLoading: true } : i))
        )
        const wdUrl = publicUrlToWebdavUrl(item.url, publicPrefix, webdavBase)
        const size = wdUrl ? await webdavGetRemoteFileSize(wdUrl, auth) : null
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, size: size ?? undefined, sizeLoading: false } : i
          )
        )
      }
    },
    [canDeleteRemote, plugin, getAuth]
  )

  // ── Scan ─────────────────────────────────────────────────────────────────────
  const scan = useCallback(async () => {
    const { prefixes, domains } = getUploadedMediaConfig(plugin)
    if (prefixes.length === 0 && domains.length === 0) {
      setStatusMsg($("未配置上传域名，无法扫描"))
      setItems([])
      return
    }

    setScanning(true)
    setStatusMsg(null)
    setItems([])

    try {
      let found: ScanResult[] = []

      if (mode === "current") {
        const activeFile = plugin.app.workspace.getActiveFile()
        if (!activeFile || activeFile.extension !== "md") {
          setStatusMsg($("请先打开一个 Markdown 笔记"))
          setScanning(false)
          return
        }
        const content = await plugin.app.vault.read(activeFile)
        found = extractUploadedMediaItems(content, activeFile, prefixes, domains).map(
          (item) => ({ ...item, sizeLoading: false, deleting: false, deleted: false })
        )
      } else {
        const files = plugin.app.vault.getMarkdownFiles()
        for (const file of files) {
          const content = await plugin.app.vault.read(file)
          found.push(
            ...extractUploadedMediaItems(content, file, prefixes, domains).map((item) => ({
              ...item,
              sizeLoading: false,
              deleting: false,
              deleted: false,
            }))
          )
        }
      }

      setItems(found)
      setStatusMsg(found.length === 0 ? $("未找到已上传媒体文件") : null)

      if (canDeleteRemote && found.length > 0) {
        loadSizes(found)
      }
    } finally {
      setScanning(false)
    }
  }, [mode, plugin, canDeleteRemote, loadSizes])

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteItem = useCallback(
    async (item: ScanResult) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, deleting: true, deleteError: undefined } : i
        )
      )

      try {
        // 1. Remove match text from the MD file
        const content = await plugin.app.vault.read(item.noteFile)
        const newContent = content
          .split(item.matchText)
          .join("")
          .replace(/\n{3,}/g, "\n\n")
        await plugin.app.vault.modify(item.noteFile, newContent)

        // 2. Optionally delete from WebDAV
        let remoteNote = ""
        if (deleteRemote && canDeleteRemote) {
          const publicPrefix = getEffectivePublicPrefix(plugin)
          const webdavBase = plugin.settings.webdavUrl?.trim() ?? ""
          const auth = getAuth()
          const urlsToDelete = [item.url, item.posterUrl].filter((u): u is string => !!u)
          const errs: string[] = []

          for (const url of urlsToDelete) {
            const wdUrl = publicUrlToWebdavUrl(url, publicPrefix, webdavBase)
            if (wdUrl) {
              const result = await webdavDeleteRemoteFile(wdUrl, auth)
              if ("error" in result) {
                errs.push(`${extractFilenameFromUrl(url)}: ${result.error}`)
              }
            }
          }

          remoteNote =
            errs.length > 0
              ? `\n❌ ${$("远端文件删除失败")}: ${errs.join(", ")}`
              : `\n✅ ${$("远端文件删除成功")}`
        }

        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, deleting: false, deleted: true } : i))
        )
        new Notice(`✅ ${$("MD 链接删除成功")}${remoteNote}`)
      } catch (e) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, deleting: false, deleteError: (e as Error).message }
              : i
          )
        )
        new Notice(`❌ ${(e as Error).message}`)
      }
    },
    [deleteRemote, canDeleteRemote, plugin, getAuth]
  )

  const openNote = useCallback(
    async (noteFile: TFile) => {
      const leaf = plugin.app.workspace.getLeaf(false)
      await leaf.openFile(noteFile)
    },
    [plugin]
  )

  // ── Group by note (vault mode) ────────────────────────────────────────────────
  const noteGroups =
    mode === "vault"
      ? items.reduce<Record<string, ScanResult[]>>((acc, item) => {
          if (!acc[item.notePath]) acc[item.notePath] = []
          acc[item.notePath].push(item)
          return acc
        }, {})
      : null

  const visibleCount = items.filter((i) => !i.deleted).length

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="media-manager-root">

      {/* Toolbar */}
      <div className="media-manager-toolbar">
        <div className="media-manager-tabs">
          <button
            className={`media-manager-tab${mode === "current" ? " is-active" : ""}`}
            onClick={() => { setMode("current"); setItems([]); setStatusMsg(null) }}
          >
            {$("当前笔记")}
          </button>
          <button
            className={`media-manager-tab${mode === "vault" ? " is-active" : ""}`}
            onClick={() => { setMode("vault"); setItems([]); setStatusMsg(null) }}
          >
            {$("全库扫描")}
          </button>
        </div>
        <button
          className="media-manager-scan-btn mod-cta"
          onClick={scan}
          disabled={scanning}
        >
          {scanning ? $("正在扫描...") : $("扫描")}
        </button>
      </div>

      {/* Remote-delete toggle — WebDAV mode only */}
      {canDeleteRemote && (
        <label className="media-manager-remote-toggle">
          <input
            type="checkbox"
            checked={deleteRemote}
            onChange={(e) => setDeleteRemote(e.target.checked)}
          />
          <span>{$("同时删除远端文件")}</span>
        </label>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <div className="media-manager-summary">
          {visibleCount}
          {mode === "vault" && noteGroups
            ? ` / ${Object.keys(noteGroups).length} 个文件`
            : " 个媒体"}
        </div>
      )}

      {/* Status */}
      {statusMsg && <div className="media-manager-status">{statusMsg}</div>}

      {/* List */}
      <div className="media-manager-list">
        {mode === "vault" && noteGroups
          ? Object.entries(noteGroups).map(([notePath, groupItems]) => {
              const visible = groupItems.filter((i) => !i.deleted)
              if (visible.length === 0) return null
              return (
                <div key={notePath} className="media-manager-group">
                  {/* Clickable note header */}
                  <button
                    className="media-manager-group-header"
                    onClick={() => openNote(groupItems[0].noteFile)}
                    title={notePath}
                  >
                    <span className="media-manager-group-icon">📄</span>
                    <span className="media-manager-group-path">{notePath}</span>
                    <span className="media-manager-group-count">{visible.length}</span>
                  </button>
                  {groupItems.map((item) => (
                    <MediaItemRow
                      key={item.id}
                      item={item}
                      showOpenBtn={false}
                      onDelete={() => deleteItem(item)}
                      onOpenNote={() => openNote(item.noteFile)}
                    />
                  ))}
                </div>
              )
            })
          : items.map((item) => (
              <MediaItemRow
                key={item.id}
                item={item}
                showOpenBtn={false}
                onDelete={() => deleteItem(item)}
                onOpenNote={() => openNote(item.noteFile)}
              />
            ))}
      </div>
    </div>
  )
}

// ── Item row ──────────────────────────────────────────────────────────────────

interface MediaItemRowProps {
  item: ScanResult
  showOpenBtn: boolean
  onDelete: () => void
  onOpenNote: () => void
}

function MediaItemRow({ item, showOpenBtn, onDelete, onOpenNote }: MediaItemRowProps) {
  if (item.deleted) return null

  return (
    <div className={`media-manager-item${item.deleting ? " is-deleting" : ""}`}>
      <span className="media-manager-item-icon">
        {item.mediaType === "video" ? "🎬" : "🖼️"}
      </span>
      <div className="media-manager-item-body">
        <div className="media-manager-item-name" title={item.url}>
          {item.fileName}
        </div>
        <div className="media-manager-item-url" title={item.url}>
          {truncateUrl(item.url, 46)}
        </div>
        {(item.sizeLoading || item.size !== undefined) && (
          <div className="media-manager-item-size">
            {item.sizeLoading ? $("获取大小中...") : formatFileSize(item.size!)}
          </div>
        )}
        {item.deleteError && (
          <div className="media-manager-item-error">❌ {item.deleteError}</div>
        )}
      </div>
      <div className="media-manager-item-actions">
        {showOpenBtn && (
          <button
            className="media-manager-btn"
            onClick={onOpenNote}
            title={$("跳转到笔记")}
            aria-label={$("跳转到笔记")}
          >
            📄
          </button>
        )}
        <button
          className="media-manager-btn media-manager-btn--danger"
          onClick={onDelete}
          disabled={item.deleting}
          title={$("删除")}
          aria-label={$("删除")}
        >
          {item.deleting ? "⏳" : "🗑️"}
        </button>
      </div>
    </div>
  )
}

function truncateUrl(url: string, max: number): string {
  if (url.length <= max) return url
  return "…" + url.slice(-(max - 1))
}

// ── ItemView wrapper ──────────────────────────────────────────────────────────

export class MediaManagerView extends ItemView {
  plugin: CustomImageAutoUploader
  private reactRoot: Root | null = null

  constructor(leaf: WorkspaceLeaf, plugin: CustomImageAutoUploader) {
    super(leaf)
    this.plugin = plugin
  }

  getViewType(): string {
    return MEDIA_MANAGER_VIEW_TYPE
  }

  getDisplayText(): string {
    return $("媒体文件管理")
  }

  getIcon(): string {
    return "film"
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    const div = container.createDiv({ cls: "media-manager-container" })
    this.reactRoot = createRoot(div)
    this.reactRoot.render(<MediaManagerPanel plugin={this.plugin} />)
  }

  async onClose(): Promise<void> {
    this.reactRoot?.unmount()
    this.reactRoot = null
  }
}
