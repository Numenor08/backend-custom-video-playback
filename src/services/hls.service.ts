import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import type { Rendition } from '@/types/rendition.type.js'
import { getRenditions } from '@/libs/resolution.lib.js'

export class HLSService {
    async generateMultiHLS(inputPath: string, outputBaseDir: string, fileName: string) {
        const baseDir = path.join(outputBaseDir, 'hls', fileName)
        if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true })

        const metadata = await this.getVideoMetadata(inputPath)
        const width = metadata.width
        const height = metadata.height

        // Consider rendition
        const renditions: Rendition[] = getRenditions(width, height)

        // Generate HSL every rendition
        for (const r of renditions) {
            const outDir = path.join(baseDir, r.name)
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
            const outputPath = path.join(outDir, 'index.m3u8')
            await new Promise<void>((resolve, reject) => {
                ffmpeg(inputPath)
                    .outputOptions([
                        '-c:v libx264',
                        `-vf scale=${r.width}x${r.height}`,
                        '-preset fast',
                        '-crf 26',
                        '-c:a aac',
                        '-b:a 128k',
                        `-maxrate ${r.maxrate}`,
                        `-bufsize ${r.buffsize}`,
                        '-hls_time 6',
                        '-hls_playlist_type vod',
                        '-hls_list_size 0',
                    ])
                    .output(outputPath)
                    .on('end', () => {
                        console.log(`Finished processing ${r.name} rendition`)
                        resolve()
                    })
                    .on('error', reject)
                    .run()
            })
        }

        // Master playlist
        const masterPath = path.join(baseDir, 'master.m3u8')
        const masterContent = this.generateMaster(renditions)

        fs.writeFileSync(masterPath, masterContent)
    }

    private getVideoMetadata(inputPath: string): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) return reject(err)
                const stream = metadata.streams.find((s) => s.codec_type === 'video')
                if (!stream || !stream.height || !stream.width) return reject(new Error('No video stream found or dimensions are undefined'))
                resolve({ width: stream.width, height: stream.height })
            })
        })
    }

    private generateMaster(allRenditions: Rendition[]) {
        let masterContent = '#EXTM3U\n'

        allRenditions.forEach((r) => {
            const bandwidth = parseInt(r.maxrate, 10) * 1000

            masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${r.width}x${r.height}\n`
            masterContent += `${r.name}/index.m3u8\n`
        })

        return masterContent
    }
}
