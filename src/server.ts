import express from 'express';
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import cors from 'cors'
import router from './routers/index'

const createServer = () => {
    const app = express();

    app.use(cors({
        credentials: true,
    }))
    
    app.use(compression())
    app.use(cookieParser())
    app.use(bodyParser.json())

    // Routes
    app.use('/api/v1/', router());

    return app;
}

export default createServer;