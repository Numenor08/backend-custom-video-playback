import { Router } from 'express'
import { upload } from '@/middlewares/upload.middleware.js'
import { uploadVideo } from '@/controllers/upload.controller.js'

const router: Router = Router()

router.post('/upload', upload.single('video'), uploadVideo)

export default router
