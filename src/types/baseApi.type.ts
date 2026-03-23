export interface BaseApi {
    status: 'success' | 'error'
    message?: string
    data?: any // eslint-disable-line
}
