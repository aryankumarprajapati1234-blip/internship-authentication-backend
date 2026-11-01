import dotenv  from "dotenv";
dotenv.config();

if(!process.env.MONGO_URI){
    throw new Error("MONGO_URI is not defined in environment varibales")
    
}
if(!process.env.JWT_SECRET){
    throw new Error("jwt_scret is not defined in environement variables")
}

if(!process.env.GOOGLE_CLIENT_ID){
    throw new Error("client id is not defined in environement variables")
}
if(!process.env.GOOGLE_CLIENT_SECRET){
    throw new Error("client secret is not defined in environement variables")
}
if(!process.env.GOOGLE_REFRESH_TOKEN){
    throw new Error("refresh token is not defined in environement variables")
}
if(!process.env.GOOGLE_USER){
    throw new Error("user is not defined in environement variables")
}


const config={
    MONGO_URI:process.env.MONGO_URI,
    JWT_SECRET:process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN:process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_USER:process.env.GOOGLE_USER
}

export default config;