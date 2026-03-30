import type { Request, Response } from 'express'
import { errorResponse } from '@/utils/api.util.js'
import path from 'path'
import fs from 'fs'

export const streamMedia = async (req: Request, res: Response) => {
    try {
        const { id, filePath } = req.params as { id: string; filePath: string[] }
        const joinPath = filePath.join('/')
        const safePath = path.normalize(joinPath).replace(/^(\.\.(\/|\\|$))+/, '')
        const rootPath = path.join(process.cwd(), 'uploads', 'hls', id)
        const fullPath = path.join(rootPath, safePath)
        const allowedExtensions = ['.m3u8', '.ts', '.jpg', '.vtt']
        console.log('Streaming file:', fullPath)

        if (!fullPath.startsWith(rootPath)) {
            return res.status(403).send(errorResponse('Access denied', null))
        }

        if (!allowedExtensions.includes(path.extname(fullPath).toLowerCase())) {
            return res.status(403).send(errorResponse('Invalid file type', null))
        }

        if (!fs.existsSync(fullPath)) {
            return res.status(404).send(errorResponse('File not found', null))
        }

        const ext = path.extname(fullPath).toLowerCase()
        const mimeTypes = {
            '.m3u8': 'application/vnd.apple.mpegurl',
            '.ts': 'video/MP2T',
            '.jpg': 'image/jpeg',
            '.vtt': 'text/vtt',
        } as const

        res.setHeader('Content-Type', mimeTypes[ext as keyof typeof mimeTypes] || 'application/octet-stream')
        res.setHeader('Access-Ranges', 'bytes')
        res.setHeader('Cache-Control', 'public, max-age=31536000')

        fs.createReadStream(fullPath).pipe(res)
    } catch (error) {
        console.log(error)
        res.status(500).send(errorResponse('Failed to stream media', { error }))
    }
}
