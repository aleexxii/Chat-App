import express from 'express'
import isAuth from '../middleware/isAuth.js'
import { createNewChat, getAllChats, getMessagesByChat, sendMessage } from '../controllers/chat.js'
import { upload } from '../middleware/multer.js'
import { messageRateLimiter } from '../middleware/messageRateLimiter.js'
import { validateMessage } from '../middleware/messageValidate.js'

const router = express.Router()

router.post('/chat/new', isAuth, createNewChat)
router.get('/chat/all', isAuth, getAllChats)
router.post('/message', isAuth,messageRateLimiter,upload.single('image'),validateMessage ,sendMessage)
router.get('/message/:chatId', isAuth,getMessagesByChat)

export default router