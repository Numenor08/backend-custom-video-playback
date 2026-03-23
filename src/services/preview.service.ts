import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'

export class PreviewService {
    /**
     * Generate video snippets preview dari video input
     * @param inputPath original video path
     * @param fileName original video fileName
     * @param outputDir folder output preview
     * @param videoDuration total video duration
     * @param snippetDuration snippet duration
     */
    public async generateSnippets(inputPath: string, outputDir: string, fileName: string, videoDuration: number, snippetDuration = 5): Promise<void> {
        const finalOutputDir = path.join(outputDir, fileName)
        if (!fs.existsSync(finalOutputDir)) fs.mkdirSync(finalOutputDir, { recursive: true })
        const tempDir = path.join(outputDir, 'temps')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

        if (videoDuration < 30) {
            throw new Error('Too short for preview generation. Minimum duration is 30 seconds!')
        }

        const snippetPaths: string[] = []
        const interval = videoDuration / 8

        let startTime = interval / 4
        let index = 1

        // Generate snippet
        while (startTime + snippetDuration <= videoDuration) {
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
                .outputOptions(['-c:v h264_nvenc', '-cq 32', '-preset fast', '-an'])
                .output(path.join(finalOutputDir, `preview_${fileName}.mp4`))
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

    public async generateSpriteSheet(inputPath: string, outputDir: string, fileName: string, videoDuration: number, targetFrame: number): Promise<void> {
        const finalOutputDir = path.join(outputDir, fileName)
        if (!fs.existsSync(finalOutputDir)) fs.mkdirSync(finalOutputDir, { recursive: true })
        const interval = videoDuration / targetFrame
        await this.createSpriteSheetVTT(inputPath, finalOutputDir, interval)
    }

    private createSnippet(inputPath: string, outputPath: string, start: number, duration: number): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(start)
                .duration(duration)
                .size('?x240')
                .aspect('16:9')
                .autoPad()
                .outputOptions(['-an', '-c:v h264_nvenc', '-preset fast', '-cq 32', '-b:v 0'])
                .output(outputPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run()
        })
    }

    private createSpriteSheetVTT(inputPath: string, outputDir: string, interval: number): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .videoFilter([`fps=1/${interval}`, 'scale=160:-1', 'tile=10x10'])
                .outputOptions(['-frames:v 1'])
                .output(path.join(outputDir, 'spritesheet.jpg'))
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run()
        })
    }
}
