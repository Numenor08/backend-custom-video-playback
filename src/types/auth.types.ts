import type { UUID } from 'crypto'

export interface User {
    id: UUID | string
    email: string
    username: string
    avatarUrl: string | null
    createdAt: Date
    updatedAt: Date
}

export interface refreshTokenPayload {
    userId: UUID
}
export interface accessTokenPayload extends refreshTokenPayload {
    username: string
}
