import { Router } from 'express'
import { upload } from '@/middlewares/upload.middleware.js'
import { uploadVideo, deleteVideo } from '@/controllers/file.controller.js'
import passport from 'passport'

const router: Router = Router()

router.use(passport.authenticate('jwt', { session: false }))
router.post('/upload', upload.single('video'), uploadVideo)
router.delete('/delete/:filename', deleteVideo)

export default router
