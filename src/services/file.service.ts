import fs from 'fs'
import path from 'path'

class FileHandlingService {
    async deleteVideo(fileName: string): Promise<void> {
        const hlsPath = path.join(process.cwd(), 'uploads', 'hls', fileName)
        const videoPath = path.join(process.cwd(), 'uploads', 'videos', `${fileName}.mp4`)
        await FileHandlingService.emptyDirectory(hlsPath)
        await Promise.all([fs.promises.rmdir(hlsPath), fs.promises.unlink(videoPath)])
    }

    async createVideoDirectorySync(): Promise<void> {
        const dirCollection = [
            path.join(process.cwd(), 'uploads'),
            path.join(process.cwd(), 'uploads', 'videos'),
            path.join(process.cwd(), 'uploads', 'hls'),
            path.join(process.cwd(), 'uploads', 'temps'),
        ]
        for (const dir of dirCollection) {
            if (!fs.existsSync(dir)) {
                await fs.mkdirSync(dir, { recursive: true })
            }
        }
    }

    static async emptyDirectory(dir: string): Promise<void> {
        try {
            const files = await fs.promises.readdir(dir)
            const deletePromises = files.map((file) => {
                const filePath = path.join(dir, file)
                return fs.promises.rm(filePath, { recursive: true, force: true })
            })
            await Promise.all(deletePromises)
        } catch (error) {
            throw new Error('Failed to empty directory', { cause: error })
        }
    }
}

export default FileHandlingService
