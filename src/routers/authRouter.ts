import express from 'express';
import { authlink, guestlink, login, refresh, register } from '../controllers/AuthController';
import { isAuthenticated } from '../middlewares/authentication';

export default (router: express.Router) => {
    router.post('/auth/register', register);
    router.post('/auth/login', login);
    router.post('/auth/refresh', refresh);
    router.get('/auth/authlink', isAuthenticated, authlink);
    router.get('/auth/guestlink', guestlink);
};