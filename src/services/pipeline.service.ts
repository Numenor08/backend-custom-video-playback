import ffmpeg from 'fluent-ffmpeg'
import PreviewService from '@/services/preview.service.js'
import HLSService from '@/services/hls.service.js'
import ThumbnailService from './thumbnail.service.js'
import type { VideoMetadata } from '@/types/video.type.js'
import fs from 'fs'
import path from 'path'

class PipelineService {
    private previewService = new PreviewService()
    private hlsService = new HLSService()
    private thumbnailService = new ThumbnailService()

    async processVideo(filePath: string, fileName: string, originalName: string): Promise<void> {
        try {
            const finalDir = path.join(process.cwd(), 'uploads', 'videos')
            if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true })
            const compressedPath = path.join(finalDir, `${fileName}.mp4`)
            await this.compressVideo(filePath, compressedPath)

            const [, metadata] = await Promise.all([fs.promises.unlink(filePath), this.getVideoMetadata(compressedPath)])

            const outputDir = path.join(process.cwd(), 'uploads', 'hls')

            await Promise.all([
                this.previewService.generateSnippets(compressedPath, outputDir, fileName, metadata, 3),
                this.thumbnailService.generateSpriteSheet(compressedPath, outputDir, fileName, metadata),
                this.hlsService.generateMultiHLS(compressedPath, outputDir, fileName, metadata),
            ])

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

    public getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) return reject(err)
                const stream = metadata.streams.find((s) => s.codec_type === 'video')
                const format = metadata.format
                if (!stream || !stream.height || !stream.width || !format.duration)
                    return reject(new Error('No video stream found or dimensions are undefined'))
                resolve({ width: stream.width, height: stream.height, duration: format.duration })
            })
        })
    }
}

export default PipelineService
