import type { BaseApi } from '@/types/baseApi.type.js'

/**
 * Generate success response object
 * @param message response message
 * @param data response data
 */
export function successResponse(message: string = 'Operation successfully', data?: any): BaseApi { // eslint-disable-line
    return {
        status: 'success',
        message,
        data,
    }
}

/**
 * Generate failed response object
 * @param message response message
 * @param data response data
 */
export function errorResponse(message: string = 'An error occurred', data?: any): BaseApi { // eslint-disable-line
    return {
        status: 'error',
        message,
        data,
    }
}
