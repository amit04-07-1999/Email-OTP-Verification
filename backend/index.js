const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Initialize express and configure environment variables
const app = express();
dotenv.config();

// Middleware setup
app.use(bodyParser.json());
app.use(cors());

// MongoDB setup
const url = process.env.MONGODB_URI;
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

const connection = mongoose.connection;
connection.on(
  "error",
  console.error.bind(console, "MongoDB connection error:")
);
connection.once("open", () => {
  console.log("MongoDB database connected");
});

// OTP Schema and model
const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, index: { expires: 300 } }, // 5 minutes
});

const OTP = mongoose.model("OTP", otpSchema);

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: 'jayce.weber@ethereal.email',
    pass: 't8KtKtwFGXqUT7u45h'
},
});

// Send OTP endpoint
app.post("/sendOTP", async (req, res) => {
  const { email } = req.body;
  const otp_val = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

  const otpInstance = new OTP({ email, otp: otp_val });
  await otpInstance.save();

  async function main() {
    const info = await transporter.sendMail({
      from: '"AKY 👻"ameykumar76@gmail.com', // sender address
      to: email, // list of receivers
      subject: "Your OTP Code", // Subject line
      text: `Your OTP is ${otp_val}`, // plain text body
      html: `<h2>Your OTP is </h2>${otp_val}`, // html body
    });

    console.log("Message sent: %s", info.messageId);
  }

  try {
    await main();
    res.status(200).send("OTP sent");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending OTP");
  }
});

// Verify OTP endpoint
app.post("/verifyOTP", async (req, res) => {
  const { email, otp } = req.body;
  const otpRecord = await OTP.findOne({ email, otp });

  if (otpRecord) {
    res.status(200).send("Email address verified");
  } else {
    res.status(400).send("Invalid OTP");
  }
});

// Server setup
const port = process.env.PORT ;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
