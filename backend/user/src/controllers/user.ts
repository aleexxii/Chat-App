import type { Response } from "express";
import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import { User } from "../model/User.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";

export const loginUser = TryCatch(async (req, res) => {
  const { email } = req.body;
  console.log('reached login controller', email);

  const rateLimitKey = `otp:ratelimit:${email}`;

  const rateLimit = await redisClient.get(rateLimitKey);
  console.log('ckeck rate Limit : ', rateLimit);
  if (rateLimit) {
    res.status(429).json({
      message: "Too many Request. Please wait before requesting new otp",
    });
    return;
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, otp, {
    EX: 300,
  });

  await redisClient.set(rateLimitKey, "true", {
    EX: 60,
  });

  const message = {
    to: email,
    subject: "Your Otp code",
    body: `Your OTP is ${otp}. It is valid for 5 minutes`,
  };

  console.log('message : ', message);
console.log('📧 Queueing email TO:', email, typeof email, !!email);
  await publishToQueue("send-otp", message);

  res.status(200).json({
    message: "Otp sent to your mail",
  });
});

export const verifyUser = TryCatch(async (req, res) => {
  const { email, otp: enteredOtp } = req.body;
  console.log("Body from verifyUser controller : ", req.body);
  if (!email || !enteredOtp) {
    res.status(400).json({
      message: "Email and OTP required",
    });
    return;
  }

  const otpKey = `otp:${email}`;

  const storedOtp = await redisClient.get(otpKey);
  console.log("storedOtp : ", storedOtp, " enteredOtp : ", enteredOtp);

  if (!storedOtp || storedOtp !== enteredOtp) {
    return res.status(400).json({
      message: "Invalid or Expired Otp",
    });
  }

  await redisClient.del(otpKey);

  let user = await User.findOne({ email });

  if (!user) {
    const name = email.slice(0, 8);
    user = await User.create({ name, email });
  }

  const token = generateToken(user);

  res.json({
    message: "User Verified",
    user,
    token,
  });
});

export const myProfile = async(req : AuthenticatedRequest, res:Response)=>{
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  res.json({
    success : true,
    user : req.user
  })
}

export const updateName = TryCatch(async(req: AuthenticatedRequest, res) => {
  
  if (!req.user?._id) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const user = await User.findById(req.user?._id)

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.name = req.body.name;

  await user?.save()
  const token = generateToken(user)

res.json({
  message : 'User Updated',
  user,
  token
})
})

export const getAllUsers = TryCatch(async(req:AuthenticatedRequest, res)=>{
  const users = await User.find()

  res.json(users)
})

export const getAUser = TryCatch(async(req, res)=> {
  const user = await User.findById(req.params.id)

  res.json(user)
})
