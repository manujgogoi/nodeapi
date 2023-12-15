# Steps

## Initialize project

```bash
npm init -y

```

## Install TypeScript

```bash
npm install -D  typescript ts-node
```

## Install nodemon

```bash
npm install -D nodemon
```

### Configure nodemon

Create a file in root dir called `nodemon.json`

```json
{
  "watch": ["src"],
  "ext": ".ts,.js",
  "exec": "ts-node ./src/index.ts"
}
```

## Configure TypeScript

```bash
npx tsc --init
```

This will create a `tsconfig.json` file
Configure the file

```json
{
  "compilerOptions": {
    /* Language and Environment */
    "target": "es2016" /* Set the JavaScript language version for emitted JavaScript and include compatible library declarations. */,

    /* Modules */
    "module": "commonjs" /* Specify what module code is generated. */,
    "moduleResolution": "node10" /* Specify how TypeScript looks up a file from a given module specifier. */,
    "baseUrl": "src" /* Specify the base directory to resolve non-relative module names. */,
    "sourceMap": true /* Create source map files for emitted JavaScript files. */,
    "outDir": "dist" /* Specify an output folder for all emitted files. */,
    "esModuleInterop": true /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. */,
    "forceConsistentCasingInFileNames": true /* Ensure that casing is correct in imports. */,

    /* Type Checking */
    "strict": true /* Enable all strict type-checking options. */,
    "noImplicitAny": true
  },
  "include": ["src/**/*"]
}
```

## Create `src/index.ts` file

- Write `console.log("Hello Typescript!")` inside the `index.ts` file (For Testing)
- Write `"start": "nodemon",` inside the `"script"` section of `package.json` file
- In terminal run the following command: `npm run start`

## Install `express`

```bash
npm i express body-parser cookie-parser compression cors
```

Install their types for typeScript

```bash
npm i -D @types/express @types/body-parser @types/cookie-parser @types/compression @types/cors
```

## Update the `index.ts` file

```javascript
import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";

const app = express();

app.use(
  cors({
    credentials: true,
  })
);

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const server = http.createServer(app);

server.listen(8080, () => {
  console.log(`The server is running on http://localhost:8080`);
});
```

## Setup MongoDB database

### Mongodb Atlas

- Go to [MongoDb Atlas](https://account.mongodb.com/)
- Sign in
- New Project
- Enter project name `nodetypescript`
- Click create project
- Create a Deployment
- Select **M0 FREE**
- Click `Create` button
- Create a new user by providing username and password
  - username: "manujgogoi"
  - password: "34Ftv5GbnwdGeRrC"
- Select "My Local Enviromnent"
- Select "Add My Current IP Address"
- Click "Finish and Close
- Go to "Databases" from Left menu
- Click on "Connect"
- Select "Connect to your application" > "Drivers"
- Copy the connection string
- In `index.ts` file update the following code

```javascript
server.listen(8080, () => {
  console.log(`The server is running on http://localhost:8080`);
});

const MONGO_URL =
  "mongodb+srv://manujgogoi:34Ftv5GbnwdGeRrC@cluster0.l4zgjsn.mongodb.net/?retryWrites=true&w=majority";
```

- Terminate the server

## Install `mongoose`

```bash
npm i mongoose @types/mongoose
```

> @types/mongoose is no longer needed. It is deprecated. But I am using for now.

## DB Connection testing in `index.ts` file

```javascript
const MONGO_URL =
  "mongodb+srv://manujgogoi:34Ftv5GbnwdGeRrC@cluster0.l4zgjsn.mongodb.net/?retryWrites=true&w=majority";

mongoose.Promise = Promise;
mongoose.connect(MONGO_URL);
mongoose.connection.on("error", (error: Error) => {
  console.log(error);
});
```

## Create DB Models (Schemas)

- Create a dir in `src` directory called `models`
- Inside the models create a file called `User.ts`
- Write the following codes inside the `User.ts` model file

```javascript
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  salt: { type: String, select: false },
  sessionToken: { type: String, select: false },
});

export const UserModel = mongoose.model("User", UserSchema);
```

## Create Controllers (Actions)

- Create `UserController.ts` inside the `controllers` dirctory
- Write the following codes inside the `UserController.ts` file

```javascript
import { UserModel } from "../models/User";

export const getUsers = () => UserModel.find();
export const getUserByEmail = (email: string) => UserModel.findOne({ email });
export const getUserBySessionToken = (sessionToken: string) =>
  UserModel.findOne({
    sessionToken: sessionToken,
  });
export const getUserById = (id: string) => UserModel.findById(id);
export const createUser = (values: Record<string, any>) =>
  new UserModel(values).save().then((user) => user.toObject());

