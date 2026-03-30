import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import type { VideoMetadata } from '@/types/video.type.js'

class PreviewService {
    /**
     * Generate video snippets preview from input video
     * @param inputPath original video path
     * @param outputDir folder output preview
     * @param fileName original video fileName
     * @param metadata metadata of video
     * @param snippetDuration snippet duration
     */
    public async generateSnippets(
        inputPath: string,
        outputDir: string,
        fileName: string,
        metadata: VideoMetadata,
        snippetDuration = 5,
    ): Promise<void> {
        const finalOutputDir = path.join(outputDir, fileName, 'preview')
        if (!fs.existsSync(finalOutputDir)) await fs.promises.mkdir(finalOutputDir, { recursive: true })
        const tempDir = path.join(process.cwd(), 'uploads', 'temps')
        if (!fs.existsSync(tempDir)) await fs.promises.mkdir(tempDir, { recursive: true })
        const { duration: videoDuration } = metadata

        if (videoDuration < 30) {
            throw new Error('Too short for preview generation. Minimum duration is 30 seconds!')
        }

        const snippetPaths: string[] = []
        const interval = videoDuration / 8

        let startTime = interval / 4
        let index = 1

        // Generate snippet
        while (startTime + snippetDuration <= videoDuration) {
            const outputSnippet = path.join(tempDir, `snippet_${index}_${fileName}.mp4`)
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
                .output(path.join(finalOutputDir, `preview.mp4`))
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run()
        })

        // Cleanup temp files
        snippetPaths.forEach((p) => fs.unlinkSync(p))
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
}

export default PreviewService
