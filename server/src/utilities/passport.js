const passport = require("passport");
const connectDatabase = require("../config/connectDatabase");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.VITE_BASE_URL}${process.env.API_START_POINT}${process.env.API_VERSION}/authentication_api/google/callback`,
    passReqToCallback: true
},
    async (request, accessToken, refreshToken, profile, done) => {
        const db = await connectDatabase()
        const all_users_collection = db.collection("all_users")
        const isExistUser = await all_users_collection.findOne({ email: profile?._json.email })
        request.profile = isExistUser;
        return done(null, profile);
    }
));