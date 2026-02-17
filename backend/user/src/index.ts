import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import {createClient} from 'redis'
import userRoutes from './routes/user.js'
import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config();

connectDB()
connectRabbitMQ()

const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
export const redisClient = createClient({
  url : process.env.REDIS_URL as string
})

redisClient.connect().then(()=> console.log('connected to redis')).catch(console.error)


app.use('/api/v1', userRoutes)

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`server running on ${port}`);
});
