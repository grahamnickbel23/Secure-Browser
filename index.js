import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from "http";
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectMongoDB from './connectMongo.js';

import studentRoute from './src/router/student route.js'
import teacherRoute from './src/router/teacher route.js'
import examRoute from './src/router/exam route.js'
import searchRoute from './src/router/search route.js'
import agentRoute from './src/router/agent route.js'

import initWebSocket from "./webSocket.js"

const app = express();
const PORT = process.env.PORT;

// middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// serve static files
app.use('/screenshots', express.static('screenshots'));

// connect database
connectMongoDB();

// routes
app.use("/student", studentRoute);
app.use("/teacher", teacherRoute);
app.use("/exam", examRoute);
app.use("/search", searchRoute);
app.use("/agent", agentRoute);

app.get("/test", (req, res) => {
    return res.status(200).json({
        success: true,
        message: `working`
    })
});

// create HTTP server
const server = http.createServer(app);

// initialize websocket
initWebSocket(server);

// start server
server.listen(PORT, () => {
    console.log(`server running at port ${PORT}`)
});