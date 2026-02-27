import express from 'express';
import { asyncHandeller } from '../utils/asyncHandeller utils.js';
import studentAuth from '../controller/auth/studentAuth logic.js';
import validate from '../middelewere/validate secure.js';
import validateRequest from '../middelewere/jsonValidation secure.js';
import verifyJWT from '../middelewere/jwtPerser secure.js';
import adminOnly from '../middelewere/admin secure.js';

const route = express.Router();

// admin only
route.post("/create", verifyJWT, adminOnly, validate('student'), validateRequest, asyncHandeller(studentAuth.create, 'creating student account'));

route.post("/login", asyncHandeller(studentAuth.login, "logging in student account"));

route.post("/logout", verifyJWT, asyncHandeller(studentAuth.logout, "logging out student account"));

// admin only
route.get("/getall", verifyJWT, asyncHandeller(studentAuth.getAll, "get all student data"));

route.post("/profile", verifyJWT, asyncHandeller(studentAuth.read, "reading student profile"));

// admin only
route.post("/update", verifyJWT, adminOnly, asyncHandeller(studentAuth.update, "updating student profile"));

route.post("/delete", verifyJWT, adminOnly, asyncHandeller(studentAuth.delete, "deleting student profile"));

export default route;