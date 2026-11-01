import express from 'express'
import morgan from 'morgan';
import authRouter from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import cors from "cors";
const app=express();


app.use(express.json());
app.use(morgan('dev'))
app.use(cors({
    origin:
    ["http://localhost:5500","http://127.0.0.1:5500"],
    credentials:true
}))
app.use(cookieParser())

app.use("/api/auth",authRouter);

export default app;