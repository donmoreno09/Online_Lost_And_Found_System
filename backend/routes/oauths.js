import { Router } from "express";
import passport from "passport";

const router = Router();

router.get("/login-google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/callback-google", 
    passport.authenticate("google", { session: false }),
    (req, res) => {
        console.log("Autenticazione completata, reindirizzamento con token");
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?token=${req.user.jwtToken}`);
    }
);

export default router;