export const deleteUserById = (id: string) =>
  UserModel.findOneAndDelete({ _id: id });
export const updateUserById = (id: string, values: Record<string, any>) =>
  UserModel.findByIdAndUpdate(id, values);
```

## Install `bcrypt` for hashing

```bash
npm install bcrypt @types/bcrypt
```

## Create helper functions for password hashing in `helpers/hashing.ts` file

```typescript
import bcrypt from "bcrypt";

export const hashPassword = async (password: string) => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
```

## Create `AuthController.ts` file

```typescript
import express from "express";
import { createUser, getUserByEmail, getUserByPhone } from "./UserController";
import { hashPassword } from "../helpers/hashing";

export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, phone, password, username } = req.body;

    // Validate required fields
    if (!phone || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "phone, username and password fields are required!",
      });
    }

    // Check for duplicate phone number
    const existingUser = await getUserByPhone(phone);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists, try another",
      });
    }

    // Check for duplicate email if provided (Optional)
    if (email) {
      const existingEmailUser = await getUserByEmail(email);
      if (existingEmailUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists, try another",
        });
      }
    }

    // Create a new user
    const hashedPassword = await hashPassword(password);
    const user = await createUser({
      email,
      phone,
      username,
      password: hashedPassword,
    });

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      user: user,
    });
  } catch (error) {
    console.log("Register User Error: ", error);
  }
};
```

## Routers

## Create `authRouter`

- In `routers` dirctory create `authRouter.ts` file and write the following code:

```typescript
import express from "express";
import { register } from "../controllers/AuthController";

export default (router: express.Router) => {
  router.post("/auth/register", register);
};
```

- In `routers` directory create another file called `index.ts` file and write the following code:

```typescript
import express from "express";
import authRouter from "./authRouter";

const router = express.Router();

export default (): express.Router => {
  authRouter(router);
  return router;
};
```

- In main `index.ts` file add the main router as given below:

```typescript
...
...
...
mongoose.Promise = Promise;
mongoose.connect(MONGO_URL)
mongoose.connection.on("error", ((error: Error) => {
    console.log(error)
}))

// Routes
app.use('/api/v1/', router());
```

## Setup `.env`

### Install dependencies

```bash
npm install @types/node dotenv
```

### Create `.env` file in project root

- Create `.env` file
- Add variables in `.env` file

```env
PORT=8080
MONGODB_URI=mongodb+srv://manujgogoi:34Ftv5GbnwdGeRrC@cluster0.l4zgjsn.mongodb.net/?retryWrites=true&w=majority
```

- In `src` dir, create a file called `process.env.d.ts`:

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      MONGODB_URI?: string;
      // add more environment variables and their types here
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
```

> `?:` is used to make variable optional

- In `index.ts` file import `dotenv`

```typescript
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT || 8181;
const MONGO_URI = process.env.MONGODB_URI || "";
```

## Create Login functionality

### 1. Install `jsonwebtoken`

```bash
npm i jsonwebtoken @types/jsonwebtoken
```

### 2. Create the `login` function in `conrollers/AuthController.ts` file

```typescript
import express from 'express';
import { createUser, getUserByEmail, getUserById, getUserByPhone } from './UserController';
import { comparePasswords, hashPassword } from '../helpers/hashing';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const register = async (req: express.Request, res: express.Response) => {
...
...
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
                        email: user.email || ""
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
                email: user.email || ""
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
```

- The `refresh` method is used to regenerate access token

### 3. Create an authentication middleware in `middlewares/authentication.ts` file:

```typescript
import express from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { getUserById } from "../controllers/UserController";
dotenv.config();

interface DecodedAccessToken extends JwtPayload {
  user: {
    id: string;
    phone: string;
    username?: string;
    email?: string;
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
interface AuthenticatedRequest extends express.Request {
  user?: DecodedAccessToken["user"];
}

const authenticate = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const accessToken = req.header("Authorization") || "";
  const refreshToken = req.cookies["refreshToken"];

  if (!accessToken && !refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Access Denied. No Token provided",
    });
  }

  try {
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
    const decoded = jwt.verify(
      accessToken,
      accessTokenSecret
    ) as DecodedAccessToken;
    req.user = decoded.user;
    next();
  } catch (error) {
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. No refresh token provided.",
      });
    }

    try {
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "";
      const decoded = jwt.verify(
        refreshToken,
        refreshTokenSecret
      ) as DecodedRefreshToken;

      const user = await getUserById(decoded.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User Not Found!",
        });
      }

      const accessPayload: JwtPayload = {
        user: {
          id: user.id,
          username: user.username || "",
          phone: user.phone,
          email: user.email || "",
        },
      };

      const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
      const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || "";
      const accessToken = jwt.sign(accessPayload, accessTokenSecret, {
        expiresIn: accessTokenExpiry,
      });

      res
        .header("Authentication", accessToken)
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          sameSite: "strict",
        });

      req.user = accessPayload.user;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid Token",
      });
    }
  }
};

export default authenticate;
```

