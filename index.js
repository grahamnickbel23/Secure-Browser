import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './connectDB.js';
import studentRoute from './src/router/student route.js'
import teacherRoute from './src/router/teacher route.js'
import examRoute from './src/router/exam route.js'

const app = express();

const PORT = process.env.PORT;

// get basic middelewere
app.use(express.json());
app.use(cookieParser());

// connect db
connectDB();

// get the api route
app.use("/student", studentRoute);
app.use("/teacher", teacherRoute);
app.use("/exam", examRoute);

app.get("/test", (req, res) => {
    return res.status(200).json({
        success: true, 
        message: `working`
    })
})

app.listen(PORT, () => {
    console.log(`server is running at port: ${PORT}`)
})