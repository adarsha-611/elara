import express from "express";
import path from "path";
import dotenv from "dotenv"
import { fileURLToPath } from "url";
import session from "express-session";

import db from "./src/config/db.js";
// import userRouter from "./src/routes/userRouter.js";
import signupRouter from "./src/routes/auth/signupRouter.js";
// import loginRouter from "./src/routes/auth/loginRouter.js";


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
 const app = express();
 
 db();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true only in HTTPS
      maxAge: 72*60*60*1000, // 1 day
    },
  })
);
app.set("view engine","ejs");
app.set("views", path.join(__dirname, "src/views"));
app.use(express.static(path.join(__dirname,"src/public")));


app.use("/", signupRouter);
// app.use('/',loginRouter)
// app.use('/',userRouter)




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



export default app;

 

