import type { Request, Response } from 'express'
import { successResponse, errorResponse } from '@/utils/api.util.js'
import AuthService from '@/services/auth.service.js'

export async function register(req: Request, res: Response) {
    const { email, username, password, avatarUrl } = req.body
    const authService = new AuthService()
    try {
        const newUser = await authService.registerUser(email, username, password, avatarUrl)
        const data = { username: newUser.username, email: newUser.email }
        res.status(201).json(successResponse('User registered successfully', data))
    } catch (error) {
        if (error instanceof Error && (error.message === 'Email already in use' || error.message === 'Username already in use')) {
            return res.status(400).json(errorResponse(error.message))
        }
        console.error('Registration error:', error)
        res.status(500).json(errorResponse('Internal server error'))
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { username, password } = req.body
        const authService = new AuthService()
        const user = await authService.authenticateUser(username, password)
        if (!user) {
            return res.status(401).json(errorResponse('Invalid credentials'))
        }

        res.cookie('refreshToken', user.refreshToken, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        res.json(successResponse('Login successful', { user: user.data, accessToken: user.accessToken }))
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json(errorResponse('Internal server error'))
    }
}

export async function logout(req: Request, res: Response) {
    try {
        const { refreshToken } = req.cookies
        if (!refreshToken) {
            return res.status(400).json(errorResponse('No refresh token provided'))
        }
        const authService = new AuthService()
        await authService.logout(refreshToken)
        res.clearCookie('refreshToken', {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        })
        res.json(successResponse('Logout successful'))
    } catch (error) {
        console.error('Logout error:', error)
        res.status(500).json(errorResponse('Internal server error'))
    }
}

export async function refreshToken(req: Request, res: Response) {
    try {
        const { refreshToken } = req.cookies
        if (!refreshToken) {
            return res.status(401).json(errorResponse('No refresh token provided'))
        }
        const authService = new AuthService()
        const accessToken = await authService.generateAccessToken(refreshToken)
        res.json(successResponse('Access token refreshed successfully', { accessToken }))
    } catch (error) {
        console.error('Refresh token error:', error)
        res.status(500).json(errorResponse('Internal server error'))
    }
}
