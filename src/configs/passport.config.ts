import type { accessTokenPayload } from '@/types/auth.types.js'
import passport from 'passport'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import AuthService from '@/services/auth.service.js'

const authService = new AuthService()

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
}

passport.use(
    new JwtStrategy(jwtOptions, async function (payload: accessTokenPayload, done) {
        try {
            const user = await authService.getUserById(payload.userId)
            if (user) {
                done(null, user)
            } else {
                done(null, false)
            }
        } catch (error) {
            done(error, false)
        }
    }),
)
