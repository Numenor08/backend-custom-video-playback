import fs from 'fs/promises'
import path from 'path'

export class FileHandlingService {
    async deleteVideo(fileName: string): Promise<void> {
        const hlsPath = path.join(process.cwd(), 'uploads', 'hls', fileName)
        const videoPath = path.join(process.cwd(), 'uploads', 'videos', `${fileName}.mp4`)
        await FileHandlingService.emptyDirectory(hlsPath)
        await fs.rmdir(hlsPath)
        await fs.unlink(videoPath)
    }

    static async emptyDirectory(dir: string): Promise<void> {
        try {
            const files = await fs.readdir(dir)
            const deletePromises = files.map((file) => {
                const filePath = path.join(dir, file)
                return fs.rm(filePath, { recursive: true, force: true })
            })
            await Promise.all(deletePromises)
        } catch (error) {
            throw new Error('Failed to empty directory', { cause: error })
        }
    }
}
