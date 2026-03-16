import express from 'express';
import { asyncHandeller } from '../utils/asyncHandeller utils.js';
import exam from '../controller/examRoom/examRoom logic.js';
import monitoring from '../controller/examRoom/controlMonitoring logic.js';
import verifyJWT from '../middelewere/jwtPerser secure.js';

const route = express.Router();

route.post("/create", verifyJWT, asyncHandeller(exam.create, "creating exam room"));

route.post("/read", verifyJWT, asyncHandeller(exam.read, "getting info about exam room"));

route.post("/student/read", verifyJWT, asyncHandeller(exam.readStudentExam, "getting exam url"));

route.post("/start", verifyJWT, asyncHandeller(monitoring.start, "statring exam monitoring system"));

route.post("/read/session", verifyJWT, asyncHandeller(monitoring.read, "reading exam session"));

route.post("/stop", verifyJWT, asyncHandeller(monitoring.stop, "stopping the exam moonitoring system"));

route.post("/update", verifyJWT, asyncHandeller(exam.update, "updating exam room"));

route.post("/delete", verifyJWT, asyncHandeller(exam.delete, "deleting exam room"));

export default route;