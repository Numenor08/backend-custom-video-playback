import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'

export class HLSService {
    async generateHLS(inputPath: string, outputBaseDir: string, fileName: string): Promise<void> {
        const hlsDir = path.join(outputBaseDir, 'hls', fileName)
        if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir, { recursive: true })

        const outputPath = path.join(hlsDir, 'index.m3u8')

        return new Promise<void>((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                    '-c:v libx264',
                    '-preset fast',
                    '-crf 28',
                    '-c:a aac',
                    '-b:a 128k',

                    '-hls_time 6', // segment 6s
                    '-hls_playlist_type vod',
                    '-hls_list_size 0',
                    '-start_number 0',
                ])
                .output(outputPath)
                .on('end', () => {
                    console.log('HLS generated:', outputPath)
                    resolve()
                })
                .on('error', reject)
                .run()
        })
    }
}
