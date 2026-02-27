import jwt from 'jsonwebtoken';
import cryptoRandomString from "crypto-random-string";

export default class tokenAndCookies {

    // genarate acess token and send cookes for it
    static async acessTokenAndCookies(userInfo, role, res) {

        // token genaration
        const jwt_key = process.env.JWT_KEY;
        const session_Id = cryptoRandomString({ length: 10, type: 'numeric' })
        const accessToken = jwt.sign(
            {
                userId: userInfo._id,
                role: role,
                sessionId: session_Id
            },
            jwt_key,
            { expiresIn: '6h' }
        )

        // send cookies
        res.cookie("access_token", accessToken, {
            httpOnly: true,
            sameSite: "Lax",
            maxAge: 6 * 60 * 60 * 1000 // 6 hour
        });
    }

}