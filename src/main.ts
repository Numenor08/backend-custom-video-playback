import express from 'express'
import fileRoute from '@/routes/file.route.js'
import mediaRoute from './routes/media.route.js'
import { rateLimit } from 'express-rate-limit'
import FileHandlingService from './services/file.service.js'
import colors from 'colors'
import cors from 'cors'

const PORT = process.env.PORT || 3000
const server = express()

const fileService = new FileHandlingService()
fileService.createVideoDirectorySync().then(() => {
    console.log(colors.green('Upload directories are ready!'))
})

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
})

server.use(cors())
server.use('/api/file', limiter, fileRoute)
server.use('/api/media', mediaRoute)
server.listen(PORT, () => {
    console.log(colors.bgGreen('   STREAMING VIDEO PLAYBACK   '))
    console.log(`Server is running on port ${PORT}`)
})
