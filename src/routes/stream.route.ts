import { streamHLS } from '@/controllers/stream.controller.js'
import { Router } from 'express'

const router: Router = Router()

router.get('/hls/:id/:file', streamHLS)

export default router
