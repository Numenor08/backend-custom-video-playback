import type { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'

export const streamHLS = (req: Request, res: Response) => {
    const { id, resolution, file } = req.params as { id: string; resolution: string; file: string }

    const filePath = path.join(process.cwd(), 'uploads/hls', id, resolution, file)

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' })
    }

    // set content type
    if (file.endsWith('.m3u8')) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
    } else if (file.endsWith('.ts')) {
        res.setHeader('Content-Type', 'video/mp2t')
    }

    fs.createReadStream(filePath).pipe(res)
}
