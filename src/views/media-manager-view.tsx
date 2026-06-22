import { ItemView, WorkspaceLeaf, TFile, Notice } from "obsidian"
import { createRoot, Root } from "react-dom/client"
import * as React from "react"
import { useState, useCallback } from "react"

import CustomImageAutoUploader from "../main"
import { $ } from "../lang/lang"
import {
  UploadedMediaItem,
  RemoteMediaFile,
  extractUploadedMediaItems,
  getUploadedMediaConfig,
  getEffectivePublicPrefix,
  publicUrlToWebdavUrl,
  webdavDeleteRemoteFile,
  webdavGetRemoteFileSize,
  formatFileSize,
  extractFilenameFromUrl,
  scanRemoteWebdavFiles,
  buildVaultMediaUrlIndex,
} from "../lib/utils"

export const MEDIA_MANAGER_VIEW_TYPE = "custom-media-manager"

// ── Types ─────────────────────────────────────────────────────────────────────

type PanelMode = "current" | "vault" | "remote"

interface ScanResult extends UploadedMediaItem {
  size?: number
  sizeLoading: boolean
  notFound?: boolean
  deleting: boolean
  deleted: boolean
  deleteError?: string
  referencedByNotes: string[]
}

interface PreviewTarget {
  url: string
  mediaType: "image" | "video"
  fileName: string
}

// ── Preview overlay ───────────────────────────────────────────────────────────

function PreviewModal({ target, onClose }: { target: PreviewTarget; onClose: () => void }) {
  return (
    <div className="mm-preview-overlay" onClick={onClose}>
      <div className="mm-preview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="mm-preview-close" onClick={onClose} title={$("关闭预览")}>✕</button>
        <div className="mm-preview-filename">{target.fileName}</div>
        {target.mediaType === "image" ? (
          <img className="mm-preview-img" src={target.url} alt={target.fileName} />
        ) : (
          <video className="mm-preview-video" controls>
            <source src={target.url} />
          </video>
        )}
      </div>
    </div>
  )
}

// ── Delete confirmation for multi-reference items ─────────────────────────────

function MultiRefConfirm({
  item,
  onConfirm,
  onCancel,
}: {
  item: ScanResult
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="mm-confirm">
      <div className="mm-confirm-title">⚠️ {$("该媒体被多个笔记引用")}</div>
      <div className="mm-confirm-desc">{$("确认要删除此媒体文件的所有引用吗？")}</div>
      <div className="mm-confirm-notes">
        {item.referencedByNotes.map((p) => (
          <div key={p} className="mm-confirm-note">📄 {p}</div>
        ))}
      </div>
      <div className="mm-confirm-actions">
        <button className="mm-confirm-btn" onClick={onCancel}>{$("取消")}</button>
        <button className="mm-confirm-btn mm-confirm-btn--danger" onClick={onConfirm}>{$("确认")}</button>
      </div>
    </div>
  )
}

// ── Remote file scan ──────────────────────────────────────────────────────────

interface RemoteFileScanResult extends RemoteMediaFile {
  deleting: boolean
  deleted: boolean
  deleteError?: string
  confirmingDelete: boolean
}

interface RemoteScanPanelProps {
  plugin: CustomImageAutoUploader
  getAuth: () => string
  onPreview: (target: PreviewTarget) => void
}

