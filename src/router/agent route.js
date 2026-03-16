import express from 'express';
import risk from '../controller/detectionSystem/riskCalculation logic.js';
import { asyncHandeller } from '../utils/asyncHandeller utils.js';
import session from '../controller/detectionSystem/registration logic.js';

const route = express.Router();

route.post("/registration", asyncHandeller(session.start, "registaring agent"));

route.post("/health", asyncHandeller(risk.calculator, "claculating of risk score for each device"));

route.post("/block", asyncHandeller(session.block, "blocking student"));

route.post("/unblock", asyncHandeller(session.unblock, "unblocking student"));

export default route;