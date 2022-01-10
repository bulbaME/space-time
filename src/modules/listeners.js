'use strict';


const listeners = {};

const updateListeners = (uid, db, sockets) => {
    if (listeners[uid]) for (let id of listeners[uid]) 
        updateListener(id, uid, db, sockets);
    updateListener(uid, uid, db, sockets);
    console.log(listeners);
};

const updateListener = async (uid, id, db, sockets) => {
    for (let sid of await db.user.getSockets(uid))
        if (sockets[sid]) sockets[sid].emit('listener', id);
};

const listenTo = (uid, state, id) => {
    if (uid === id) return;
    if (state) {
        if (!listeners[id]) listeners[id] = [];
        if (!listeners[id].includes(uid))
            listeners[id].push(uid);
    } else {
        if (!listeners[id]) return;
        let index = listeners[id].indexOf(uid);
        if (index !== -1) {
            listeners[id].pop(index);
            if (!listeners[id].length) delete listeners[id];    
        } 
    }
};

const deleteListener = (uid, ids) => {
    for (let id of ids)
        listenTo(id, false, uid);
};

module.exports = { updateListeners, updateListener, listenTo, deleteListener };