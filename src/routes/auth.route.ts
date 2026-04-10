import { Router } from 'express'
import { register, login, refreshToken, logout } from '@/controllers/auth.controller.js'
import passport from 'passport'

const router: Router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', passport.authenticate('jwt', { session: false }), logout)
router.post('/refresh-token', passport.authenticate('jwt', { session: false }), refreshToken)

export default router
