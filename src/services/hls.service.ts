import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import type { Rendition } from '@/types/rendition.type.js'
import { getRenditions } from '@/libs/resolution.lib.js'
import type { VideoMetadata } from '@/types/video.type.js'

class HLSService {
    /**
     * Generate hls video format with multiple rendition from video input
     * @param inputPath original video path
     * @param outputBaseDir folder base output
     * @param fileName original video fileName
     */
    async generateMultiHLS(inputPath: string, outputBaseDir: string, fileName: string, metadata: VideoMetadata) {
        const baseDir = path.join(outputBaseDir, fileName)
        if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true })

        const { width, height } = metadata

        const renditions: Rendition[] = getRenditions(width, height)

        const splitLabels = renditions.map((_, i) => `[v${i}]`).join('')
        const scaleFilters = renditions.map((r, i) => `[v${i}]scale=${r.width}:${r.height}[v${i}out]`).join('; ')

        const filterComplex = `[0:v]split=${renditions.length}${splitLabels}; ${scaleFilters}`

        const command = ffmpeg(inputPath).complexFilter(filterComplex)

        // mapping + bitrate
        renditions.forEach((r, i) => {
            command.outputOptions([
                '-map',
                `[v${i}out]`,
                '-map',
                '0:a?',
                `-maxrate:v:${i}`,
                r.maxrate,
                `-bufsize:v:${i}`,
                r.buffsize,
                `-metadata:s:v:${i}`,
                `title=${r.name}`,
            ])
        })

        // global options
        command.outputOptions([
            '-preset',
            'fast',
            '-crf',
            '26',
            '-c:v',
            'libx264',
            '-c:a',
            'aac',
            '-f',
            'hls',
            '-hls_time',
            '5',
            '-hls_list_size',
            '0',
            '-hls_flags',
            'independent_segments',
            '-master_pl_name',
            'master.m3u8',

            '-var_stream_map',
            renditions.map((r, i) => `name:${r.name},v:${i},a:${i}`).join(' '),

            '-hls_segment_filename',
            `${baseDir}/%v/segment_%03d.ts`,
        ])

        command.output(`${baseDir}/%v/index.m3u8`)

        await new Promise<void>((resolve, reject) => {
            command
                .on('end', () => resolve())
                .on('error', reject)
                .run()
        })
    }
}

export default HLSService
