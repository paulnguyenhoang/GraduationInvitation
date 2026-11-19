export async function loadImage(url: string) {
  const image = new Image()
  image.src = url
  await image.decode()
  return image
}

export function canvasPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png')
  })
}
