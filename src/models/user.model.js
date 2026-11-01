import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is required"],
        unique: [true, "username must be uniqued"]
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: [true, "email is required"]
    },
    password: {
        type: String,
        required: [true, "password is required"],
    },
   verified:{
    type:Boolean,
    default:false
    }
})
const userModel=mongoose.model("user",userSchema)


export default userModel;