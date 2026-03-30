import type { Request, Response } from 'express'
import { successResponse, errorResponse } from '@/utils/api.util.js'
import { PipelineService } from '@/services/pipeline.service.js'
import { FileHandlingService } from '@/services/file.service.js'

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

        return res.json(
            successResponse('Successfully uploaded video', {
                originalName: req.file.originalname,
                fileName: req.file.filename,
                path: req.file.path,
                transcodeDuration: `${duration} seconds`,
            }),
        )
    } catch (error) {
        console.log(error)
        return res.status(500).json(errorResponse('Failed to upload video'))
    }
}

export const deleteVideo = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params as { filename: string }
        const fileHandler = new FileHandlingService()
        await fileHandler.deleteVideo(filename)
        return res.json(successResponse('Successfully deleted video'))
    } catch (error) {
        console.log(error)
        return res.status(500).json(errorResponse('Failed to delete video'))
    }
}
