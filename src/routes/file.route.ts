import { Router } from 'express'
import { upload } from '@/middlewares/upload.middleware.js'
import { uploadVideo, deleteVideo } from '@/controllers/file.controller.js'

const router: Router = Router()

router.post('/upload', upload.single('video'), uploadVideo)
router.delete('/delete/:filename', deleteVideo)

export default router
