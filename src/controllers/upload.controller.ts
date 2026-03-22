import type { Request, Response } from 'express'
import { PipelineService } from '@/services/pipeline.service.js'

export const uploadVideo = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File not found' })
        }
        const start = Date.now()
        const pipeline = new PipelineService()
        const fileName = req.file.filename
        const fileNameWithoutExtension = fileName.split('.').slice(0, -1).join('.')
        await pipeline.processVideo(req.file.path, fileNameWithoutExtension, req.file.originalname)
        const end = Date.now()
        const duration = ((end - start) / 1000).toFixed(2)

        return res.json({
            message: 'Successfully uploaded video',
            data: {
                originalName: req.file.originalname,
                fileName: req.file.filename,
                path: req.file.path,
                transcodeDuration: `${duration} seconds`,
            },
        })
    } catch (error) {
        return res.status(500).json({ message: 'Failed to upload video', error })
    }
}
