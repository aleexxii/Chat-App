import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const startSendOtpConsumer = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.Rabbitmq_Host,
      port: 5672,
      username: process.env.Rabbitmq_Username,
      password: process.env.Rabbitmq_Password,
    });

    const channel = await connection.createChannel();

    const queueName = "send-otp";

    await channel.assertQueue(queueName, { durable: true });

    console.log("✅ mail service consumer started , listening for otp emails");

    channel.consume(queueName, async (msg) => {
      if (!msg?.content) {
        console.log("⚠️ Empty message - ACK");
        return channel.ack(msg!);
      }

      if (msg) {
        try {
          const { to, subject, body } = JSON.parse(msg.content.toString());

          if (!to || typeof to !== "string" || !to.includes("@")) {
            console.error("❌ INVALID EMAIL - NACK & discard:", to);
            return channel.nack(msg, false, false);
          }

          const transport = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            auth: {
              user: process.env.USER,
              pass: process.env.PASSWORD,
            },
          });
          await transport.sendMail({
            from: "Chat App",
            to,
            subject,
            text: body,
          });
          console.log("📨 Valid email:", to);
          channel.ack(msg);
        } catch (err) {
          console.error("❌ Parse/Send failed:", err);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.log("Failed to start rabbitmq consumer ", error);
  }
};
