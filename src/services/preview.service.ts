import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'

export class PreviewService {
    /**
     * Generate video snippets preview dari video input
     * @param inputPath original video path
     * @param fileName original video fileName
     * @param outputDir folder output preview
     * @param snippetDuration snippet duration
     */
    async generateSnippets(inputPath: string, outputDir: string, fileName: string, snippetDuration = 5): Promise<void> {
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
        const tempDir = path.join(outputDir, 'temps')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

        const duration = await this.getVideoDuration(inputPath)

        if (duration < 30) {
            throw new Error('Too short for preview generation. Minimum duration is 30 seconds!')
        }

        const snippetPaths: string[] = []
        const interval = duration / 8

        let startTime = interval / 4
        let index = 1

        // Generate snippet
        while (startTime + snippetDuration <= duration) {
            const outputSnippet = path.join(tempDir, `snippet_${index}.mp4`)
            snippetPaths.push(outputSnippet)

            await this.createSnippet(inputPath, outputSnippet, startTime, snippetDuration)

            startTime += interval
            index++
        }

        // Concat snippets
        await new Promise<void>((resolve, reject) => {
            let ffmpegCmd = ffmpeg()
            snippetPaths.forEach((file) => (ffmpegCmd = ffmpegCmd.input(file)))

            ffmpegCmd
                .complexFilter([
                    {
                        filter: 'concat',
                        options: { n: snippetPaths.length, v: 1, a: 0 },
                    },
                ])
                .outputOptions(['-c:v h264_nvenc', '-cq 32', '-b:v 0', '-preset fast', '-an'])
                .output(path.join(outputDir, fileName))
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run()
        })

        // Cleanup temp files
        snippetPaths.forEach((p) => fs.unlinkSync(p))
        if (fs.existsSync(tempDir)) {
            fs.rmdirSync(tempDir)
        }
    }

    private getVideoDuration(inputPath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) return reject(err)
                resolve(metadata.format.duration || 0)
            })
        })
    }

    private createSnippet(inputPath: string, outputPath: string, start: number, duration: number): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(start)
                .duration(duration)
                .size('?x240') // resize
                .outputOptions([
                    '-an', // no audio
                    '-c:v h264_nvenc', // codec video
                    '-preset fast',
                    '-cq 32',
                    '-b:v 0',
                ])
                .output(outputPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run()
        })
    }
}
