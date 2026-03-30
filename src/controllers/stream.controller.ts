import type { Request, Response } from 'express'
import { errorResponse } from '@/utils/api.util.js'
import path from 'path'
import fs from 'fs'

export const streamMedia = async (req: Request, res: Response) => {
    try {
        const { id, filePath } = req.params as { id: string; filePath: string[] }
        // Path ini otomatis akan menyesuaikan, mau itu "master.m3u8"
        // atau "720p/segment_001.ts", semua tertangkap di `filePath`
        const clearPath = filePath.join('/')
        const fullPath = path.join(process.cwd(), 'uploads', 'hls', id, clearPath)
        console.log(clearPath)

        if (!fs.existsSync(fullPath)) {
            return res.status(404).send(errorResponse('File not found', null))
        }

        // Tentukan Content-Type secara dinamis
        const ext = path.extname(clearPath)
        const mimeTypes = {
            '.m3u8': 'application/vnd.apple.mpegurl',
            '.ts': 'video/MP2T',
            '.jpg': 'image/jpeg',
            '.vtt': 'text/vtt',
        } as const

        res.setHeader('Content-Type', mimeTypes[ext as keyof typeof mimeTypes] || 'application/octet-stream')
        res.setHeader('Access-Ranges', 'bytes')
        res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache biar kenceng

        // Alirkan datanya
        fs.createReadStream(fullPath).pipe(res)
    } catch (error) {
        console.log(error)
        res.status(500).send(errorResponse('Failed to stream media', { error }))
    }
}
