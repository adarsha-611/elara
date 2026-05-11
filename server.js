import express from "express";
import path from "path";
import dotenv from "dotenv"
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";
import flash from "connect-flash";
import mongoose from "mongoose";
import morgan from "morgan";
import db from "./src/config/db.js";
import authRouter from "./src/routes/auth/authRouter.js"
import passport from "./src/config/passport.js";
import userRouter from "./src/routes/userRouter.js";
import profileRouter from "./src/routes/profileRouter.js";
import adminRouter from "./src/routes/adminRoutes/adminRouter.js"
import {setUser} from './src/middlewares/setUser.js';
import { cartCount} from "./src/middlewares/cartMiddleware.js";



dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
 const app = express();
 
 db();

 app.use(morgan("dev"))

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(
  session({
    name: "elara.sid", 
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
    client: mongoose.connection.getClient(), 
   collectionName: "sessions",
   ttl: 72 * 60 * 60,
  }),


    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 72 * 60 * 60 * 1000, 
    },
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(setUser);
app.set("view engine","ejs");
app.set("views", path.join(__dirname, "src/views"));
app.use(express.static(path.join(__dirname,"src/public")));
app.use("/uploads", express.static(path.join(__dirname, "src/public/uploads")));

app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
});

app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
});

app.use(cartCount);
app.use("/", authRouter);
app.use('/',userRouter);
app.use('/',profileRouter);
app.use('/admin',adminRouter);

app.use((req, res, next) => {
    res.status(404).render("user/404page", {
        url: req.originalUrl
    });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



export default app;

 

