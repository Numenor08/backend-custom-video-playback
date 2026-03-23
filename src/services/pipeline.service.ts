import ffmpeg from 'fluent-ffmpeg'
import { PreviewService } from '@/services/preview.service.js'
import { HLSService } from '@/services/hls.service.js'
import fs from 'fs'
import path from 'path'

export class PipelineService {
    private previewService = new PreviewService()
    private hlsService = new HLSService()

    async processVideo(filePath: string, fileName: string, originalName: string): Promise<void> {
        try {
            // compress
            const finalDir = path.join(path.dirname(filePath), '../videos')
            if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true })
            const compressedPath = path.join(finalDir, `${fileName}.mp4`)
            await this.compressVideo(filePath, compressedPath)
            fs.unlinkSync(filePath)

            const duration = await this.getVideoDuration(compressedPath)

            // Generate preview
            await this.previewService.generateSnippets(compressedPath, './uploads/previews', fileName, duration, 3)

            // Generate sprite sheet
            await this.previewService.generateSpriteSheet(compressedPath, './uploads/previews', fileName, duration, 100)

            // Generate HLS
            await this.hlsService.generateMultiHLS(compressedPath, './uploads', fileName)

            console.log('Done Processing video for ', originalName)
        } catch (error) {
            console.error('Error processing video:', error)
            throw error
        }
    }

    private compressVideo(input: string, output: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(input)
                .outputOptions(['-c:v libx264', '-preset fast', '-crf 24', '-c:a aac', '-b:a 128k'])
                .output(output)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run()
        })
    }

    private getVideoDuration(inputPath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) return reject(err)
                resolve(metadata.format.duration || 0)
            })
        })
    }
}
