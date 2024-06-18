
const mongoose=require("mongoose")
require('dotenv').config()
    
const url=process.env.DATABASE
module.exports.connect=()=>{
    mongoose.connect(url,console.log("Database is connected"))
}

