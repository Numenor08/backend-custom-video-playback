import express from 'express'
import uploadRoute from '@/routes/upload.route.js'
import colors from 'colors'
import streamRoute from './routes/stream.route.js'
import cors from 'cors'

const PORT = process.env.PORT || 3000
const server = express()
server.use(cors())
server.use('/api', uploadRoute)
server.use('/api', streamRoute)
server.listen(PORT, () => {
    console.log(colors.bgGreen('   STREAMING VIDEO PLAYBACK   '))
    console.log(`Server is running on port ${PORT}`)
})
