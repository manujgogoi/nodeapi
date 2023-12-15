import express from 'express';
import { createUser, getUserByEmail, getUserById, getUserByPhone } from '../models/User';
import { comparePasswords, hashPassword } from '../helpers/hashing';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AuthenticatedRequest } from '../middlewares/authentication';

dotenv.config();

export const register = async (req: express.Request, res: express.Response) => {
    try {
        const {email, phone, password, username, userType} = req.body;
        
        // Validate required fields
        if(!phone || !username || !password) {
            return res.status(400).json({
                "success": false,
                "message": "phone, username and password fields are required!"
            });
        }

        // Check for duplicate phone number
        const existingUser = await getUserByPhone(phone);
        if(existingUser) {
            return res.status(400).json({
                "success": false,
                "message": "Phone number already exists, try another"
            });
        }

        // Check for duplicate email if provided (Optional)
        if(email) {
            const existingEmailUser = await getUserByEmail(email);
            if(existingEmailUser) {
                return res.status(400).json({
                    "success": false,
                    "message": "Email already exists, try another"
                });
            }
        }

        // Create a new user
        const hashedPassword = await hashPassword(password);
        const user = await createUser({
            email,
            phone,
            username,
            userType : userType ? userType : "patient", // Default userType is "patient"
            password : hashedPassword
        });

        return res.status(200).json({
            "success": true,
            "message": "User registered successfully",
            "user": user
        });

    } catch (error) {
        console.log("Register User Error: ", error);
    }
}

export const login = async (req: express.Request, res: express.Response) => {
    try {
        const { phone, password } = req.body;
        
        // Validation
        if (!phone || !password) {
            return res.status(400).json({
                "success": false,
                "message": "username and password fields are required",
            });
        }

        // Get user
        const user = await getUserByPhone(phone).select('+password');

        if(!user) {
            console.log("Login error: User not found");
            return res.status(400).json({
                "success": false,
                "message": "Authentication failed",
            });
        }

        const passwordMatch = await comparePasswords(password, user.password);

        if(passwordMatch) {
            try {
                // JWT
                const accessPayload: JwtPayload = {
                    user: {
                        id: user.id,
                        username: user.username || "",
                        phone: user.phone,
                        email: user.email || "",
                        userType: user.userType
                    }
                };
                const refreshPayload: JwtPayload = {
                    user: {
                        id: user.id
                    }
                }
                const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
                const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "";
                const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || "";
                const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || "";
                
                const accessToken = jwt.sign(accessPayload, accessTokenSecret, { expiresIn: accessTokenExpiry});
                const refreshToken = jwt.sign(refreshPayload, refreshTokenSecret, { expiresIn: refreshTokenExpiry});

                res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
                .header('Authorization', accessToken);

                // Return Auth Success
                res.status(200).json({
                    "success": true,
                    "message": "Login successful",
                });
            } catch (error) {
                console.log("Login error (JWT): ", error);
            }
        }

    } catch (error) {
        console.log("Login error (User): ", error);
    }
}

export const refresh = async (req: express.Request, res: express.Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            "success": false,
            "message": "Access Denied. No refresh token provided.",
        });
    }

    try {
        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "";
        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
        const decoded = jwt.verify(refreshToken, refreshTokenSecret) as JwtPayload;

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
        const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || "";
        const accessToken = jwt.sign(accessPayload, accessTokenSecret, { expiresIn: accessTokenExpiry})

        res.header("Authentication", accessToken);
        res.status(200).json({
            "success": true,
            "message": "Access Token Refreshed",
            "data": accessPayload
        });
        
    } catch (error) {
        console.log("Auth Check (Refresh): ", error);
    }
}

export const authlink = async (req: AuthenticatedRequest, res: express.Response) => {
    return res.json({
        "Protected link": "Protected Link",
        "user": req.user
    });
}

export const guestlink = async (req: express.Request, res: express.Response) => {
    return res.json({
        "Guest link": "Guest Link"
    });
}