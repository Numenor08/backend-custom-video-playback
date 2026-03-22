import type { Rendition } from '@/types/rendition.type.js'
import { makeEven } from '@/helpers/math.helper.js'

export function getOrientation(width: number, height: number): 'landscape' | 'portrait' | 'square' {
    if (width > height) return 'landscape'
    else if (height > width) return 'portrait'
    else return 'square'
}

export function getResolutionCategory(width: number, height: number): 'SD' | 'HD' | 'FHD' | 'UHD' {
    const maxDim = Math.max(width, height)
    if (maxDim <= 854) return 'SD'
    else if (maxDim <= 1280) return 'HD'
    else if (maxDim <= 1920) return 'FHD'
    else return 'UHD'
}

export function getRenditions(inputWidth: number, inputHeight: number): Rendition[] {
    const aspect = inputWidth / inputHeight
    const orientation = getOrientation(inputWidth, inputHeight)

    const ladder = [
        { name: '360p', width: 640, height: 360, maxrate: '1200k', buffsize: '1200k' },
        { name: '480p', width: 854, height: 480, maxrate: '2250k', buffsize: '2250k' },
        { name: '720p', width: 1280, height: 720, maxrate: '4500k', buffsize: '4500k' },
        { name: '1080p', width: 1920, height: 1080, maxrate: '6000k', buffsize: '9000k' },
    ]

    return ladder
        .filter((l) => {
            // skip upscale except 360p
            if (l.name === '360p') return true

            const limit = aspect >= 16 / 10 ? inputWidth : inputHeight
            const target = aspect >= 16 / 10 ? l.width : l.height

            return target <= limit
        })
        .map((l) => {
            const isWide = aspect >= 16 / 10
            const isPortrait = orientation === 'portrait'

            let width: number
            let height: number

            if (isWide) {
                width = l.width
                height = makeEven(Math.round(width / aspect))
            } else {
                height = l.height
                width = makeEven(Math.round(height * aspect))
            }

            // swap if portrait
            if (isPortrait) {
                ;[width, height] = [height, width]
            }

            return {
                name: l.name,
                width,
                height,
                maxrate: l.maxrate,
                buffsize: l.buffsize,
            }
        })
}
