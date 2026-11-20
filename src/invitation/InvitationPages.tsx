import type { RefObject } from 'react'
import { invitation, invitationEnding, invitationGreetingLead, invitationGreetingTail, parkingPlaces, portraitCrop, recipientName } from './content'
import { Icon } from './Icon'

export function InvitationPage({ recipient, onMapOpen, onParkingOpen, headingRef }: {
  recipient: string
  onMapOpen: () => void
  onParkingOpen: () => void
  headingRef: RefObject<HTMLHeadingElement | null>
}) {
  const guestName = recipientName(recipient)

  return (
    <>
      <header className="letter-header">
        <img className="school-logo" src={invitation.logo} alt="Logo HCMUT" width="50" height="50" />
        <p className="school-name">{invitation.school}</p>
        <h1 className="poster-title" ref={headingRef} tabIndex={-1}>{invitation.titleLead} <span className="no-break">{invitation.titleEnd}</span></h1>
        <div className="letter-flourish" aria-hidden="true"><span /></div>
      </header>

      <div className="letter-identity">
        <div className="paper-portrait">
          <img src={invitation.portrait} alt="Nguyễn Hoàng Vũ" style={{
            width: `${portraitCrop.width * 100}%`, left: `${portraitCrop.left * 100}%`, top: `${portraitCrop.top * 100}%`,
          }} />
        </div>
        <div className="graduate-details">
          <span className="identity-monogram" aria-hidden="true">V</span>
          <p className="graduate-name">{invitation.name}</p>
          <p className="faculty-name">{invitation.faculty}</p>
        </div>
      </div>

      <p className="personal-invitation">
        <span className="invitation-greeting">
          {invitationGreetingLead}{guestName ? <strong className="invitation-recipient">{guestName}</strong> : 'bạn'}{invitationGreetingTail}
        </span>
        {' '}<span className="invitation-ending">{invitationEnding}</span>
      </p>

      <div className="ceremony-details">
        <div className="ceremony-block">
          <h2>Thời gian</h2>
          <p className="ceremony-primary"><time dateTime={invitation.dateIso}>{invitation.date}</time></p>
          <p className="ceremony-time">{invitation.time}</p>
        </div>
        <div className="ceremony-block">
          <h2>Địa điểm</h2>
          <p className="ceremony-primary venue-name">{invitation.venue}</p>
          <p>{invitation.venueSchool}</p>
        </div>
        <div className="ceremony-address">
          <p>{invitation.address}</p>
          <div className="location-actions">
            <button className="location-action" type="button" onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true })
              onMapOpen()
            }} aria-haspopup="dialog"><Icon name="pin" size={16} /> Xem sơ đồ A5</button>
            <a className="location-action" href={invitation.mapsUrl} target="_blank" rel="noopener noreferrer">Mở Google Maps <Icon name="external" size={14} /></a>
          </div>
          <button className="paper-nav parking-next" type="button" onClick={onParkingOpen}>Xem chỗ gửi xe <span aria-hidden="true">→</span></button>
        </div>
      </div>
      <footer className="letter-footer">
        <span className="footer-monogram" aria-hidden="true">V</span>
        <p>Liên hệ <a className="text-link" href={`tel:${invitation.phone.replace(/ /g, '')}`}>{invitation.phone}</a></p>
      </footer>
    </>
  )
}

export function ParkingPage({ backRef, onReturn }: { backRef: RefObject<HTMLButtonElement | null>; onReturn: () => void }) {
  return (
    <>
      <button className="paper-nav parking-back" ref={backRef} type="button" onClick={onReturn}><span aria-hidden="true">←</span> Về thiệp</button>
      <header className="letter-header parking-header">
        <span className="parking-emblem" aria-hidden="true"><Icon name="pin" size={24} /></span>
        <h1 className="poster-title">Thông tin chỗ để xe</h1>
        <div className="letter-flourish" aria-hidden="true"><span /></div>
      </header>
      <ol className="parking-list">
        {parkingPlaces.map(({ title, address, vehicles, hours, price, backup, mapsUrl }) => (
          <li key={title}>
            <div className="parking-entry">
              <h2>{title}</h2>
              <p className="parking-tags"><span>{vehicles}</span>{backup && <span className="parking-backup">Dự phòng</span>}</p>
              <p className="parking-address">{address}</p>
              <dl className="parking-facts">
                <div><dt>Giờ tham khảo</dt><dd>{hours}</dd></div>
                <div><dt>Giá tham khảo</dt><dd>{price}</dd></div>
              </dl>
              <a className="parking-map text-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                Xem bản đồ<Icon name="external" size={14} />
              </a>
            </div>
          </li>
        ))}
      </ol>
      <p className="parking-disclaimer">Giờ hoạt động và giá vé chỉ mang tính tham khảo, có thể thay đổi.</p>
    </>
  )
}
