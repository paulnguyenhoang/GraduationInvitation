import { lazy, Suspense, useLayoutEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { EnvelopeScreen } from './EnvelopeScreen'
import { DeskStamps } from './DeskStamps'
import { invitation } from './invitation/content'
import './App.css'

const InvitationPoster = lazy(() => import('./invitation/InvitationPoster'))
const storageKey = 'graduation-invitation.recipient'
const driedSprigs = [
  { angle: 48, width: 65, opacity: 0.59 },
  { angle: -45, width: 54, opacity: 0.54 },
  { angle: 28, width: 90, opacity: 0.75 },
  { angle: -29, width: 76, opacity: 0.62 },
  { angle: -3, width: 82, opacity: 0.7 },
  { angle: 13, width: 96, opacity: 0.79 },
  { angle: 38, width: 75, opacity: 0.67 },
  { angle: -36, width: 60, opacity: 0.66 },
  { angle: -17, width: 100, opacity: 0.9 },
]

function storedRecipient() {
  try {
    return localStorage.getItem(storageKey) ?? ''
  } catch {
    return ''
  }
}

function App() {
  const [recipient, setRecipient] = useState(storedRecipient)
  const [posterRecipient, setPosterRecipient] = useState<string | null>(null)
  const [restoreOpenFocus, setRestoreOpenFocus] = useState(false)
  const posterOpen = posterRecipient !== null

  useLayoutEffect(() => { window.scrollTo(0, 0) }, [posterOpen])

  function updateRecipient(value: string) {
    setRecipient(value)
    try {
      localStorage.setItem(storageKey, value)
    } catch {
      // The name is still available for this visit if storage is blocked.
    }
  }

  return (
    <div className="writing-desk" data-open={posterOpen}>
      <div className="desk-decor" aria-hidden="true">
        <div className="sunlight" />
        <div className="stationery-stack">
          <div className="stationery-sheet stationery-sheet--back" />
          <div className="stationery-sheet stationery-sheet--middle" />
          <div className="stationery-sheet stationery-detail"><span>V</span></div>
        </div>
        <div className="desk-postmark"><span>Bách khoa</span><time dateTime={invitation.dateIso}>{invitation.dateStamp}</time></div>
        <DeskStamps />
        <div className="dried-bouquet">
          {driedSprigs.map(({ angle, width, opacity }) => (
            <img key={angle} className="dried-sprig" src={invitation.driedSprig} alt="" decoding="async" draggable={false}
              style={{ '--sprig-width': `${width}%`, transform: `rotate(${angle}deg)`, opacity } as CSSProperties} />
          ))}
        </div>
      </div>
      {posterOpen ? (
        <Suspense fallback={<div className="poster-loading" role="status">Đang mở thiệp…</div>}>
          <InvitationPoster recipient={posterRecipient} onClose={() => { setRestoreOpenFocus(true); setPosterRecipient(null) }} />
        </Suspense>
      ) : (
        <EnvelopeScreen recipient={recipient} onRecipientChange={updateRecipient} onOpen={setPosterRecipient} restoreOpenFocus={restoreOpenFocus} />
      )}
    </div>
  )
}

export default App
