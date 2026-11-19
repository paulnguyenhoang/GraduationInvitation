import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import a5Marker from '../assets/a5-marker.svg'
import { canvasPng, loadImage } from './canvasImage'
import { invitation } from './content'
import { DownloadControl } from './DownloadControl'
import { Icon } from './Icon'

// Center of the outlined roof in a5-marker.svg's 2048 × 974 viewBox.
const a5Center = { x: 913 / 2048, y: 391 / 974 }
const overview = { zoom: 100, center: { x: 0, y: 0 } }

async function exportCampusMap() {
  const [source, marker] = await Promise.all([loadImage(invitation.campusMap), loadImage(a5Marker)])
  const canvas = document.createElement('canvas')
  canvas.width = source.naturalWidth
  canvas.height = source.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is unavailable')
  ctx.drawImage(source, 0, 0)
  ctx.drawImage(marker, 0, 0, canvas.width, canvas.height)
  return canvasPng(canvas)
}

export function CampusMapModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const [view, setView] = useState(overview)
  const { zoom } = view
  const regionRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement
    dialog.showModal()
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      dialog.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  useLayoutEffect(() => {
    const region = regionRef.current
    if (!region) return
    const { center } = view
    region.scrollLeft = center.x * region.scrollWidth - region.clientWidth / 2
    region.scrollTop = center.y * region.scrollHeight - region.clientHeight / 2
  }, [view])

  function changeZoom(step: number) {
    const region = regionRef.current
    if (!region) return
    setView({
      zoom: Math.min(300, Math.max(100, zoom + step)),
      center: {
        x: (region.scrollLeft + region.clientWidth / 2) / region.scrollWidth,
        y: (region.scrollTop + region.clientHeight / 2) / region.scrollHeight,
      },
    })
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0 || zoom === 100) return
    const region = event.currentTarget
    if (event.clientX >= region.getBoundingClientRect().left + region.clientWidth ||
        event.clientY >= region.getBoundingClientRect().top + region.clientHeight) return
    panRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: region.scrollLeft, top: region.scrollTop }
    region.setPointerCapture(event.pointerId)
    region.dataset.panning = 'true'
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    if (pan?.id !== event.pointerId) return
    event.currentTarget.scrollLeft = pan.left + pan.x - event.clientX
    event.currentTarget.scrollTop = pan.top + pan.y - event.clientY
  }

  function stopPan(event: PointerEvent<HTMLDivElement>) {
    if (panRef.current?.id !== event.pointerId) return
    panRef.current = null
    delete event.currentTarget.dataset.panning
  }

  return (
    <dialog ref={dialogRef} className="poster-dialog campus-dialog" aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.currentTarget === event.target) onClose() }}>
      <div className="dialog-content">
        <div className="dialog-header">
          <DownloadControl label="Tải sơ đồ" filename="SoDoHCMUT_ToaA5.png" createPng={exportCampusMap} />
          <h2 id={titleId}>Sơ đồ khuôn viên – {invitation.venue}</h2>
          <button ref={closeRef} type="button" className="round-control close-icon" title="Đóng sơ đồ" aria-label="Đóng hộp thoại" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div ref={regionRef} className="map-viewport" role="region" tabIndex={0}
          aria-label="Sơ đồ khuôn viên HCMUT" data-zoomed={zoom > 100}
          onPointerDown={startPan} onPointerMove={movePan} onPointerUp={stopPan}
          onPointerCancel={stopPan} onLostPointerCapture={stopPan}>
          <div className="map-sheet" style={{ width: `${zoom}%` }}>
            <img className="campus-map" src={invitation.campusMap} alt="Sơ đồ Trường Đại học Bách khoa, vị trí tòa A5 được đánh dấu" width="2048" height="974" draggable={false} />
            <img className="a5-marker" src={a5Marker} alt="" draggable={false} />
          </div>
        </div>
        <div className="map-controls">
          <div className="map-zoom">
            <button type="button" className="round-control" onClick={() => changeZoom(-50)} disabled={zoom === 100} aria-label="Thu nhỏ bản đồ"><Icon name="minus" size={18} /></button>
            <output aria-live="polite">{zoom}%</output>
            <button type="button" className="round-control" onClick={() => changeZoom(50)} disabled={zoom === 300} aria-label="Phóng to bản đồ"><Icon name="plus" size={18} /></button>
          </div>
          <div className="map-jumps">
            <button type="button" className="location-action" onClick={() => setView({ ...overview })}>Toàn cảnh</button>
            <button type="button" className="location-action map-focus" onClick={() => setView({ zoom: 250, center: a5Center })}>Tập trung vào A5</button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
