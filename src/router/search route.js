import express from 'express';
import { asyncHandeller } from '../utils/asyncHandeller utils.js';
import search from '../controller/search/global search.js';
import verifyJWT from '../middelewere/jwtPerser secure.js';
import adminOnly from '../middelewere/admin secure.js';
import SearchHistory from '../controller/search/history search.js';

const route = express.Router();

// get the global search api
route.post("/global", verifyJWT, adminOnly, asyncHandeller(search.globalSearch, "global search including teacher and student"));

// get the profile
route.post("/profile", verifyJWT, adminOnly, asyncHandeller(search.readProfile, "global profile info detiling"));

// history creation
route.post("/history/create", verifyJWT, adminOnly, asyncHandeller(SearchHistory.create, "creating search history"));

// history deletion
route.post("/history/delete", verifyJWT, adminOnly, asyncHandeller(SearchHistory.delete, "deelting search history"));

// get all search history of one admin
route.post("/history", verifyJWT, adminOnly, asyncHandeller(SearchHistory.list, "listing all search history of admin"));

export default route;