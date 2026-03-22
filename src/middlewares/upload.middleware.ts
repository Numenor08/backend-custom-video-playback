import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { nanoid } from 'nanoid'

// Prepare directory
const uploadDir = path.join(import.meta.dirname, '../../uploads/temps')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir)
    },
    filename: (_req, file, cb) => {
        const uniqueName = nanoid()

        const ext = path.extname(file.originalname)

        cb(null, `${uniqueName}${ext}`)
    },
})

// Video file only filter
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true)
    } else {
        cb(new Error('Only video files are allowed!'))
    }
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5000 * 1024 * 1024 } }) // limit 5gb
