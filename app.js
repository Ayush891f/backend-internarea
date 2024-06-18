require('dotenv').config();
const express = require('express');
const app = express();
const otpRouter = require('./Routes/otpRoutes');

app.use(express.json());
app.use('/api', otpRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
