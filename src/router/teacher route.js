import express from 'express';
import { asyncHandeller } from '../utils/asyncHandeller utils.js';
import teacherAuth from '../controller/auth/teacherAuth logic.js';
import validate from '../middelewere/validate secure.js';
import validateRequest from '../middelewere/jsonValidation secure.js';
import verifyJWT from '../middelewere/jwtPerser secure.js';
import adminOnly from '../middelewere/admin secure.js';

const route = express.Router();

route.post("/create", verifyJWT,adminOnly, validate('teacher'), validateRequest, asyncHandeller(teacherAuth.create, "creating teacher account"));

route.post("/login", asyncHandeller(teacherAuth.login, "logging in student account"));

route.post("/logout", verifyJWT, asyncHandeller(teacherAuth.logout, "logging out teacher account"));

route.post("/profile", verifyJWT, asyncHandeller(teacherAuth.read, "getting teacher profile"));

route.post("/update", verifyJWT, asyncHandeller(teacherAuth.update, "updating teacher profile"));

route.post("/delete", verifyJWT, adminOnly, asyncHandeller(teacherAuth.delete, "deleting teacher profile"));

export default route;