import redisClient from "../../../connectRedis.js";
import calculateRisk from "./riskScore logic.js";
import crypto from "crypto";

export default class risk {

    static async calculator(req, res) {

        // get all incoming info from client agent 
        const health = req.body;
        if (!health.sessionId || !health.timestamp || !health.signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid health payload"
            });
        }

        console.log(`health api info: ssid: ${JSON.stringify(health.sessionId)}, time: ${JSON.stringify(health.timestamp)}, sign: ${JSON.stringify(health.signature)}`);

        // get the session key
        const sessionKey = `session:${health.sessionId}`;

        // load session from redis
        const sessionRaw = await redisClient.get(sessionKey);

        // return error if session doesn't exist
        if (!sessionRaw) return res.status(401).json({ success: false, message: "Invalid or expired session" });

        const session = JSON.parse(sessionRaw);
        const secretKey = session.secretKey;

        // prevent replay attacks -- 10s window
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - health.timestamp) > 10) {
            return res.status(403).json({
                success: false,
                message: "Timestamp expired"
            });
        }

        // remove signature before verifying
        const { signature, ...payload } = health;

        // create stable string for signing
        const signString =
            payload.sessionId +
            payload.timestamp +
            JSON.stringify({
                foreground: payload.foreground,
                display: payload.display,
                activity: payload.activity,
                security: payload.security,
                system: payload.system
            });

        // recompute signature
        const expectedSignature = crypto
            .createHmac("sha256", secretKey)
            .update(signString)
            .digest("hex");

        if (expectedSignature !== signature) {
            return res.status(403).json({
                success: false,
                message: "Invalid signature"
            });
        }

        // calculate risk
        const newRiskState = calculateRisk(session, payload);

        // update session without destroying identity fields
        const updatedSession = {
            ...session,
            ...newRiskState,
            lastSeen: payload.timestamp
        };

        await redisClient.set(
            sessionKey,
            JSON.stringify(updatedSession),
            { EX: 150 } // to be 15 in production
        );

        // publish update
        await redisClient.publish(
            "risk_updates",
            JSON.stringify({
                sessionId: payload.sessionId,
                accountId: session.accountId,
                riskScore: updatedSession.riskScore
            })
        );

        // return ok if all ok
        return res.status(200).json({
            success: true,
            command: null
        });
    }
}