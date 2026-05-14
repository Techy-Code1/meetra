import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(cors({
    origin : process.env.CORS_ORIGIN ,
    credentials : true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true , limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes
import authRouter from './routes/auth.routes.js'
import profileRouter from "./routes/profile.routes.js"
import meetingRouter from './routes/meeting.routes.js'
import roomRouter from "./routes/room.routes.js"

app.use('/api/v1/auth' , authRouter)
app.use("/api/v1/profile" , profileRouter)
app.use('/api/v1/meeting' , meetingRouter)
app.use('/api/v1/room' ,  roomRouter)

// http://localhost:8000/api/v1/meeting/history?status=ended&search=team&from_date=2026-01-01&page=2&limit=5
// http://localhost:8000/api/v1/users/register
export {app}