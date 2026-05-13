type SpriteFrame = {
  x: number
  y: number
  w: number
  h: number
}

const SPRITE_FRAMES: SpriteFrame[] = [
  { x: 34, y: 28, w: 192, h: 410 },
  { x: 242, y: 30, w: 188, h: 406 },
  { x: 458, y: 28, w: 194, h: 404 },
  { x: 668, y: 22, w: 188, h: 410 },
  { x: 872, y: 24, w: 188, h: 410 },
  { x: 1_080, y: 22, w: 188, h: 410 },
  { x: 1_282, y: 28, w: 210, h: 410 },
  { x: 32, y: 560, w: 220, h: 390 },
  { x: 274, y: 560, w: 192, h: 374 },
  { x: 512, y: 562, w: 196, h: 364 },
  { x: 722, y: 560, w: 194, h: 372 },
  { x: 938, y: 550, w: 204, h: 384 },
  { x: 1_214, y: 546, w: 198, h: 390 },
]

type RGB = {
  r: number
  g: number
  b: number
}

function averageEdgeColor(data: Uint8ClampedArray, width: number, row: number, fromX: number, toX: number): RGB {
  let r = 0
  let g = 0
  let b = 0
  let count = 0

  for (let x = fromX; x < toX; x += 1) {
    const index = ((row * width) + x) * 4
    r += data[index]
    g += data[index + 1]
    b += data[index + 2]
    count += 1
  }

  if (count === 0) {
    return { r: 0, g: 0, b: 0 }
  }

  return {
    r: r / count,
    g: g / count,
    b: b / count,
  }
}

function toDataUrl(canvas: HTMLCanvasElement) {
  return canvas.toDataURL('image/png')
}

function trimTransparentBounds(sourceCanvas: HTMLCanvasElement) {
  const sourceCtx = sourceCanvas.getContext('2d')
  if (!sourceCtx) return toDataUrl(sourceCanvas)

  const { width, height } = sourceCanvas
  const imageData = sourceCtx.getImageData(0, 0, width, height)
  const data = imageData.data

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[((y * width) + x) * 4 + 3]
      if (alpha < 24) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (maxX === -1 || maxY === -1) {
    return toDataUrl(sourceCanvas)
  }

  const pad = 4
  const trimmed = document.createElement('canvas')
  trimmed.width = (maxX - minX) + (pad * 2) + 1
  trimmed.height = (maxY - minY) + (pad * 2) + 1
  const trimmedCtx = trimmed.getContext('2d')

  if (!trimmedCtx) return toDataUrl(sourceCanvas)

  trimmedCtx.drawImage(
    sourceCanvas,
    minX,
    minY,
    (maxX - minX) + 1,
    (maxY - minY) + 1,
    pad,
    pad,
    (maxX - minX) + 1,
    (maxY - minY) + 1,
  )

  return toDataUrl(trimmed)
}

function extractFrame(image: HTMLImageElement, frame: SpriteFrame) {
  const canvas = document.createElement('canvas')
  canvas.width = frame.w
  canvas.height = frame.h
  const ctx = canvas.getContext('2d')

  if (!ctx) return ''

  ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h)

  const imageData = ctx.getImageData(0, 0, frame.w, frame.h)
  const { data } = imageData

  const leftEdge = Array.from({ length: frame.h }, (_, row) => averageEdgeColor(data, frame.w, row, 0, Math.min(8, frame.w)))
  const rightEdge = Array.from({ length: frame.h }, (_, row) => averageEdgeColor(data, frame.w, row, Math.max(0, frame.w - 8), frame.w))

  for (let y = 0; y < frame.h; y += 1) {
    const left = leftEdge[y]
    const right = rightEdge[y]

    for (let x = 0; x < frame.w; x += 1) {
      const index = ((y * frame.w) + x) * 4
      const t = frame.w > 1 ? x / (frame.w - 1) : 0
      const bgR = (left.r * (1 - t)) + (right.r * t)
      const bgG = (left.g * (1 - t)) + (right.g * t)
      const bgB = (left.b * (1 - t)) + (right.b * t)

      const diff = Math.max(
        Math.abs(data[index] - bgR),
        Math.abs(data[index + 1] - bgG),
        Math.abs(data[index + 2] - bgB),
      )

      if (diff < 26) {
        data[index + 3] = 0
      } else if (diff < 44) {
        data[index + 3] = Math.round(((diff - 26) / 18) * 255)
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return trimTransparentBounds(canvas)
}

export async function extractPartySprites(sheetSrc: string) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new Image()
    next.onload = () => resolve(next)
    next.onerror = () => reject(new Error('Unable to load sprite sheet'))
    next.src = sheetSrc
  })

  return SPRITE_FRAMES.map(frame => extractFrame(image, frame)).filter(Boolean)
}
