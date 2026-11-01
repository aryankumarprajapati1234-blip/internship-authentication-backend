import userModel from "../models/user.model.js";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import { sendEmail } from "../services/email.services.js";
import { generateOTP,getOTPHTML } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";

export async function register(req, res) {
    const { username, email, password } = req.body;
    const isAlreadyRegistered = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    if (isAlreadyRegistered) {
        return res.status(409).json({
            Message: "username or email already exist"
        })
    }
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    })
    
    const otp= generateOTP();
    const html=getOTPHTML(otp);

    const otpHash=crypto.createHash("sha256").update(otp).digest("hex")

    await otpModel.create({
        email,
        user:user._id,
        otpHash
    })

    await sendEmail(email,"OTP Verification",`your otp is ${otp}`,html)

    res.status(201).json({
        message: "user registered successfully",
        user: {
            username: user.username,
            email: user.email,
            verified:user.verified
        },
    })
}

export async function login(req,res){
    const {email,password}=req.body;
    const user=await userModel.findOne({email})
    if(!user){
       return res.status(401).json({
            message:"invalid email or password"
        })
    }
    if(!user.verified){
        return res.status(401).json({
            message:"email not verified"
        })
    }
    const hashedPassword=crypto.createHash("sha256").update(password).digest("hex")
    const isPasswordValid=hashedPassword===user.password
    if(!isPasswordValid){
        return res.status(401).json({
            message:"invalid email or password"
        })
    }
    const refreshToken=jwt.sign({
        id:user._id,
    },config.JWT_SECRET,{
        expiresIn:"7d"              
    })
    const refreshTokenHash=crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session =await sessionModel.create({
        user:user._id,
        refreshTokenHash,
        ip:req.ip,
        userAgent:req.headers["user-agent"]
    })
    const accessToken=jwt.sign({
        id:user._id,
        sessionId:session._id,
    },config.JWT_SECRET,{
        expiresIn:"15m"
    })
    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",

        sameSite:"strict",
        path:"/",
        maxAge:7*24*60*60*1000
    })
    res.status(200).json({
        message:"logged in successfully",
        user:{
            username:user.username,
            email:user.email,
        },
        accessToken
    })

}
export async function getMe(req, res) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "token not found"
        })
    }
    const decoded = jwt.verify(token, config.JWT_SECRET)
    console.log(decoded)
    const user = await userModel.findById(decoded.id)
    res.status(200).json({
        message: "user fetched successfully",
        user: {
            username: user.username,
            email: user.email
        }
    })
}

export async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
        return res.status(401).json({
            message: "refresh token not found"
        })
    }
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })
    if (!session) {
        return res.status(401).json({
            message: "invalid refresh token"
        })
    }
    const accessToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        })

    const newRefreshToken = jwt.sign({
        id: decoded.id,
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
        })

    const newrefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex")

       session.refreshTokenHash = newrefreshTokenHash;
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.status(200).json({
        message: "access token refreshed successfully",
        accessToken
    })
}

export async function logout(req, res) {

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({
            message: "refresh token not found"
        })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");


    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })// this function is used for finding session 
    if (!session) {
        return res.status(400).json({
            message: "invalid refresh token"
        })
    }
    session.revoked = true
    await session.save();

res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
});
}  

export async function logoutAll(req,res){
    const refreshToken=req.cookies.refreshToken
    if(!refreshToken){
        return res.status(400).json({
            message:"refresh token not found"
        })
    }
    const decoded =jwt.verify(refreshToken,config.JWT_SECRET)
    await sessionModel.updateMany({
        user:decoded.id,
        revoked:false},{
revoked:true
    })

   res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
});

}

export async function verifyemail(req,res) {
     const {otp,email}=req.body;

     const otpHash=crypto.createHash("sha256").update(otp).digest("hex")

     const otpDoc=await otpModel.findOne({
        email,
        otpHash
     })
     if(!otpDoc){
        return res.status(400).json({
            message:"invalid otp"
        })
     }
     const user=await userModel.findByIdAndUpdate(otpDoc.user,{
        verified:true
     },
    {new:true})
     await otpModel.deleteMany({
        user:otpDoc.user
     })
     return res.status(200).json({
        message:"Email verified successfully",
        user:{
            username:user.username,
            email:user.email,
            verified:user.verified
        }
     })

}