function RemoteScanPanel({ plugin, getAuth, onPreview }: RemoteScanPanelProps) {
  const [files, setFiles] = useState<RemoteFileScanResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [buildingIndex, setBuildingIndex] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const isWebdavConfigured = !!(plugin.settings.webdavUrl?.trim())

  const scan = useCallback(async () => {
    if (!isWebdavConfigured) {
      setStatusMsg($("未配置 WebDAV，远端扫描不可用"))
      return
    }
    setScanning(true)
    setStatusMsg(null)
    setFiles([])

    const auth = getAuth()
    const result = await scanRemoteWebdavFiles(plugin, auth)
    if ("error" in result) {
      setStatusMsg(`${$("远端扫描失败")}: ${result.error}`)
      setScanning(false)
      return
    }
    setScanning(false)
    setBuildingIndex(true)

    const index = await buildVaultMediaUrlIndex(plugin)
    const scanResults: RemoteFileScanResult[] = result.map((f) => ({
      ...f,
      referencedBy: index.get(f.publicUrl) ?? [],
      deleting: false,
      deleted: false,
      confirmingDelete: false,
    }))
    setFiles(scanResults)
    setBuildingIndex(false)

    const total = scanResults.length
    const unref = scanResults.filter((f) => f.referencedBy.length === 0).length
    setStatusMsg(`${total} ${$("远端媒体文件")}，${unref} ${$("未引用文件")}`)
  }, [plugin, getAuth, isWebdavConfigured])

  const copyLink = useCallback(async (f: RemoteFileScanResult) => {
    await navigator.clipboard.writeText(f.publicUrl)
    setCopiedUrl(f.publicUrl)
    setTimeout(() => setCopiedUrl((prev) => (prev === f.publicUrl ? null : prev)), 2000)
  }, [])

  const requestDelete = useCallback((f: RemoteFileScanResult) => {
    setFiles((prev) => prev.map((x) => x.href === f.href ? { ...x, confirmingDelete: true } : x))
  }, [])

  const cancelDelete = useCallback((f: RemoteFileScanResult) => {
    setFiles((prev) => prev.map((x) => x.href === f.href ? { ...x, confirmingDelete: false } : x))
  }, [])

  const confirmDelete = useCallback(async (f: RemoteFileScanResult) => {
    setFiles((prev) => prev.map((x) =>
      x.href === f.href ? { ...x, confirmingDelete: false, deleting: true, deleteError: undefined } : x
    ))
    const auth = getAuth()
    const result = await webdavDeleteRemoteFile(f.webdavUrl, auth)
    if ("ok" in result) {
      setFiles((prev) => prev.map((x) => x.href === f.href ? { ...x, deleting: false, deleted: true } : x))
      new Notice(`✅ ${$("远端文件删除成功")}: ${f.fileName}`)
    } else if ("notFound" in result) {
      setFiles((prev) => prev.map((x) => x.href === f.href ? { ...x, deleting: false, deleted: true } : x))
      new Notice(`⚠️ ${$("远端文件未找到")}: ${f.fileName}`)
    } else {
      setFiles((prev) => prev.map((x) =>
        x.href === f.href ? { ...x, deleting: false, deleteError: result.error } : x
      ))
      new Notice(`❌ ${$("远端文件删除失败")}: ${result.error}`)
    }
  }, [getAuth])

  if (!isWebdavConfigured) {
    return <div className="media-manager-status">{$("未配置 WebDAV，远端扫描不可用")}</div>
  }

  const visibleFiles = files.filter((f) => !f.deleted)
  const unreferenced = visibleFiles.filter((f) => f.referencedBy.length === 0)
  const referenced = visibleFiles.filter((f) => f.referencedBy.length > 0)

  return (
    <div className="mm-remote-panel">
      <div className="mm-remote-toolbar">
        <button
          className="media-manager-scan-btn mod-cta"
          onClick={scan}
          disabled={scanning || buildingIndex}
        >
          {scanning ? $("正在扫描远端...") : buildingIndex ? $("构建本地索引中...") : $("扫描远端")}
        </button>
      </div>

      {statusMsg && <div className="media-manager-status">{statusMsg}</div>}

      <div className="media-manager-list">
        {unreferenced.length > 0 && (
          <div className="mm-remote-section">
            <div className="mm-remote-section-header mm-remote-section-header--unref">
              ⚠️ {$("未引用")} ({unreferenced.length})
            </div>
            {unreferenced.map((f) => (
              <RemoteFileRow
                key={f.href}
                file={f}
                copiedUrl={copiedUrl}
                onPreview={() => onPreview({ url: f.publicUrl, mediaType: f.mediaType, fileName: f.fileName })}
                onCopy={() => copyLink(f)}
                onDelete={() => requestDelete(f)}
                onConfirmDelete={() => confirmDelete(f)}
                onCancelDelete={() => cancelDelete(f)}
              />
            ))}
          </div>
        )}

        {referenced.length > 0 && (
          <div className="mm-remote-section">
            <div className="mm-remote-section-header">
              ✅ {$("引用于")} ({referenced.length})
            </div>
            {referenced.map((f) => (
              <RemoteFileRow
                key={f.href}
                file={f}
                copiedUrl={copiedUrl}
                onPreview={() => onPreview({ url: f.publicUrl, mediaType: f.mediaType, fileName: f.fileName })}
                onCopy={() => copyLink(f)}
                onDelete={() => requestDelete(f)}
                onConfirmDelete={() => confirmDelete(f)}
                onCancelDelete={() => cancelDelete(f)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface RemoteFileRowProps {
  file: RemoteFileScanResult
  copiedUrl: string | null
  onPreview: () => void
  onCopy: () => void
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

function RemoteFileRow({ file, copiedUrl, onPreview, onCopy, onDelete, onConfirmDelete, onCancelDelete }: RemoteFileRowProps) {
  if (file.deleted) return null

  if (file.confirmingDelete) {
    return (
      <div className="media-manager-item">
        <div className="mm-confirm">
          <div className="mm-confirm-title">⚠️ {$("此操作不可恢复，确定删除远端文件？")}</div>
          <div className="mm-confirm-notes"><div className="mm-confirm-note">{file.fileName}</div></div>
          <div className="mm-confirm-actions">
            <button className="mm-confirm-btn" onClick={onCancelDelete}>{$("取消")}</button>
            <button className="mm-confirm-btn mm-confirm-btn--danger" onClick={onConfirmDelete}>{$("确认")}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`media-manager-item${file.deleting ? " is-deleting" : ""}`}>
      <span className="media-manager-item-icon">
        {file.mediaType === "video" ? "🎬" : "🖼️"}
      </span>
      <div className="media-manager-item-body">
        <div className="media-manager-item-name" title={file.publicUrl}>{file.fileName}</div>
        <div className="media-manager-item-url" title={file.publicUrl}>{truncateUrl(file.publicUrl, 46)}</div>
        {file.size > 0 && <div className="media-manager-item-size">{formatFileSize(file.size)}</div>}
        {file.referencedBy.length > 0 && (
          <div className="mm-ref-list">
            {file.referencedBy.map((p) => (
              <span key={p} className="mm-ref-badge" title={p}>📄 {p.split("/").pop()}</span>
            ))}
          </div>
        )}
        {file.referencedBy.length === 0 && (
          <div className="mm-unref-badge">{$("未引用")}</div>
        )}
        {file.deleteError && <div className="media-manager-item-error">❌ {file.deleteError}</div>}
      </div>
      <div className="media-manager-item-actions">
        <button className="media-manager-btn" onClick={onPreview} title={$("预览")} aria-label={$("预览")}>👁</button>
        <button
          className="media-manager-btn"
          onClick={onCopy}
          title={$("复制链接")}
          aria-label={$("复制链接")}
        >
          {copiedUrl === file.publicUrl ? "✅" : "🔗"}
        </button>
        <button
          className="media-manager-btn media-manager-btn--danger"
          onClick={onDelete}
          disabled={file.deleting}
          title={$("删除远端文件")}
          aria-label={$("删除远端文件")}
        >
          {file.deleting ? "⏳" : "🗑️"}
        </button>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface MediaManagerPanelProps {
  plugin: CustomImageAutoUploader
}

function MediaManagerPanel({ plugin }: MediaManagerPanelProps) {
  const [mode, setMode] = useState<PanelMode>("current")
  const [items, setItems] = useState<ScanResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [deleteRemote, setDeleteRemote] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null)
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ScanResult | null>(null)

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
        if (!wdUrl) {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, sizeLoading: false } : i))
          )
          continue
        }
        const size = await webdavGetRemoteFileSize(wdUrl, auth)
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, size: size ?? undefined, sizeLoading: false, notFound: size === null }
              : i
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
      let rawFound: UploadedMediaItem[] = []

      if (mode === "current") {
        const activeFile = plugin.app.workspace.getActiveFile()
        if (!activeFile || activeFile.extension !== "md") {
          setStatusMsg($("请先打开一个 Markdown 笔记"))
          setScanning(false)
          return
        }
        const content = await plugin.app.vault.read(activeFile)
        rawFound = extractUploadedMediaItems(content, activeFile, prefixes, domains)
      } else {
        const files = plugin.app.vault.getMarkdownFiles()
        for (const file of files) {
          const content = await plugin.app.vault.read(file)
          rawFound.push(...extractUploadedMediaItems(content, file, prefixes, domains))
        }
      }

      // Build cross-reference map: url → [notePaths]
      const urlToNotes = new Map<string, string[]>()
      for (const item of rawFound) {
        const list = urlToNotes.get(item.url) ?? []
        if (!list.includes(item.notePath)) list.push(item.notePath)
        urlToNotes.set(item.url, list)
      }

      const found: ScanResult[] = rawFound.map((item) => ({
        ...item,
        sizeLoading: false,
        deleting: false,
        deleted: false,
        referencedByNotes: urlToNotes.get(item.url) ?? [item.notePath],
      }))

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
  const executeDelete = useCallback(
    async (item: ScanResult) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, deleting: true, deleteError: undefined } : i
        )
      )

      try {
        // Remove matchText from every referencing note
        for (const notePath of item.referencedByNotes) {
          const noteFile = plugin.app.vault.getAbstractFileByPath(notePath)
          if (!(noteFile instanceof TFile)) continue
          const content = await plugin.app.vault.read(noteFile)
          const newContent = content.split(item.matchText).join("").replace(/\n{3,}/g, "\n\n")
          await plugin.app.vault.modify(noteFile, newContent)
        }

        let remoteNote = ""
        if (deleteRemote && canDeleteRemote) {
          const publicPrefix = getEffectivePublicPrefix(plugin)
          const webdavBase = plugin.settings.webdavUrl?.trim() ?? ""
          const auth = getAuth()
          const urlsToDelete = [item.url, item.posterUrl].filter((u): u is string => !!u)
          const errs: string[] = []
          const notFoundUrls: string[] = []

          for (const url of urlsToDelete) {
            const wdUrl = publicUrlToWebdavUrl(url, publicPrefix, webdavBase)
            if (wdUrl) {
              const result = await webdavDeleteRemoteFile(wdUrl, auth)
              if ("error" in result) errs.push(`${extractFilenameFromUrl(url)}: ${result.error}`)
              else if ("notFound" in result) notFoundUrls.push(extractFilenameFromUrl(url))
            }
          }

          if (errs.length > 0) {
            remoteNote = `\n❌ ${$("远端文件删除失败")}: ${errs.join(", ")}`
          } else if (notFoundUrls.length > 0) {
            remoteNote = `\n⚠️ ${$("远端文件未找到")}: ${notFoundUrls.join(", ")}`
          } else {
            remoteNote = `\n✅ ${$("远端文件删除成功")}`
          }
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

  const deleteItem = useCallback(
    (item: ScanResult) => {
      if (item.referencedByNotes.length > 1) {
        setPendingDeleteItem(item)
        return
      }
      executeDelete(item)
    },
    [executeDelete]
  )

  const openNote = useCallback(
    async (noteFile: TFile) => {
      const leaf = plugin.app.workspace.getLeaf(false)
      await leaf.openFile(noteFile)
    },
    [plugin]
  )

  const switchMode = (m: PanelMode) => {
    setMode(m)
    setItems([])
    setStatusMsg(null)
    setPendingDeleteItem(null)
  }

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
      {previewTarget && (
        <PreviewModal target={previewTarget} onClose={() => setPreviewTarget(null)} />
      )}

      {/* Toolbar */}
      <div className="media-manager-toolbar">
        <div className="media-manager-tabs">
          <button
            className={`media-manager-tab${mode === "current" ? " is-active" : ""}`}
            onClick={() => switchMode("current")}
          >
            {$("当前笔记")}
          </button>
          <button
            className={`media-manager-tab${mode === "vault" ? " is-active" : ""}`}
            onClick={() => switchMode("vault")}
          >
            {$("全库扫描")}
          </button>
          <button
            className={`media-manager-tab${mode === "remote" ? " is-active" : ""}`}
            onClick={() => switchMode("remote")}
          >
            {$("远端扫描")}
          </button>
        </div>
        {mode !== "remote" && (
          <button
            className="media-manager-scan-btn mod-cta"
            onClick={scan}
            disabled={scanning}
          >
            {scanning ? $("正在扫描...") : $("扫描")}
          </button>
        )}
      </div>

      {/* Remote-delete toggle — only for current/vault tabs in WebDAV mode */}
      {canDeleteRemote && mode !== "remote" && (
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
      {mode !== "remote" && items.length > 0 && (
        <div className="media-manager-summary">
          {visibleCount}
          {mode === "vault" && noteGroups
            ? ` / ${Object.keys(noteGroups).length} 个文件`
            : " 个媒体"}
        </div>
      )}

      {/* Status */}
      {mode !== "remote" && statusMsg && (
        <div className="media-manager-status">{statusMsg}</div>
      )}

      {/* Multi-reference delete confirmation */}
      {pendingDeleteItem && (
        <MultiRefConfirm
          item={pendingDeleteItem}
          onConfirm={() => {
            const it = pendingDeleteItem
            setPendingDeleteItem(null)
            executeDelete(it)
          }}
          onCancel={() => setPendingDeleteItem(null)}
        />
      )}

      {/* Remote scan panel */}
      {mode === "remote" && (
        <RemoteScanPanel plugin={plugin} getAuth={getAuth} onPreview={setPreviewTarget} />
      )}

      {/* Item list */}
      {mode !== "remote" && (
        <div className="media-manager-list">
          {mode === "vault" && noteGroups
            ? Object.entries(noteGroups).map(([notePath, groupItems]) => {
                const visible = groupItems.filter((i) => !i.deleted)
                if (visible.length === 0) return null
                return (
                  <div key={notePath} className="media-manager-group">
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
                        onPreview={() => setPreviewTarget({ url: item.url, mediaType: item.mediaType, fileName: item.fileName })}
                      />
                    ))}
                  </div>
                )
              })
            : items.map((item) => (
                <MediaItemRow
                  key={item.id}
                  item={item}
                  showOpenBtn={mode === "current"}
                  onDelete={() => deleteItem(item)}
                  onOpenNote={() => openNote(item.noteFile)}
                  onPreview={() => setPreviewTarget({ url: item.url, mediaType: item.mediaType, fileName: item.fileName })}
                />
              ))}
        </div>
      )}
    </div>
  )
}

// ── Item row ──────────────────────────────────────────────────────────────────

interface MediaItemRowProps {
  item: ScanResult
  showOpenBtn: boolean
  onDelete: () => void
  onOpenNote: () => void
  onPreview: () => void
}

function MediaItemRow({ item, showOpenBtn, onDelete, onOpenNote, onPreview }: MediaItemRowProps) {
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
        {item.notFound && (
          <div className="mm-notfound-badge">⚠️ {$("失效")}</div>
        )}
        {!item.notFound && (item.sizeLoading || item.size !== undefined) && (
          <div className="media-manager-item-size">
            {item.sizeLoading ? $("获取大小中...") : formatFileSize(item.size!)}
          </div>
        )}
        {item.referencedByNotes.length > 1 && (
          <div className="mm-multiref-badge">
            ⚠️ {item.referencedByNotes.length} {$("被引用的笔记")}
          </div>
        )}
        {item.deleteError && (
          <div className="media-manager-item-error">❌ {item.deleteError}</div>
        )}
      </div>
      <div className="media-manager-item-actions">
        <button
          className="media-manager-btn"
          onClick={onPreview}
          title={$("预览")}
          aria-label={$("预览")}
        >
          👁
        </button>
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
