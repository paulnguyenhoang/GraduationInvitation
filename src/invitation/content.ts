const imageBase = `${import.meta.env.BASE_URL}assets/images/`
const locality = 'phường Diên Hồng, TP. Hồ Chí Minh'
const dateIso = '2026-11-29'
const titleLead = 'Thư mời'
const titleEnd = 'tốt nghiệp'

export const invitation = {
  school: 'Trường Đại học Bách khoa – ĐHQG-HCM',
  title: `${titleLead} ${titleEnd}`,
  titleLead,
  titleEnd,
  name: 'Nguyễn Hoàng Vũ',
  faculty: 'Khoa Khoa học và Kỹ thuật Máy tính',
  date: 'Chủ nhật, ngày 29/11/2026',
  dateIso,
  dateStamp: dateIso.split('-').reverse().join('.'),
  time: '10:30 – 12:00',
  venue: 'Tòa A5',
  venueSchool: 'Trường Đại học Bách khoa – Cơ sở 1',
  address: `268 Lý Thường Kiệt, ${locality}`,
  mapsUrl: 'https://maps.app.goo.gl/VhXD95Y1wq7qDVvL6',
  phone: '0976 578 667',
  logo: `${imageBase}HCMUT_logo.png`,
  portrait: `${imageBase}Nhvu.jpeg`,
  campusMap: `${imageBase}Map_HCMUT_Q10.jpg`,
  driedSprig: `${imageBase}dried-sprig.webp`,
}

export const paperColors = {
  paper: '#f8f5e9',
  ink: '#24455e',
  rule: '#d7ded7',
  accent: '#6c8795',
  sand: '#9aafb4',
  darkAccent: '#3b596b',
  wax: '#873e36',
  embossShadow: '#a8b9b5',
  embossHighlight: '#fffdf1',
}

export const portraitCrop = { width: 2.12, left: -0.3, top: -0.62 }

export function recipientName(recipient: string) {
  return recipient.normalize('NFC').trim().replace(/\s+/gu, ' ')
}

export const invitationGreetingLead = 'Mời '
export const invitationGreetingTail = ' đến chung vui'
export const invitationEnding = 'trong ngày tốt nghiệp của mình nha.'

export const parkingPlaces = [
  {
    title: 'Cổng 1', address: invitation.address,
    vehicles: 'Xe máy', hours: '06:00–21:00', price: '2.000 đ',
    mapsUrl: 'https://maps.app.goo.gl/4Ao3uSJDwJXfk4jy5',
  },
  {
    title: 'Cổng 3', address: `142 Tô Hiến Thành, ${locality}`,
    vehicles: 'Xe máy', hours: '06:00–21:00', price: '2.000 đ',
    mapsUrl: 'https://maps.app.goo.gl/nL6s37h5hJpUfdCV8',
  },
  {
    title: '332 Tô Hiến Thành', address: `332 Tô Hiến Thành, ${locality}`,
    vehicles: 'Ô tô, xe máy', hours: '24/24', price: 'Chưa có thông tin',
    mapsUrl: 'https://maps.app.goo.gl/wm9eetHSXYhqxvc46',
    backup: true,
  },
]
