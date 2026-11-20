import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { recipientName } from './invitation/content'
import { Icon } from './invitation/Icon'

export function RecipientNameDialog({ onClose, onSave }: {
  onClose: () => void
  onSave: (name: string) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [missingName, setMissingName] = useState(false)
  const titleId = useId()
  const inputId = useId()
  const errorId = useId()

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const viewport = window.visualViewport

    function fitViewport() {
      if (!dialog) return
      if (viewport && viewport.scale === 1) {
        dialog.style.setProperty('--name-dialog-viewport-height', `${viewport.height}px`)
        dialog.style.setProperty('--name-dialog-viewport-top', `${viewport.offsetTop}px`)
      } else {
        dialog.style.removeProperty('--name-dialog-viewport-height')
        dialog.style.removeProperty('--name-dialog-viewport-top')
      }
      dialog.toggleAttribute('data-compact', (viewport?.height ?? window.innerHeight) < 360)
    }

    fitViewport()
    dialog.showModal()
    inputRef.current?.focus()
    viewport?.addEventListener('resize', fitViewport)
    viewport?.addEventListener('scroll', fitViewport)
    return () => {
      viewport?.removeEventListener('resize', fitViewport)
      viewport?.removeEventListener('scroll', fitViewport)
      dialog.close()
    }
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = recipientName(inputRef.current?.value ?? '')
    if (!name) {
      setMissingName(true)
      inputRef.current?.focus()
      return
    }
    onSave(name)
  }

  return (
    <dialog ref={dialogRef} className="name-dialog" aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="name-dialog-content">
        <button className="name-dialog-close" type="button" onClick={onClose} aria-label="Đóng hộp thoại"><Icon name="close" /></button>
        <h2 id={titleId}>Nhập tên để mở tấm thiệp dành cho bạn nha.</h2>
        <form className="name-dialog-form" onSubmit={submit} noValidate>
          <label htmlFor={inputId}>Tên của bạn</label>
          <input ref={inputRef} id={inputId} name="recipient" type="text" autoComplete="name" enterKeyHint="done"
            required aria-invalid={missingName} aria-describedby={missingName ? errorId : undefined}
            onChange={() => setMissingName(false)} />
          {missingName && <p id={errorId} role="alert" className="name-dialog-error">Bạn chưa nhập tên.</p>}
          <button className="name-dialog-submit" type="submit">Lưu tên</button>
        </form>
      </div>
    </dialog>
  )
}
