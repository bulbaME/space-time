'use strict';

const socket = require('socket.io');
const express = require('express');
const { google } = require('googleapis');


require('dotenv').config();
process.env.REDIS_PORT = process.env.REDIS_URL || 6379; 

const Auth = require('./modules/auth.js');
const DB = require('./modules/db.js');
const Socket = require('./modules/socket.js');

const App = express();
App.use(express.json());  // for parsing application/json
App.use(express.urlencoded({ extended: true }));  // for parsing application/x-www-form-urlencoded
App.use(express.static(__dirname + '/public'));  // send page

App.get('/redirect', (req, res) => {
    if (!req.secure) res.redirect(`https://${req.headers.host}`);
    res.status(200);
});

const PORT = process.env.PORT || 2007;

const server = App.listen(PORT, () => console.log(`[SERVER] started on port ${PORT}`));
const io = socket(server, {
    pingTimeout: 180_000,
    pingInterval: 30_000,
    maxHttpBufferSize: 1e8  // max message size 100 mb
});

(async () => {
    // initialize database
    const db = await new DB().init();

    // initialize authentication
    Auth.userAuthInit(App, db);

    // initialize sockets
    Socket.init(io, db);

    if (db) console.log('[SERVER] initialized');
})();