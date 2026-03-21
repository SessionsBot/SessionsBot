import { createCanvas, loadImage } from '@napi-rs/canvas'
import { AttachmentBuilder } from 'discord.js'

type EventImageOptions = {
    title: string
    timeText: string
    guildIconUrl?: string
    botIconUrl?: string
    showWatermark?: boolean
}

export async function getEventImage({
    title,
    timeText,
    guildIconUrl,
    botIconUrl,
    showWatermark = true
}: EventImageOptions) {

    const width = 1200
    const height = 500

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // -------------------------
    // BACKGROUND
    // -------------------------

    const bgImg = await loadImage(
        'https://img.freepik.com/free-photo/artistic-blurry-colorful-wallpaper-background_58702-8178.jpg'
    )

    ctx.drawImage(bgImg, 0, 0, width, height)

    // dark overlay
    ctx.fillStyle = '#00000080'
    ctx.fillRect(0, 0, width, height)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // -------------------------
    // GUILD ICON
    // -------------------------

    if (guildIconUrl) {

        const icon = await loadImage(guildIconUrl)

        const iconSize = 120
        const x = width / 2 - iconSize / 2
        const y = height * 0.25 - iconSize / 2

        ctx.save()

        ctx.beginPath()
        ctx.arc(width / 2, height * 0.25, iconSize / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()

        ctx.drawImage(icon, x, y, iconSize, iconSize)

        ctx.restore()
    }

    // -------------------------
    // TITLE TEXT
    // -------------------------

    const maxWidth = 900

    let fontSize = 72
    ctx.font = `bold ${fontSize}px sans-serif`

    // auto scale font if extremely long
    while (ctx.measureText(title).width > maxWidth && fontSize > 36) {
        fontSize -= 2
        ctx.font = `bold ${fontSize}px sans-serif`
    }

    const lines = wrapText(ctx, title, maxWidth)

    const lineHeight = fontSize + 10
    const startY = height * 0.52 - ((lines.length - 1) * lineHeight) / 2

    ctx.fillStyle = '#ffffff'

    lines.forEach((line, i) => {
        ctx.fillText(line, width / 2, startY + i * lineHeight)
    })

    // -------------------------
    // TIME TEXT
    // -------------------------

    ctx.font = '32px sans-serif'
    ctx.fillStyle = '#d0d4db'

    ctx.fillText(timeText, width / 2, height * 0.75)

    // -------------------------
    // WATERMARK
    // -------------------------

    if (showWatermark && botIconUrl) {

        const icon = await loadImage(botIconUrl)

        const iconSize = 40
        const padding = 30

        const text = 'SessionsBot'

        ctx.font = '28px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillStyle = '#c9ccd2'

        const textWidth = ctx.measureText(text).width

        const textX = width - padding
        const textY = height - 50

        ctx.fillText(text, textX, textY)

        ctx.drawImage(
            icon,
            textX - textWidth - iconSize - 12,
            textY - iconSize / 1.5 + 8,
            iconSize,
            iconSize
        )
    }

    // -------------------------
    // OUTPUT
    // -------------------------


    const result = await canvas.encode('png')
    return result
}

function wrapText(ctx: any, text: string, maxWidth: number) {

    const words = text.split(' ')
    const lines: string[] = []

    let line = ''

    for (const word of words) {

        const testLine = line + word + ' '
        const { width } = ctx.measureText(testLine)

        if (width > maxWidth && line !== '') {
            lines.push(line.trim())
            line = word + ' '
        } else {
            line = testLine
        }
    }

    lines.push(line.trim())

    return lines
}
