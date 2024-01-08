import { Request } from "express";
import { PassportStatic } from "passport";
import GoogleStrategy from "passport-google-oauth2";
import User from "../models/User";

export default (passport: PassportStatic) => {
  passport.use(
    new GoogleStrategy.Strategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.OAUTH_CALLBACK_URI,
        passReqToCallback: true,
      },
      async (
        _request: Request,
        _accessToken: any,
        _refreshToken: any,
        profile: any,
        done: any
      ) => {
        try {
          const existingUser = await User.findOne({
            email: profile.emails[0].value,
          });

          if (existingUser) {
            return done(null, existingUser);
          }

          return done(null, false);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
};
