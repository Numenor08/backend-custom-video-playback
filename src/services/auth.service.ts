import type { User, refreshTokenPayload, accessTokenPayload } from '@/types/auth.types.js'
import type { UUID } from 'node:crypto'
import prisma from '@/libs/prisma.lib.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

class AuthService {
    private prisma: typeof prisma

    constructor() {
        this.prisma = prisma
    }

    async validateUser(username: string, password: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { username },
        })
        const isMatch = user ? await bcrypt.compare(password, user.password) : false
        if (user && isMatch) {
            const data = {
                id: user.id,
                email: user.email,
                username: user.username,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
            return data
        } else {
            return null
        }
    }

    async authenticateUser(username: string, password: string) {
        const user = await this.validateUser(username, password)
        if (!user) {
            return null
        }

        const data = { email: user.email, username: user.username }
        const payload = { userId: user.id, username: user.username } as accessTokenPayload
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' })
        const refreshToken = await this.generateRefreshToken(user.id)

        return { data, accessToken, refreshToken }
    }

    async registerUser(email: string, username: string, password: string, avatarUrl: string | null) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        })
        if (existingUser) {
            throw new Error(existingUser.email === email ? 'Email already in use' : 'Username already in use')
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10)
            const user = await this.prisma.user.create({
                data: { email, username, password: hashedPassword, avatarUrl },
            })
            return user
        } catch (error: unknown) {
            // Handle race condition
            if (error instanceof Error && 'code' in error && error.code === 'P2002') {
                throw new Error('Email or username has just been used', { cause: error })
            }
            throw error
        }
    }

    async logout(refreshToken: string) {
        await this.prisma.refreshToken.delete({
            where: { token: refreshToken },
        })
    }

    async revokeRefreshToken(refreshToken: string) {
        await this.prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        })
    }

    async generateRefreshToken(userId: UUID | string) {
        const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' })
        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        })
        return refreshToken
    }

    async generateAccessToken(refreshToken: string) {
        const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as refreshTokenPayload
        const refreshTokenData = await this.prisma.refreshToken.findFirst({
            where: { token: refreshToken, userId: payload.userId },
            select: {
                token: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        })
        if (!refreshTokenData) {
            throw new Error('Invalid refresh token')
        }
        const accessTokenPayload = { userId: refreshTokenData.user.id, username: refreshTokenData.user.username } as accessTokenPayload
        return jwt.sign(accessTokenPayload, process.env.JWT_SECRET!, { expiresIn: '15m' })
    }

    async getUserById(userId: UUID | string): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        })
    }
}

export default AuthService
