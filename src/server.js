'use strict';

const socket = require('socket.io');
const express = require('express');
const { google } = require('googleapis');

const Auth = require('./modules/auth.js');
const DB = require('./modules/db.js');
const Socket = require('./modules/socket.js')

const App = express();
App.use(express.json());  // for parsing application/json
App.use(express.urlencoded({ extended: true }));  // for parsing application/x-www-form-urlencoded
App.use(express.static('public'));  // send page

const PORT = process.env.PORT || 2007;
const REDIS_PORT = process.env.REDIS_URL || 6379; 

const server = App.listen(PORT, () => console.log('[SERVER] started'));
const io = socket(server);

(async () => {
    // initialize database
    const db = await new DB(REDIS_PORT).init();

    // initialize authentication
    Auth.userAuthInit(App, db);

    // initialize sockets
    Socket.init(io, db);

    if (db) console.log('[SERVER] initialized');
})();