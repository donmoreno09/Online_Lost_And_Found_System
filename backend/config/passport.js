import GoogleStrategy from 'passport-google-oauth20';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.BACKEND_HOST + process.env.GOOGLE_CALLBACK_PATH, 
    }, 
    async function (accessToken, refreshToken, profile, cb) {
        try {
            // console.log("Google profile:", profile);
            
            let user = await User.findOne({ googleId: profile.id });

            if(!user){
                user = await User.create({
                    firstName: profile._json.given_name || profile.name.givenName,
                    lastName: profile._json.family_name || profile.name.familyName,
                    email: profile._json.email || profile.emails[0].value,
                    googleId: profile.id,
                    avatar: profile._json.picture || null,
                });
            }

            jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' },
                (err, jwtToken) => {
                    if (err) return cb(err);
                    return cb(null, { user, jwtToken });
                }
            );
        } catch (error) {
            return cb(error);
        }
    }
);

export default googleStrategy;