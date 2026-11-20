import cornerUrl from '../assets/letterpress-corner.svg'
import grainUrl from '../assets/paper-grain.png'
import gridUrl from '../assets/technical-grid.svg'
import { canvasPng, loadImage } from './canvasImage'
import { invitation, invitationEnding, invitationGreetingLead, invitationGreetingTail, paperColors, portraitCrop, recipientName } from './content'

export const invitationFilename = 'ThiepMoiTotNghiep_NguyenHoangVu.png'

function wrapText(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= width) {
      line = next
      continue
    }
    if (line) lines.push(line)
    line = ''
    for (const character of Array.from(word)) {
      if (ctx.measureText(line + character).width > width && line) {
        lines.push(line)
        line = ''
      }
      line += character
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function exportInvitationPng(recipient: string): Promise<Blob> {
  const guestName = recipientName(recipient)
  const greeting = invitationGreetingLead + (guestName || 'bạn') + invitationGreetingTail
  const messageFont = '400 23px Lora'
  const recipientFont = '600 23px Lora'
  const { logo, portrait, school, title, name, faculty, date, time, venue, venueSchool, address, phone } = invitation
  const [, , , , logoImage, portraitImage, grainImage, cornerImage, gridImage] = await Promise.all([
    document.fonts.load('400 45px Lora', `${title} ${name} ${greeting} ${invitationEnding} V`),
    guestName ? document.fonts.load(recipientFont, guestName) : [],
    document.fonts.load('400 16px "Be Vietnam Pro"', `${school} ${faculty} ${venueSchool} ${address}`),
    document.fonts.load('600 16px "Be Vietnam Pro"', `${date} ${time} ${venue} Thời gian Địa điểm Liên hệ`),
    loadImage(logo), loadImage(portrait), loadImage(grainUrl), loadImage(cornerUrl), loadImage(gridUrl),
  ])
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is unavailable')
  const ctx = context
  const width = 744
  const center = width / 2
  const scale = 2.5
  ctx.font = guestName ? recipientFont : messageFont
  const greetingLines = wrapText(ctx, greeting, 520)
  ctx.font = messageFont
  const messageLines = [...greetingLines, ...wrapText(ctx, invitationEnding, 456)]
  const offset = (messageLines.length - 1) * 32
  const height = 666 + offset
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  ctx.scale(scale, scale)
  ctx.fillStyle = paperColors.paper
  ctx.fillRect(0, 0, width, height)
  const grain = ctx.createPattern(grainImage, 'repeat')
  if (grain) {
    ctx.globalAlpha = 0.48
    ctx.fillStyle = grain
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1
  }
  ctx.strokeStyle = paperColors.sand
  ctx.strokeRect(11.5, 11.5, width - 23, height - 23)
  ctx.strokeStyle = paperColors.rule
  ctx.strokeRect(17.5, 17.5, width - 35, height - 35)
  ctx.globalAlpha = 0.82
  for (const x of [1, -1]) {
    for (const y of [1, -1]) {
      ctx.save()
      ctx.translate(x === 1 ? 22 : width - 22, y === 1 ? 22 : height - 22)
      ctx.scale(x, y)
      ctx.drawImage(cornerImage, 0, 0, 54, 54)
      ctx.restore()
    }
  }
  ctx.globalAlpha = 0.34
  ctx.drawImage(gridImage, width - 186, height - 126, 168, 108)
  ctx.globalAlpha = 1
  ctx.textBaseline = 'middle'

  function text(value: string, y: number, font: string, options: {
    x?: number
    align?: CanvasTextAlign
    accent?: boolean
    color?: string
  } = {}) {
    const { x = center, align = 'center', accent = false, color = accent ? paperColors.darkAccent : paperColors.ink } = options
    ctx.textAlign = align
    ctx.font = font
    ctx.fillStyle = color
    ctx.fillText(value, x, y)
  }

  function rule(x1: number, y1: number, x2: number, y2: number, color = paperColors.rule) {
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  const logoWidth = 48 * logoImage.naturalWidth / logoImage.naturalHeight
  ctx.drawImage(logoImage, center - logoWidth / 2, 43, logoWidth, 48)
  text(school, 109, '400 14px "Be Vietnam Pro"')
  text(title, 150, '400 44px Lora')
  rule(center - 65, 189.5, center - 11, 189.5, paperColors.sand)
  rule(center + 11, 189.5, center + 65, 189.5, paperColors.sand)
  ctx.save()
  ctx.translate(center, 189.5)
  ctx.rotate(Math.PI / 4)
  ctx.strokeStyle = paperColors.accent
  ctx.strokeRect(-3, -3, 6, 6)
  ctx.restore()

  const diameter = 156
  const portraitX = 138
  const portraitY = 211
  const portraitWidth = diameter * portraitCrop.width
  for (const [inset, color] of [[4, paperColors.sand], [9, paperColors.rule]] as const) {
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.arc(portraitX + diameter / 2, portraitY + diameter / 2, diameter / 2 + inset, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.save()
  ctx.beginPath()
  ctx.arc(portraitX + diameter / 2, portraitY + diameter / 2, diameter / 2, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(portraitImage, portraitX + diameter * portraitCrop.left,
    portraitY + diameter * portraitCrop.top, portraitWidth,
    portraitWidth * portraitImage.naturalHeight / portraitImage.naturalWidth)
  ctx.restore()

  const identity = { x: 335, align: 'left' } as const
  ctx.textAlign = 'center'
  ctx.font = '400 56px Lora'
  ctx.fillStyle = paperColors.embossShadow
  ctx.fillText('V', 654, 243)
  ctx.fillStyle = paperColors.embossHighlight
  ctx.fillText('V', 655.3, 244.3)
  ctx.fillStyle = '#edf0e5'
  ctx.fillText('V', 654.7, 243.7)
  text(name, 278, '400 38px Lora', identity)
  text(faculty, 314, '400 15px "Be Vietnam Pro"', identity)
  rule(108, 385.5, width - 108, 385.5)

  let greetingOffset = 0
  for (const [i, line] of messageLines.entries()) {
    const y = 415 + i * 32
    if (!guestName || i >= greetingLines.length) {
      text(line, y, messageFont)
      continue
    }

    const start = greeting.indexOf(line, greetingOffset)
    greetingOffset = start + line.length
    const nameStart = Math.max(0, invitationGreetingLead.length - start)
    const nameEnd = Math.max(0, invitationGreetingLead.length + guestName.length - start)
    const runs = [
      { value: line.slice(0, nameStart), font: messageFont, color: paperColors.ink },
      { value: line.slice(nameStart, nameEnd), font: recipientFont, color: paperColors.wax },
      { value: line.slice(nameEnd), font: messageFont, color: paperColors.ink },
    ].map((run) => {
      ctx.font = run.font
      return { ...run, width: ctx.measureText(run.value).width }
    })
    let x = center - runs.reduce((sum, run) => sum + run.width, 0) / 2
    for (const run of runs) {
      if (run.value.trim()) text(run.value, y, run.font, { x, align: 'left', color: run.color })
      x += run.width
    }
  }
  rule(108, 444.5 + offset, width - 108, 444.5 + offset)

  const label = '600 12px "Be Vietnam Pro"'
  const detail = '400 15px "Be Vietnam Pro"'
  const timeColumn = { x: center - 139 }
  const venueColumn = { x: center + 139 }
  rule(center + 0.5, 466 + offset, center + 0.5, 541 + offset)
  text('THỜI GIAN', 475 + offset, label, { ...timeColumn, accent: true })
  text(date, 504 + offset, '600 16px "Be Vietnam Pro"', timeColumn)
  text(time, 527 + offset, detail, timeColumn)
  text('ĐỊA ĐIỂM', 475 + offset, label, { ...venueColumn, accent: true })
  text(venue, 504 + offset, '600 16px "Be Vietnam Pro"', venueColumn)
  text(venueSchool, 527 + offset, detail, venueColumn)
  rule(108, 556.5 + offset, width - 108, 556.5 + offset)
  text(address, 579 + offset, detail)
  rule(108, 598.5 + offset, width - 108, 598.5 + offset)

  const contact = `Liên hệ  ${phone}`
  const contactFont = '600 14px "Be Vietnam Pro"'
  ctx.font = contactFont
  const footerLeft = center - (36 + ctx.measureText(contact).width) / 2
  const monogramX = footerLeft + 13
  ctx.strokeStyle = paperColors.sand
  ctx.beginPath()
  ctx.arc(monogramX, 624 + offset, 13, 0, Math.PI * 2)
  ctx.stroke()
  text('V', 624 + offset, '400 14px Lora', { x: monogramX, accent: true })
  text(contact, 624 + offset, contactFont, { x: footerLeft + 36, align: 'left', accent: true })

  return canvasPng(canvas)
}
