const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const dotenv = require('dotenv');
const cors = require('cors');
const { connect } = require('./db');
const router = require('./Routes/index');
const { sendEmailOtp, sendMobileOtp, verifyOtp } = require('./src/otpService');

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static('src/public'));

app.use("/api", router);

connect();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

const otps = {}; // To store OTPs temporarily

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/api/send-otp-email', (req, res) => {
  const email = req.body.email;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    } else {
      otps[email] = otp;
      res.json({ success: true });
    }
  });
});

app.post('/api/send-otp-mobile', (req, res) => {
  const mobile = req.body.mobile;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  twilioClient.messages
    .create({
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile,
    })
    .then((message) => {
      otps[mobile] = otp;
      res.json({ success: true });
    })
    .catch((error) => {
      console.error('Error sending OTP via Twilio:', error); // Log the error for debugging
      res.status(500).json({ success: false, message: 'An error occurred while sending OTP to your mobile', error: error.message });
    });
});

app.post('/api/verify-otp', (req, res) => {
  const { identifier, otp } = req.body;
  if (otps[identifier] && otps[identifier] === otp) {
    delete otps[identifier];
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid OTP' });
  }
});

app.get("/", (req, res) => {
  res.send("Hello This is My backend");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
