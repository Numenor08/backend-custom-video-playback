import { streamMedia } from '@/controllers/stream.controller.js'
import { Router } from 'express'

const router: Router = Router()

router.get('/media/:id/*filePath', streamMedia)

export default router
