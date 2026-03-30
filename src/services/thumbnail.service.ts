import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import type { VideoMetadata } from '@/types/video.type.js'

class ThumbnailService {
    /**
     * Generate spritesheet for thumbnail timeline peek
     * @param inputPath original video path
     * @param outputDir folder output preview
     * @param fileName original video fileName
     * @param metadata metadata of video
     */
    async generateSpriteSheet(inputPath: string, outputDir: string, fileName: string, metadata: VideoMetadata): Promise<void> {
        const finalOutputDir = path.join(outputDir, fileName, 'preview')

        if (!fs.existsSync(finalOutputDir)) {
            await fs.promises.mkdir(finalOutputDir, { recursive: true })
        }

        const { width, height, duration } = metadata

        const thumbWidth = 160
        const thumbHeight = Math.round((thumbWidth / width) * height)

        // Determine interval
        const minFrames = 100
        const maxFrames = 1000
        let targetFrame = Math.floor(duration / 1)
        targetFrame = Math.max(minFrames, Math.min(targetFrame, maxFrames))
        const interval = duration / targetFrame
        const columns = 10
        const rows = Math.ceil(targetFrame / columns)

        await Promise.all([
            this.executeFFmpegSprite(inputPath, finalOutputDir, interval, thumbWidth, columns, rows),
            this.createVTTFile(finalOutputDir, duration, interval, thumbWidth, thumbHeight, columns),
        ])
    }

    private formatVTTTime(seconds: number): string {
        const date = new Date(0)
        date.setSeconds(seconds)
        const ms = Math.floor((seconds % 1) * 1000)
        return date.toISOString().substring(11, 19) + '.' + ms.toString().padStart(3, '0')
    }

    private executeFFmpegSprite(inputPath: string, outputDir: string, interval: number, width: number, columns: number, rows: number): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .videoFilter([`fps=1/${interval}`, `scale=${width}:-1`, `tile=${columns}x${rows}`])
                .outputOptions(['-frames:v 1'])
                .output(path.join(outputDir, `spritesheet.jpg`))
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run()
        })
    }

    private async createVTTFile(outputDir: string, duration: number, interval: number, w: number, h: number, columns: number): Promise<void> {
        let vttContent = 'WEBVTT\n\n'
        const totalFrames = Math.floor(duration / interval)

        for (let i = 0; i < totalFrames; i++) {
            const start = this.formatVTTTime(i * interval)
            const end = this.formatVTTTime((i + 1) * interval)

            const x = (i % columns) * w
            const y = Math.floor(i / columns) * h

            vttContent += `${start} --> ${end}\n`
            vttContent += `spritesheet.jpg#xywh=${x},${y},${w},${h}\n\n`
        }

        await fs.promises.writeFile(path.join(outputDir, 'thumbnails.vtt'), vttContent)
    }
}

export default ThumbnailService
