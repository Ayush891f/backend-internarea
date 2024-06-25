const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const dotenv = require('dotenv');
const cors = require('cors');
const { connect } = require('./db');
const useragent = require('express-useragent');
const router = require('./Routes/index');
// const { sendEmailOtp, sendMobileOtp, verifyOtp } = require('./src/otpService');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static('src/public'));
app.use(useragent.express());
app.use(bodyParser.json());
app.use(cors());

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
  console.log("hi");
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
  console.log("himobile")
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


app.post('/api/send-otp-email', (req, res) => {
  console.log("hi2");
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


// mongoose.connect('mongodb://localhost:27017/loginDB', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

const loginSchema = new mongoose.Schema({
  userId: String,
  ip: String,
  browser: String,
  os: String,
  device: String,
  loginTime: { type: Date, default: Date.now }
});

const Login = mongoose.model('Login', loginSchema);

app.post('/login', async (req, res) => {
  const userAgent = req.useragent;
  const ip = req.ip;
  const browser = userAgent.browser;
  const os = userAgent.os;
  const device = userAgent.isMobile ? 'Mobile' : 'Desktop';


  // Save login information
  const login = new Login({ userId: req.body.userId, ip, browser, os, device });
  await login.save();

  const now = new Date();
  const hours = now.getHours();

  if (device === 'Mobile' && (hours < 10 || hours > 13)) {
    return res.status(403).json({ error: 'Access restricted to 10 AM to 1 PM for mobile devices' });
  }

  if (browser === 'Chrome') {
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    login.otp = otp;
    login.otpExpires = new Date(Date.now() + 15 * 60 * 1000); // OTP expires in 15 minutes
    await login.save();

    // Trigger OTP via email
    sendOtpEmail(req.body.email, otp);
    return res.status(200).json({ message: 'OTP sent to your email. Please verify.', loginId: login._id });
  }

  if (browser === 'Edge') {
    // Allow access without additional authentication
    return res.status(200).json({ message: 'Access granted without authentication.' });
  }

  return res.status(403).json({ error: 'Access denied' });
});

let otpss = {};
app.post('/verifyotp', (req, res) => {
  const { userId, otp } = req.body;
  if (otps[userId] && otpss[userId] === otp) {
    delete otpss[userId]; // OTP is used and should be invalidated
    res.status(200).json({ message: 'OTP verified successfully.' });
  } else {
    res.status(400).json({ error: 'Invalid OTP.' });
  }
});

function sendOtpEmail(email, userId) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[userId] = otp; // Store OTP with userId

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ayushgupta68687@gmail.com',
      pass: 'yztt duco xrgv zmmc',
    }
  });

  const mailOptions = {
    from: 'ayushgupta68687@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Email sent: ' + info.response);

  });
}

app.get('/login-history', async (req, res) => {
  const userId = req.query.userId;
  const history = await Login.find({ userId }).sort({ loginTime: -1 });
  res.json(history);
});

app.get("/", (req, res) => {
  res.send("Hello This is My backend");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
