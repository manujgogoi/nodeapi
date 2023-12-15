import {Request, Response} from 'express';
import { deleteUserById, getUserByEmail, getUserById, getUsers } from "../models/User";

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await getUsers();
        return res.status(200).json({
            status: true,
            message: "All users",
            users
        });
    } catch (error) {
        console.log('getAllUsers Error: ', error);
        return res.status(400).json({
            status: false,
            message: "Something went wrong!"
        });
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedUser = await deleteUserById(id);

        return res.status(202).json({
            success: true,
            message: "User Deleted Successfully",
            data: {
                deletedUser
            }
        });
    } catch (error) {
        console.log("deleteUser Error: ", error);
        return res.status(400).json({
            success: false,
            message: "Delete user failed"
        });
    }
}

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { username, email } = req.body;

        const user = await getUserById(id);

        if(!user) {
            console.log("updateUser Error: Invalid user");
            return res.status(400).json({
                success: false,
                message: "Invalid user"
            });
        }

        if(username) {
            user.username = username;
        }

        if(email) {
            const existingUser = await getUserByEmail(email);
            if(existingUser) {
                console.log("updateUser Error: Email already exists");
                return res.status(400).json({
                    success: false,
                    message: "Email already exists, try another"
                });
            }
            user.email = email;
        }

        await user.save();
        return res.status(200).json({
            success: true,
            message: "User updated successfully!",
            data: {
                user
            }
        });


    } catch (error) {
        console.log("updateUser Error: ", error);
        return res.status(400).json({
            success: false,
            message: "Update user failed"
        });
    }
}