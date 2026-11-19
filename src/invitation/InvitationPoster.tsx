import { useLayoutEffect, useRef, useState } from 'react'
import { InvitationPage, ParkingPage } from './InvitationPages'
import { CampusMapModal } from './PosterDialogs'
import { DownloadControl } from './DownloadControl'
import { exportInvitationPng, invitationFilename } from './exportInvitationPng'
import { Icon } from './Icon'
import './InvitationPoster.css'

type Props = { recipient: string; onClose: () => void }

export default function InvitationPoster({ recipient, onClose }: Props) {
  const [page, setPage] = useState<1 | 2>(1)
  const [mapOpen, setMapOpen] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    const target = page === 1 ? headingRef.current : backRef.current
    target?.focus({ preventScroll: true })
  }, [page])

  function changePage(next: 1 | 2) {
    setPage(next)
    window.scrollTo({ top: 0 })
  }

  return (
    <main className="poster-screen" data-poster-page={page}>
      <div className="poster-frame">
        <div className="poster-tools" role="group" aria-label="Thao tác với thiệp">
          <DownloadControl className="poster-download" label="Lưu thiệp" showLabel filename={invitationFilename}
            createPng={() => exportInvitationPng(recipient)} />
          <button type="button" className="round-control close-icon poster-close" title="Đóng thiệp" onClick={onClose} aria-label="Đóng thiệp"><Icon name="close" /></button>
        </div>
        <div className="poster-paper">
          <div className="paper-border" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="paper-grid" aria-hidden="true" />
          {page === 1 ? (
            <article className="poster-page invitation-page" key="invitation">
              <InvitationPage recipient={recipient} headingRef={headingRef} onMapOpen={() => setMapOpen(true)}
                onParkingOpen={() => changePage(2)} />
            </article>
          ) : (
            <article className="poster-page parking-page" key="parking">
              <ParkingPage backRef={backRef} onReturn={() => changePage(1)} />
            </article>
          )}
        </div>
      </div>
      {mapOpen && <CampusMapModal onClose={() => setMapOpen(false)} />}
    </main>
  )
}
