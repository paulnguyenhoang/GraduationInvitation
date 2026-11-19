import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

function releaseUrl(url: string) {
  // Keep the URL alive while the browser hands the file to its download manager.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function canDownload(link: HTMLAnchorElement) {
  const appleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return 'download' in link && !(appleMobile && navigator.userActivation?.isActive === false)
}

export function DownloadControl({ label, filename, createPng, className = '', showLabel = false }: {
  label: string
  filename: string
  createPng: () => Promise<Blob>
  className?: string
  showLabel?: boolean
}) {
  const [working, setWorking] = useState(false)
  const [fallback, setFallback] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  const fallbackRef = useRef<string | null>(null)

  useEffect(() => () => {
    requestRef.current?.abort()
    if (fallbackRef.current) releaseUrl(fallbackRef.current)
  }, [])

  async function download() {
    if (requestRef.current) return
    const request = new AbortController()
    requestRef.current = request
    setWorking(true)
    setError(false)
    if (fallbackRef.current) releaseUrl(fallbackRef.current)
    fallbackRef.current = null
    setFallback(null)

    try {
      const png = await createPng()
      if (request.signal.aborted) return
      const url = URL.createObjectURL(png)
      const anchor = document.createElement('a')
      if (canDownload(anchor)) {
        anchor.href = url
        anchor.download = filename
        document.body.append(anchor)
        anchor.click()
        anchor.remove()
        releaseUrl(url)
      } else {
        fallbackRef.current = url
        setFallback(url)
      }
    } catch {
      if (!request.signal.aborted) setError(true)
    } finally {
      if (!request.signal.aborted) {
        requestRef.current = null
        setWorking(false)
      }
    }
  }

  return (
    <div className={`download-control ${className}`}>
      <button type="button" className="round-control download-icon" title={label} aria-label={label}
        aria-busy={working} disabled={working} onClick={download}>
        <Icon name="download" />
        {showLabel && <span>{label}</span>}
      </button>
      <div className="download-feedback" role="status">
        {working && <span>Đang tạo ảnh…</span>}
        {error && <span>Chưa tạo được ảnh. Hãy thử lại.</span>}
        {fallback && <a href={fallback} target="_blank" rel="noopener noreferrer">Mở ảnh để lưu</a>}
      </div>
    </div>
  )
}
