import createServer from './server'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config();

const app = createServer();

const port = process.env.PORT || 8181;
const MONGO_URI = process.env.MONGODB_URI || "";

app.listen(port, () => {
    console.log(`The server is running on http://localhost:${port}`)
})

mongoose.Promise = Promise;
mongoose.connect(MONGO_URI);
mongoose.connection.on("error", ((error: Error) => {
    console.log(error)
}))