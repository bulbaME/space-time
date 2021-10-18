'use strict';


const sockets = {};
const rooms = {};

const CALL_TIMEOUT = 30_000; // 30 seconds

const init = (io, db) => {
    io.sockets.on('connection' , async (clientSocket) => {
        // verify if key is valid
        db.user.processAuthKey(clientSocket.handshake.auth.token).then((userData) => {
            // if key is valid initaliize socket
            if (userData) {
                clientSocket.emit('auth-succeed', {});

                const userId = userData;
                const clientId = clientSocket.id;
                const currentCall = {
                    to: null,
                    state: 0,
                    reqTimeout: 0,
                    unreqFunc: null,
                    muted: false,
                    requested: [],
                    type: 0
                };

                // add socket object to sockets
                sockets[clientId] = clientSocket;
                db.user.connect(userId, clientId);

                // on data request
                clientSocket.on('main-data', async (reqData) => {
                    let temp, resData;

                    switch(reqData.type) {
                        case 'user':
                            temp = await db.user.get(userId);
                            resData = temp;
                            break;
                        case 'user-posts':
                            temp = await db.user.get(userId);
                            resData = temp.posts;
                            break;
                        case 'profile':
                            if (!reqData.id) return;
                            temp = await db.user.get(reqData.id);

                            // check if can view users profile
                            let seePosts = true;

                            if (temp.privacy.see === 'contacts' && !temp.contacts.includes(userId)) seePosts = false;
                            resData = {
                                id: temp.id,
                                name: temp.name,
                                profile_id: temp.profile_id,
                                avatar_url: temp.avatar_url,
                                posts: seePosts ? temp.posts:[],
                                blocked: temp.blocked.includes(userId),
                                status: temp.status,
                                privacy: temp.privacy,
                                online: temp.online,
                                in_contacts: temp.contacts.includes(userId)
                            };
                            break;
                        case 'chats':
                            if (reqData.id) resData = await db.chats.get(userId, reqData.id);
                            else resData = await db.chats.getAll(userId);
                            break;
                        case 'rooms':
                            if (reqData.id) resData = await db.rooms.check(userId, reqData.id);
                            else resData = await db.rooms.getAll(userId);
                            break;
                        default:
                            return;
                    }

                    clientSocket.emit('main-data', { type: reqData.type, data: resData });
                });

                // on change data request
                clientSocket.on('change', async (reqData) => {
                    switch(reqData.type) {
                        case 'id':
                            const newProfileId = reqData.id;
                            if (/^[a-z0-9]{5,16}$/.test(newProfileId)) db.user.update.profileId(userId, newProfileId);
                            break;
                        case 'name':
                            const newUsername = reqData.data;
                            if(newUsername.length <= 10) db.user.update.name(userId, newUsername);
                            break;
                        case 'status':
                            const newStatus = reqData.data;
                            if(newStatus.length <= 16) db.user.update.status(userId, newStatus);
                            break;
                        case 'privacy':
                            const newState = reqData.data;
                            if ((newState.state === 'all' || newState.state === 'contacts') && 
                                (newState.type === 'call' || newState.type === 'write' || newState.type === 'see')) 
                                    db.user.update.privacy(userId, newState.type, newState.state);
                            break;
                        case 'avatar':
                            db.user.update.avatar(userId, reqData.data);
                            break;
                    }
                });

                clientSocket.on('room', async (reqData) => {
                    let temp, updated;

                    switch(reqData.type) {
                        case 'join':
                            if (await db.rooms.check(userId, reqData.id)) return;
                            db.rooms.join(userId, reqData.id).then(async () => {
                                temp = await db.rooms.get(reqData.id);

                                if (temp) {
                                    clientSocket.emit('main-data', { type: 'rooms', data: temp });
                                    clientSocket.emit('room-join', reqData.id);

                                    for (let u of temp.ids)
                                        for (let s of await db.user.getSockets(u))
                                            if (sockets[s] && s !== clientId) sockets[s].emit('main-data', { type: 'rooms', data: { ...temp }});
                                }
                            });

                            break;
                        case 'leave':
                            temp = await db.rooms.get(reqData.id);
                            if (temp) {
                                const userLeave = reqData.userId ? (temp.admins.includes(userId) ? reqData.userId : userId):userId;
                                if (temp.ids.length === 1) db.rooms.delete(reqData.id);
                                else db.rooms.leave(userLeave, reqData.id);

                                updated = await db.rooms.get(temp.id);

                                for (let u of temp.ids)
                                    for (let s of await db.user.getSockets(u))
                                        if (sockets[s] && s !== clientId) sockets[s].emit('main-data', { type: 'rooms', data: updated });
                            }
                            break;
                        case 'new':
                            temp = await db.rooms.get(await db.rooms.new({ name: `${(await db.user.get(userId)).name}'s room` }));
                            temp.ids.push(userId);
                            temp.admins.push(userId);
                            db.rooms.join(userId, temp.id);
                            db.rooms.update.addAdmin(temp.id, userId);
                            temp.admins.push(userId);
                            clientSocket.emit('main-data', { type: 'rooms', data: temp });
                            break;
                        case 'update':
                            temp = await db.rooms.get(reqData.id);
                            if (temp.admins.includes(userId)) {
                                if (reqData.data.type === 'name') db.rooms.update.name(reqData.id, reqData.data.data);
                                else if (reqData.data.type === 'avatar') db.rooms.update.avatar(reqData.id, reqData.data.data);
                                else if (reqData.data.type === 'set-admin') db.rooms.update.addAdmin(temp.id, reqData.data.data);
                                else if (reqData.data.type === 'unset-admin') db.rooms.update.delAdmin(temp.id, reqData.data.data);
                                else if (reqData.data.type === 'clear') db.rooms.clear(reqData.id);

                                updated = await db.rooms.get(temp.id);

                                for (let u of temp.ids)
                                    for (let s of await db.user.getSockets(u))
                                        if (sockets[s] && s !== clientId) sockets[s].emit('main-data', { type: 'rooms', data: { ...updated }});
                            }
                            break
                        case 'message':
                            const room = await db.rooms.check(userId, reqData.id);
                            if (room) {
                                temp = reqData.data;
                                const message = await db.rooms.message.new(userId, reqData.id, { text: temp.text.trim(), files: temp.files, audio: temp.audio, geo: temp.geo });
                                const data = { ...message };
                                
                                for (let u of room.ids)
                                    for (let s of await db.user.getSockets(u))
                                        if (sockets[s]) sockets[s].emit('message', { type: 'new', data: { ...data, id: temp.id }});
                            }
                    }
                });

                // on user request
                clientSocket.on('user', async (reqData) => {
                    if (!reqData.id) return;

                    switch(reqData.type) {
                        case 'add':
                            db.user.user.add(userId, reqData.id);
                            break;
                        case 'remove':
                            db.user.user.remove(userId, reqData.id);
                            break;
                        case 'block':
                            db.user.user.block(userId, reqData.id);
                            break;
                        case 'unblock':
                            db.user.user.unblock(userId, reqData.id);
                            break;
                        case 'mute':
                            db.user.user.mute(userId, reqData.id);
                            break;
                        case 'unmute':
                            db.user.user.unmute(userId, reqData.id);
                    }
                });

                // on profile posts data request
                clientSocket.on('post', async (reqData) => {
                    switch(reqData.type) {
                        case 'new':
                            let postBody = reqData.data;
                            postBody.title = postBody.title ? postBody.title : '';
                            postBody.text = postBody.text ? postBody.text : '';
                            postBody.files = postBody.files ? postBody.files : [];

                            if (postBody.title.length <= 30 && postBody.text.length <= 1500 && (postBody.title || postBody.text || postBody.files.length))
                                clientSocket.emit('main-data', { type: 'post', data: await db.user.post.new(userId, postBody)});
                            break;
                        case 'delete':
                            db.user.post.delete(userId, reqData.id);
                            break;
                        case 'like':
                            db.user.post.like(userId, reqData.id);
                            break;
                        case 'unlike':
                            db.user.post.unLike(userId, reqData.id);
                    }
                });

                // on message request
                clientSocket.on('message', async (reqData) => {
                    if (!reqData.id) return;
                    let data;
                    
                    switch(reqData.type) {
                        case 'new':
                            if (reqData.text > 500) return;
                            const userProfile = await db.user.get(userId);
                            if (!userProfile.contacts.includes(reqData.id)) return;

                            const profile = await db.user.get(reqData.id);
                            if (profile && !profile.blocked.includes(userId)) {
                                if (profile.privacy.write === 'all' || profile.contacts.includes(userId)) {
                                    const message = await db.chats.message.new(userId, profile.id, { text: reqData.text.trim(), files: reqData.files, audio: reqData.audio, geo: reqData.geo });
                                    data = { ...message };
                                }
                            }

                            break;
                        case 'watch':
                            const res = await db.chats.read(userId, reqData.id);
                            if (res.modifiedCount) data = {};
                            break;
                        case 'clear':
                            db.chats.clear(userId, reqData.id);
                            data = {};
                            break;
                        default:
                            return;
                    }

                    for (let s of await db.user.getSockets(userId))
                        if (sockets[s]) sockets[s].emit('message', { type: reqData.type, data: { ...data, id: reqData.id }});

                    for (let s of await db.user.getSockets(reqData.id))
                        if (sockets[s]) sockets[s].emit('message', { type: reqData.type, data: { ...data, id: userId }});
                });

                // check if user is online
                clientSocket.on('online', async (id) => {
                    if (id) clientSocket.emit('main-data', { type: 'online', data: { state: await db.user.checkOnline(id), id }});
                });

                // on search request
                clientSocket.on('search', async (reqData) => {
                    let resData, temp;

                    switch(reqData.type) {
                        case 'user':
                            temp = await db.user.getByProfile(reqData.id);
                            if (!temp) return;

                            // check if can view users profile
                            let seePosts = true;

                            if (temp.privacy.see === 'contacts' && !temp.contacts.includes(userId)) seePosts = false;
                            resData = {
                                id: temp.id,
                                name: temp.name,
                                profile_id: temp.profile_id,
                                avatar_url: temp.avatar_url,
                                posts: seePosts ? temp.posts:[],
                                blocked: temp.blocked.includes(userId),
                                status: temp.status,
                                privacy: temp.privacy,
                                online: temp.online,
                                in_contacts: temp.contacts.includes(userId)
                            };
                            break;
                        case 'room':
                            temp = await db.rooms.get(data.id);
                            if (!temp) return;

                            // check if room is private
                    }

                    if (resData) clientSocket.emit('main-data', { type: 'profile', data: resData });
                });

                // calls
                clientSocket.on('call', async (reqData) => {
                    /* --- CALL PROTOCOL 🤔 ---
                    * end, start - requests (client/server)
                    * decline, accept - socket new states (server)
                    * declined, accepted - new client data (client)
                    * 
                    * 
                    * --- CALL REQUEST PROCEDURE ---
                    * s1 -> S (start), S -> s2 (call requests)
                    * if accepted: s2 -> S (accept), S -> s2 (end call requests), S -> s1 (accepted), s1 -> S (accept)
                    * if declined: s2 -> S (decline), s2 -> S (end), S -> s2 (end call requests), S -> s1 (declined), s1 -> S (end)
                    * 
                    * 
                    * --- CALL END PROCEDURE ---
                    * s1 -> S (decline), s1 -> S (end), S -> s2 (end), s2 -> S (end)
                    * 
                    */

                    const id = reqData.id;
                    const socketId = reqData.socketId;

                    switch(reqData.type) {
                        case 'start':
                            if (id[0] === 'r') {
                                const room = await db.rooms.check(userId, id);
                                if (!room) return;

                                currentCall.state = 2;
                                currentCall.type = 2;
                                currentCall.to = id;
                                clientSocket.join(id);
                                clientSocket.emit('call', { type: 'accepted', id, socketId: id });
                            } else {
                                const user = await db.user.get(id);
                                const userSockets = await db.user.getSockets(id);
                                if (user && !user.blocked.includes(userId) && (user.privacy.call === 'all' || user.contacts.includes(userId)) && !await db.call.check(clientId)) {
                                    // send call request to users clients
                                    for (let s of userSockets) if (sockets[s]) sockets[s].emit('call', { type: 'request', id: userId, socketId: clientId });
                                    db.call.set(clientId, id);

                                    currentCall.requested = userSockets;
                                    currentCall.state = 1;
                                    currentCall.type = 1;
                                    currentCall.unreqFunc = (dec = false) => {
                                        // send call end request to users clients
                                        for (let s of userSockets) if (sockets[s]) sockets[s].emit('call', { type: 'end-request', id: userId, socketId: clientId });
                                        if (dec) clientSocket.emit('call', { type: 'declined', id });
                                    }
                                    currentCall.reqTimeout = setTimeout(() => currentCall.unreqFunc(true), CALL_TIMEOUT);
                                }
                            }
                            break;
                        case 'end':
                            if (!currentCall.state) return;
                            if (currentCall.type === 2) {
                                clientSocket.leave(currentCall.to);
                                clientSocket.emit('call', { type: 'end', id, socketId: id });
                                db.rooms.call.end(id);
                            } else db.call.del(clientId);
                            currentCall.to = null;
                            currentCall.state = 0;
                            currentCall.type = 0;
                            currentCall.reqTimeout = 0;
                            currentCall.unreqFunc = null;
                            currentCall.requested = [];

                            break;
                        case 'accept':
                            if (!await db.call.verify(socketId, userId)) return;

                            if (currentCall.state === 0) {
                                currentCall.type = 1;
                                currentCall.state = 2;
                                db.call.set(clientId, id);
                                if (id[0] === 'r') {
                                } else {
                                    currentCall.to = sockets[socketId];
                                    currentCall.to.emit('call', { type: 'accepted', id: userId, socketId: clientId });
                                }
                            } else if (currentCall.state === 1) {
                                clearTimeout(currentCall.reqTimeout);
                                currentCall.unreqFunc();
                                currentCall.type = 1;
                                currentCall.state = 2;
                                if (id[0] === 'r') return;
                                else {
                                    currentCall.to = sockets[socketId];
                                    currentCall.to.emit('call', { type: 'accepted', id: userId, socketId: clientId });
                                    db.call.set(clientId, id);
                                }
                            }

                            break;
                        case 'decline':
                            if (currentCall.type === 2 || !currentCall.type) return;
                            else {
                                if (await db.call.verify(socketId, userId) && !await db.call.verify(clientId, id))
                                    sockets[socketId].emit('call', { type: 'declined', id });
                                else if (currentCall.state === 1) {
                                    currentCall.unreqFunc();
                                    clearTimeout(currentCall.reqTimeout);
                                } else if (currentCall.state === 2) {
                                    if (sockets[socketId]) sockets[socketId].emit('call', { type: 'end', id });
                                }
                            }
                    }
                });

                clientSocket.on('call-data', (chunkData) => {
                    if (currentCall.state === 2) 
                        if (currentCall.type === 1) currentCall.to.emit('call-data', chunkData);
                        else if (currentCall.type === 2) clientSocket.to(currentCall.to).emit('call-data', chunkData);
                });

                // on socket disconnect
                clientSocket.on('disconnect', () => {
                    delete sockets[clientId];
                    db.user.disconnect(userId, clientId);

                    if (currentCall.state) {
                        if (currentCall.to) {
                            if (currentCall.type === 1) {
                                db.call.del(userId);
                                currentCall.to.emit('call', { type: 'end', id: userId });
                            } else if (currentCall.type === 2) clientSocket.leave(currentCall.to);
                        }
                        if (currentCall.unreqFunc) currentCall.unreqFunc();
                        if (currentCall.reqTimeout) clearTimeout(currentCall.reqTimeout);
                    }
                });

            // if key is invalid disconnect socket
            } else {
                clientSocket.emit('auth-error', {});
                clientSocket.disconnect(true);
            }
        });
    });
}

module.exports = {init};