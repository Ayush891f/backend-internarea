require('dotenv').config();
const express = require('express');
const app = express();
const otpRouter = require('./Routes/otpRoutes');
const path=require("path");
const build = require("build");
app.use(express.json());
app.use('/api', otpRouter);


const PORT = process.env.PORT || 5000;
app.get("/",(req,res)=>{
  app.use(express.static(path.resolve(__dirname,"frontend","build")));
  res.sendFile(path.resolve(__dirname,"frontend",build,"index.html"));
});
app.use(express.static(build));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
