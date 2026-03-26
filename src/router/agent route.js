import express from 'express';
import multer from 'multer';
import risk from '../controller/detectionSystem/riskCalculation logic.js';
import { asyncHandeller } from '../utils/asyncHandeller utils.js';
import session from '../controller/detectionSystem/registration logic.js';

const route = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

route.post("/registration", asyncHandeller(session.start, "registaring agent"));

route.post("/health", asyncHandeller(risk.calculator, "claculating of risk score for each device"));

route.post("/block", asyncHandeller(session.block, "blocking student"));

route.post("/screenshot", upload.single("screenshot"), asyncHandeller(session.uploadScreenshot, "screenshot during blocking"));

route.post("/unblock", asyncHandeller(session.unblock, "unblocking student"));

route.post("/screenshots/list", asyncHandeller(session.listScreenshots, "listing of screenshots"));

export default route;