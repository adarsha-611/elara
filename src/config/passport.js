import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../model/userSchema.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
         
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
        user.googleId = profile.id;
        user.authType = "google";   
        await user.save();

          } else {
         
          user = new User({
          fullName: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          authType: "google",   
          isVerified: true,
          isBlocked:false 
});
            await user.save();
          }
        }

        if(user.isBlocked){
           console.log("USER IS BLOCKED - sending message"); 
          return done (null,false,{
            message:"Your account is not accessible.Please contact support."
          })
        }
        return done(null, user);
      } 
    catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
