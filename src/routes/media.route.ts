import { streamMedia, downloadVideo } from '@/controllers/media.controller.js'
import { Router } from 'express'

const router: Router = Router()

router.get('/stream/:id/*filePath', streamMedia)
router.get('/download/:id', downloadVideo)

export default router
