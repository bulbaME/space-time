'use strict';


const fs = require('fs');
const passport = require('passport');
const oauth_strategy = require('passport-google-oauth20').Strategy;

const cookieLifetime = new Date('2030-1-31');
const oauth_secret = JSON.parse(fs.readFileSync('oauth-secret.json')).web;

// authorize client on request
const userAuthInit = (App, db) => {
    App.post('/login', (req, res) => {
        db.user.processAuthKey(req.body.key).then((data) => {
            if (data) {
                res.setHeader('Access-Control-Allow-Origin', 'http://localhost:2007');
                res.status(202).json({ 'authorized': true });
            }
            else {
                res.status(400).cookie('auth-key', '').json({ 'authorized': false });  // reset wrong cookie
                console.log(`[AUTH] trying to login using wrong API-KEY (${req.ip})`);
            }
        });
    });

    App.use(passport.initialize());
    App.get('/auth', passport.authenticate('google', { scope: ['profile'] }));
    App.get('/auth/done', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
        const user = req.user['_json'];
        const userData = await db.user.get(user.sub);
        let authKey;
        if (userData) authKey = userData['auth_key'];
        else authKey = db.user.new({
            id: user.sub,
            name: user.name,
            avatarUrl: user.picture,
            lang: user.locale
        });

        res.cookie('auth-key', authKey, { expires: cookieLifetime }).redirect('/');
    });

    passport.use(new oauth_strategy({
        clientID: oauth_secret.client_id,
        clientSecret: oauth_secret.client_secret,
        callbackURL: 'http://localhost:2007/auth/done'
    }, (tokenAccess, tokenRefresh, profile, done) => done(null, profile)));
    passport.serializeUser((user, done) => done(null, user));
}

module.exports = {
    userAuthInit,
};