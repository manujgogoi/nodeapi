import { isAuthenticated, isOwner } from '../middlewares/authentication';
import { deleteUser, getAllUsers, updateUser } from '../controllers/UserController';
import express from 'express';

export default (router: express.Router) => {
    router.get('/users', isAuthenticated, getAllUsers);
    router.patch('/users/:id', isAuthenticated, isOwner, updateUser);
    router.delete('/users/:id', isAuthenticated, isOwner, deleteUser);
}