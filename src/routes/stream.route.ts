import { streamHLS, getSpriteThumbnail } from '@/controllers/stream.controller.js'
import { Router } from 'express'

const router: Router = Router()

router.get('/media/:id/sprite', getSpriteThumbnail)
router.get('/media/:id/:file', streamHLS)

export default router
