import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import type { EnvelopePhase } from './EnvelopeScene'
import { RecipientNameDialog } from './RecipientNameDialog'
import { invitation, invitationNamePrompt, recipientName } from './invitation/content'

const EnvelopeViewport = lazy(() => import('./EnvelopeScene'))

class SceneBoundary extends Component<{
  children: ReactNode
  onError: () => void
}, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function RecipientNameInput({ value, draft, onSave, onDraftChange }: {
  value: string
  draft: string | null
  onSave: (value: string) => void
  onDraftChange: (draft: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const editRef = useRef<HTMLButtonElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const editing = draft !== null
  const name = recipientName(value)

  useEffect(() => {
    const input = inputRef.current
    const viewport = window.visualViewport
    const form = formRef.current
    if (!input || !form) return
    let frame = 0

    function keepInputVisible() {
      if (!form?.contains(document.activeElement)) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const top = viewport?.offsetTop ?? 0
        const bottom = top + (viewport?.height ?? window.innerHeight)
        const rect = form.getBoundingClientRect()
        if (rect.bottom > bottom - 12 || rect.top < top + 12) {
          form.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }
      })
    }

    input.addEventListener('focus', keepInputVisible)
    viewport?.addEventListener('resize', keepInputVisible)
    window.addEventListener('resize', keepInputVisible)
    return () => {
      cancelAnimationFrame(frame)
      input.removeEventListener('focus', keepInputVisible)
      viewport?.removeEventListener('resize', keepInputVisible)
      window.removeEventListener('resize', keepInputVisible)
    }
  }, [editing])

  function beginEditing() {
    // Focus within the tap so mobile browsers can show their keyboard.
    flushSync(() => onDraftChange(value))
    inputRef.current?.focus()
  }

  function finishEditing(save: boolean) {
    if (save && draft !== null) onSave(recipientName(draft))
    flushSync(() => onDraftChange(null))
    editRef.current?.focus({ preventScroll: true })
  }

  if (draft !== null) {
    return (
      <form ref={formRef} className="recipient-field" onSubmit={(event) => { event.preventDefault(); finishEditing(true) }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
            event.preventDefault()
            finishEditing(false)
          }
        }}>
        <label className="sr-only" htmlFor="recipient-name">Tên người nhận</label>
        <input id="recipient-name" ref={inputRef} type="text" autoComplete="off"
          enterKeyHint="done" placeholder="Tên người nhận" value={draft}
          onChange={(event) => onDraftChange(event.target.value)} />
        <button type="submit" className="recipient-done">Xong</button>
      </form>
    )
  }

  return (
    <button ref={editRef} type="button" className="edit-name" onClick={beginEditing}
      aria-label={name ? `Gửi đến ${name}. Chỉnh sửa tên người nhận` : undefined}>
      <span>{name ? <>Gửi đến <strong>{name}</strong></> : invitationNamePrompt}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m14.5 5.5 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z" />
      </svg>
    </button>
  )
}

type Props = {
  recipient: string
  onRecipientChange: (recipient: string) => void
  onOpen: (name: string) => void
  restoreOpenFocus: boolean
}

export function EnvelopeScreen({ recipient, onRecipientChange, onOpen, restoreOpenFocus }: Props) {
  const [phase, setPhase] = useState<EnvelopePhase>('loading')
  const [failed, setFailed] = useState(false)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const actionRef = useRef<(() => void) | null>(null)
  const sealButtonRef = useRef<HTMLButtonElement>(null)
  const openingNameRef = useRef<string | null>(null)
  const opening = !failed && (phase === 'opening' || phase === 'open')
  const ready = !failed && phase === 'closed'
  const showPoster = useCallback(() => {
    const name = openingNameRef.current
    if (name) onOpen(name)
  }, [onOpen])
  const reportSceneError = useCallback(() => {
    if (openingNameRef.current) showPoster()
    else setFailed(true)
  }, [showPoster])

  const handlePhase = useCallback((next: EnvelopePhase) => {
    setPhase(next)
    if (next === 'open') showPoster()
  }, [showPoster])

  useLayoutEffect(() => {
    if (restoreOpenFocus) sealButtonRef.current?.focus({ preventScroll: true })
  }, [restoreOpenFocus])

  function openFor(name: string) {
    if (openingNameRef.current) return
    openingNameRef.current = name
    if (name !== recipient) onRecipientChange(name)
    if (!failed && actionRef.current) actionRef.current()
    else showPoster()
  }

  function requestOpen() {
    if (openingNameRef.current || showNameDialog) return
    const name = recipientName(nameDraft ?? recipient)
    if (!name) {
      flushSync(() => setShowNameDialog(true))
      return
    }
    openFor(name)
  }

  function closeNameDialog() {
    flushSync(() => setShowNameDialog(false))
    sealButtonRef.current?.focus({ preventScroll: true })
  }

  function saveNameFromDialog(name: string) {
    onRecipientChange(name)
    setNameDraft(null)
    closeNameDialog()
  }

  return (
    <main className="invitation">
      <header className="invitation-header">
        <h1>{invitation.titleLead} <span className="no-break">{invitation.titleEnd}</span></h1>
        <p>{invitation.name}<span aria-hidden="true"> · </span><time dateTime={invitation.dateIso}>{invitation.dateStamp}</time></p>
      </header>

      <section className="envelope-stage" aria-label="Phong bì thiệp mời 3D" data-phase={failed ? 'error' : phase}>
        {(failed || phase === 'loading') && <div className="envelope-placeholder" aria-hidden="true"><span>V</span></div>}
        {!failed && <SceneBoundary onError={reportSceneError}>
          <Suspense fallback={null}>
            <EnvelopeViewport actionRef={actionRef} sealButtonRef={sealButtonRef} onOpenRequest={requestOpen}
              onPhaseChange={handlePhase} onSceneError={reportSceneError} />
          </Suspense>
        </SceneBoundary>}
        <button ref={sealButtonRef} type="button" className="seal-key" aria-label="Mở thiệp từ phong bì"
          disabled={opening} onClick={requestOpen} />
        <span className="sr-only" role="status">
          {phase === 'loading' && !failed ? 'Đang tải phong bì…' : phase === 'opening' ? 'Đang mở thiệp mời…' : ''}
        </span>
      </section>

      <div className="invitation-actions">
        <div className="envelope-instructions" data-ready={ready}>
          {ready && <span className="rotate-hint">
            <span className="mouse-copy">Kéo để xoay</span><span className="touch-copy">Vuốt để xoay</span>
          </span>}
          <span className="open-hint">
            {ready ? <>
              <span className="mouse-copy">Bấm dấu sáp V để mở</span><span className="touch-copy">Chạm dấu sáp V để mở</span>
            </> : opening ? 'Đang mở thiệp…' : <>
              <span className="mouse-copy">Bấm vào phong bì để mở</span><span className="touch-copy">Chạm vào phong bì để mở</span>
            </>}
          </span>
        </div>
        <RecipientNameInput value={recipient} draft={nameDraft} onSave={onRecipientChange} onDraftChange={setNameDraft} />
      </div>
      {showNameDialog && <RecipientNameDialog onClose={closeNameDialog} onSave={saveNameFromDialog} />}
    </main>
  )
}
