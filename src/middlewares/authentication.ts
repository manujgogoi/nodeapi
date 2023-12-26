import express from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getUserById } from '../models/User';
dotenv.config();

interface DecodedAccessToken extends JwtPayload {
    user: {
      id: string;
      phone: string;
      username?: string;
      email?: string;
      userType: string;
      // Add other user-related fields here
    };
}

interface DecodedRefreshToken extends JwtPayload {
    user: {
      id: string;
      // Add other user-related fields here
    };
}
  
// Extend the Request type to include a user property
export interface AuthenticatedRequest extends express.Request {
    user?: DecodedAccessToken['user'];
}


export const isAuthenticated = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const accessToken = req.header('Authorization') || "";
    const refreshToken = req.cookies['refreshToken'];
    console.log("Middleware: access Token: ", accessToken);
    console.log("Middleware: refresh Token: ", refreshToken);

    if (!accessToken && !refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Access Denied. No Token provided'
        });
    }

    try {
        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
        const decoded = jwt.verify(accessToken, accessTokenSecret) as DecodedAccessToken;
        req.user = decoded.user;
        next();

    } catch (error) {
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Access Denied. No refresh token provided.'
            });
        }

        try {
            const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "";
            const decoded = jwt.verify(refreshToken, refreshTokenSecret) as DecodedRefreshToken;

            const user = await getUserById(decoded.user.id);
            
            if(!user) {
                return res.status(404).json({
                    "success": false,
                    "message": "User Not Found!"
                });
            }

            const accessPayload: JwtPayload = {
                user: {
                    id: user.id,
                    username: user.username || "",
                    phone: user.phone,
                    email: user.email || "",
                    userType: user.userType
                }
            };

            const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
            const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || "";
            const accessToken = jwt.sign(accessPayload, accessTokenSecret, { expiresIn: accessTokenExpiry})
    
            res.header("Authentication", accessToken)
                .cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: 'none', secure: true });

            req.user = accessPayload.user;
            next();

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Token'
            });
        }
    }
}

export const isOwner = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (id !== user?.id) {
            return res.status(403).json({
                "success": false,
                "message": "You are not the owner"
            });
        }
        next();
    } catch (error) {
        console.log("isOwner (Middleware) Error: ", error);
        return res.status(400).json({
            "success": false,
            "message": "isOwner Error"
        });
    }
}