import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import chatRoutes from './routes/chat.js'

dotenv.config()

connectDB()

const app = express()

app.use(express.json())
// app.use(express.urlencoded({ extended: true }));
app.use('/api/v1', chatRoutes)

const PORT = process.env.PORT || 8080

app.listen(PORT, ()=>{
    console.log(`server running on ${PORT}`);
})