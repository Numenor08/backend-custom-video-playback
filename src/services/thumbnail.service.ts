import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'

export class ThumbnailService {
    async generateSpriteSheet(inputPath: string, outputDir: string, fileName: string, videoDuration: number, targetFrame: number): Promise<void> {
        const finalOutputDir = path.join(outputDir, fileName, 'preview')
        if (!fs.existsSync(finalOutputDir)) await fs.promises.mkdir(finalOutputDir, { recursive: true })
        const interval = videoDuration / targetFrame
        await this.createSpriteSheetVTT(inputPath, finalOutputDir, fileName, interval)
    }

    private createSpriteSheetVTT(inputPath: string, outputDir: string, fileName: string, interval: number): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .videoFilter([`fps=1/${interval}`, 'scale=160:-1', 'tile=10x10'])
                .outputOptions(['-frames:v 1'])
                .output(path.join(outputDir, `spritesheet.jpg`))
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run()
        })
    }
}
