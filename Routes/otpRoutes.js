const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

router.post('/send-sms-otp', (req, res) => {
  const { phoneNumber } = req.body;
  client.verify.services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verifications
    .create({ to: phoneNumber, channel: 'sms' })
    .then(verification => res.status(200).send(verification))
    .catch(error => res.status(500).send(error));
});

router.post('/send-email-otp', (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).send('OTP sent to email');
  });
});

module.exports = router;
