'use strict';


const listeners = {};

const updateListeners = (uid, db, sockets) => {
    if (listeners[uid]) for (let id of listeners[uid]) 
        updateListener(id, uid, db, sockets);
};

const updateListener = async (uid, id, db, sockets) => {
    for (let sid of await db.user.getSockets(uid))
        if (sockets[sid]) sockets[sid].emit('listener', id);
};

const listenTo = (uid, state, id) => {
    try {
        if (state) {
            if (!listeners[id]) listeners[id] = [];
            listeners[id].push(uid);
        } else {
            listeners[id].pop(listeners[id].find(uid));
            if (!listeners[id].length) delete listeners[id];
        }
    } catch (e) { };
};

const deleteListener = (uid, ids) => {
    for (let id of ids)
        listenTo(id, false, uid);
};

module.exports = { updateListeners, updateListener, listenTo, deleteListener };