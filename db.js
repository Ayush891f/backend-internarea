
const mongoose=require("mongoose")
require('dotenv').config()
    
const url=process.env.DATABASE
console.log("url",url)
module.exports.connect=()=>{
    mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.log(err));
}