### 4. Use the above middleware in specific routes to prevent unauthrorized access

In `routers/authRouter.ts` file

```typescript
import express from "express";
import {
  authlink,
  guestlink,
  login,
  refresh,
  register,
} from "../controllers/AuthController";
import authenticate from "../middlewares/authentication";

export default (router: express.Router) => {
  router.post("/auth/register", register);
  router.post("/auth/login", login);
  router.post("/auth/refresh", refresh);
  router.get("/auth/authlink", authenticate, authlink); // Protected route
  router.get("/auth/guestlink", guestlink);
};
```

---

## Improvement (Add userType field)

### 1. Update userSchema in `models/User.ts`

```typescript
const UserSchema = new mongoose.Schema({
    ...
    userType: {type: String, enum: ['admin', 'doctor', 'patient', 'hospital', 'lab'], default: 'patient'},
    ...
});
```

### 2. Update `register` function in `AuthController.ts`

- Update `req.body`

```typescript
const { email, phone, password, username, userType } = req.body;
```

- Update `createUser` section

```typescript
const user = await createUser({
  email,
  phone,
  username,
  userType: userType ? userType : "patient", // New Field
  password: hashedPassword,
});
```

### 3. Update `login` function in `AuthController.ts`

- Update `accessPayload` (Custom JwtPayload type for accessToken)

```typescript
const accessPayload: JwtPayload = {
  user: {
    // New property
    userType: user.userType,
  },
};
```

### 4. Update `refresh` function in `AuthController.ts`

- Update `accessPayload`

```typescript
const accessPayload: JwtPayload = {
  user: {
    // New property
    userType: user.userType,
  },
};
```

### 5. Update `authentication` middleware

- Add `userType` property to `DecodedAccessToken` interface

```typescript
interface DecodedAccessToken extends JwtPayload {
  user: {
    // New property
    userType: string;
  };
}
```

- Export `AuthenticationRequest` interface to be able to used by controller functions

```typescript
// Extend the Request type to include a user property
export interface AuthenticatedRequest extends express.Request {
  user?: DecodedAccessToken["user"];
}
```

### Use of `authentication` middleware

- In `authRouter.ts` add the middleware

```typescript
export default (router: express.Router) => {
  router.get("/auth/authlink", authenticate, authlink);
  // Other routes
};
```

- In `authlink` function under `AuthController.ts` file, we should import `AuthenticateRequest` so that we can access `req.user`

```typescript
export const authlink = async (
  req: AuthenticatedRequest,
  res: express.Response
) => {
  return res.json({
    "Protected link": "Protected Link",
    user: req.user,
  });
};
```

---

## Improvement (move basic db queries from `UserController.ts` to `models/User.ts`)

> Refacor related imports. Also remove unwanted queries

---

## Testing

- Install `jest`

```bash
npm i -D jest ts-jest @types/jest
```

- Install `supertest`

```bash
npm i -D supertest @types/supertest
```

- Configure jest which creates `jest.config.js`

```bash
npx ts-jest config:init
```

- Update contents of `jest.config.js`

```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/**/*.test.ts"],
  verbose: true,
  forceExit: true,
  // clearMocks: true,
};
```

- Create a directory `__tests__` in src directory
- Create a test file called `user.test.ts`

```typescript
describe("user", () => {
  describe("Get Users Route", () => {
    describe("given the user does not exist", () => {
      it("should return a 404", () => {
        expect(true).toBe(true);
      });
    });
  });
});
```

- Update the `package.json` file

```json
  "scripts": {
    "start": "nodemon",
    "test": "jest" // Add this code
  },
```

- Run the test

```bash
npm test
```

# Ready for deployment

- Update the `package.json` file

```json
  "scripts": {
    "dev": "nodemon",
    "test": "jest",
    "build": "npx tsc",
    "start": "node dist/index.js"
  },
```

- Create a `.env.example` file
- Create a `.gitignore` file with the following initial contents:

```sh
# API keys and secrets
.env

# Dependency directory
node_modules
bower_components

# Coverage reports
coverage

# OS metadata
.DS_Store
Thumbs.db

# Ignore built ts files
dist/**/*

# ignore yarn.lock
yarn.lock
```
