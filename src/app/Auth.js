const Cookies = require('universal-cookie');
const cookie = new Cookies;

const post = require('./Post.js')

const getAuthKey = () => cookie.get('auth-key');

const tryAuth = () => {
    const key = getAuthKey();
    if (key) return post('/login', { key });
    else return false;
}

const logout = (setAuth) => {
    setTimeout(() => {
        cookie.set('auth-key', '');
        setAuth(false);
    }, 400);
}


module.exports = { tryAuth, getAuthKey, logout };