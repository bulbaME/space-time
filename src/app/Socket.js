const IO = require('socket.io-client');
const Gtts = require('gtts');
const Stream = require('stream');
const Cookies = require('universal-cookie');
const cookie = new Cookies;

const { getAuthKey } = require('./Auth.js');
const Call = require('./Call.js');
const Rec = require('./Voice.js');
const e = require('cors');

const DATA_UPDATE_RATE = 10000;
const MAX_REQ_SEC = 10;

class Socket {
    constructor(hooks) {
        // requests made by client in last second
        this.reqLastSec = 0;
        this.blockReq = false;
        this.recentReq = [];
        setInterval(() => this.reqLastSec = 0, 1000);

        // recent requests
        setInterval(() => this.recentReq = [], 100);

        this.socket = IO({ 
            auth: { token: getAuthKey() },
            transports: ["websocket", "polling"]
        });

        this.hooks = hooks;

        this.audioContext = null;
        this.audio = {
            playing: false,
            current: null
        };

        this.rec = {
            recording: false,
            current: null,
            timestamp: 0
        };

        this.callData = {
            current: 0,
            call: null,
            muted: false,
            timestamp: 0,
            state: 0,
            incomes: new Set(),
            sockets: {}
        }

        setInterval(() => {
            for (let rk in this.hooks.data.get.rooms) {
                const r = this.hooks.data.get.rooms[rk];
                this.request('call', { type: 'room-count', id: r.id });
            }
        }, 1000);

        // update profiles data 
        // setInterval(() => {
        //     this.loadData({ type: 'user-posts' });
        //     for (let p of Object.keys(hooks.data.get.profiles)) 
        //         this.loadData({ type: 'profile', id: p });
        // }, DATA_UPDATE_RATE);

        this.socket.on('auth-error', () => this.destroy());
        this.socket.on('disconnect', (err) => console.log(`disconnected: ${err}`));
        this.socket.on('connect_error', (err) => console.log(`connection error: ${err}`));

        this.socket.on('auth-succeed', () => {
            this.hooks.socket.set(this);
        });

        this.socket.on('listener', (id) => {
            setTimeout(() => this.request('main-data', { type: 'profile', id }), 50);
        });

        // update room call member count
        // this.socket.on('call-room-count', (d) => {
        //     const data = this.hooks.data.get;
        //     data.rooms[d.id].callMembers = d.count;
        // });

        this.socket.on('main-data', (body) => {
            const dataHook = this.hooks.data;
            const data = body.data;
            const newData = dataHook.get;
            let temp;

            switch(body.type) {
                case 'post':
                    newData.user.posts.push(body.data);
                    break;

                case 'user-posts':
                    newData.user.posts = body.data;
                    break;
                case 'user':
                    newData.user = data;
                    newData.profiles = {};
                    newData.rooms = {};
                    newData.chats = {};

                    break;
                case 'profile':
                    newData.profiles[data.id] = { ...(newData.profiles[data.id] || {}), ...data };
                    if (!newData.chats[data.id]) newData.chats[data.id] = { id: data.id, history: [], unread: { id: '', count: 0 } };
                    this.socket.emit('listen-id', { id: data.id, state: true });
                    break;
                case 'rooms':
                    temp = newData.rooms;
                    const loadProfiles = (v) => {
                        if (!newData.profiles[v] && v !== newData.user.id) this.loadData({ type: 'profile', id: v })
                    }
                case 'chats':
                    if (!temp) temp = newData.chats;

                    if (data.ids) {
                        data.id = data.ids.filter(v => v != newData.user.id)[0];
                        temp[data.id] = data;
                        if (temp.ids) temp.ids.forEach(loadProfiles);
                    }
                    else {
                        if (body.type === 'rooms') data.forEach((v => {
                            temp[v.id] = v
                            if (v.ids) v.ids.forEach(loadProfiles);
                        }));
                        else data.forEach(v => {
                            const id = v.ids.find(v => v !== newData.user.id);
                            temp[id] = v;
                        });
                    }
                    break;
                case 'online':
                    newData.profiles[data.id].online = data.state;
            }

            this.setData(newData);  
        });

        this.socket.on('message', (body) => {
            const dataHook = this.hooks.data;
            const data = body.data;
            const newData = dataHook.get;
            let temp;

            switch(body.type) {
                case 'new':
                    if (data.id[0] === 'r') {
                        temp = newData.rooms[data.id].history;
                        temp.push(data.msg);
                        newData.rooms[data.id].history = temp;
                        const room = newData.rooms[data.id];
                        if (cookie.get('notifications') === 'on' && data.sender !== newData.user.id &&  !newData.user.muted.includes(room.id)) this.createNotification({ title: room.name, icon: room.avatar_url, body: data.text, renotify: true, tag: 1 });
                    } else {
                        if (!newData.chats[data.id]) {
                            this.loadData({ type: 'chats', id: data.id });
                            return;
                        }
                        temp = newData.chats[data.id].history;
                        temp.push(data.msg);
                        newData.chats[data.id].history = temp;

                        if (data.msg.sender === newData.user.id) newData.chats[data.id].unread.id = data.id;
                        else {
                            newData.chats[data.id].unread.id = newData.user.id;
                            const profile = newData.profiles[data.id];
                            if (cookie.get('notifications') === 'on' && !newData.user.muted.includes(profile.id)) this.createNotification({ title: `${profile.name} [${newData.chats[data.id].unread.count+1}]`, icon: profile.avatar_url, body: data.text, renotify: true, tag: 1 });
                        }

                        newData.chats[data.id].unread.count++;
                    }
                    break;
                case 'watch':
                    newData.chats[data.id].unread = { id: '', count: 0 };
                    break;
                case 'clear':
                    if (data.id[0] === 'r') newData.rooms[data.id] = { id: data.id, history: [] };
                    else newData.chats[data.id] = { id: data.id, history: [], unread: { id: '', count: 0 } };
                    break;
                case 'delete':
                    if (data.id[0] === 'r') newData.rooms[data.id].history = newData.rooms[data.id].history.filter(v => v.id !== data.msg);
                    else newData.chats[data.id].history = newData.chats[data.id].history.filter(v => v.id !== data.msg);
            }

            this.setData(newData);
        });

        this.socket.on('room-join', (id) => {
            this.hooks.menu.set({ type: 'rooms', id });
        });

        this.socket.on('call', (data) => {
            switch(data.type) {
                case 'request':
                    this.callData.incomes.add(data.id);
                    this.callData.sockets[data.id] = data.socketId;
                    this.hooks.incomes.set(this.hooks.incomes.get.concat([data.id]));
                    const data_ = this.hooks.data.get[data.id[0] === 'r' ? 'rooms':'profiles'][data.id];
                    if (data_) this.createNotification({ title: `${data_.name}`, icon: data_.avatar_url, body: 'Incoming Call', requireInteraction: true, tag: 2});
                    
                    break;
                case 'end-request':
                    this.hooks.incomes.set(this.hooks.incomes.get.filter(v => v !== data.id));
                    this.callData.incomes.delete(data.id);
                    break;
                case 'accepted':
                    this.callData.sockets[data.id] = data.socketId;
                    const call = new Call(this.socket, this.audioContext);
                    if (this.callData.state !== 2) 
                        this.socket.emit('call', { type: 'accept', id: data.id, socketId: this.callData.sockets[data.id] });
                    call.init();
                    this.callData.timestamp = Date.now();
                    this.callData.call = call.eventHandler;
                    this.callData.state = 2;

                    break;
                case 'declined':
                case 'end':
                    if (this.callData.state)
                        this.call('end');
            }

            this.setData(this.hooks.data.get);
        });
    }

    // deconstructor
    destroy() {
        if (this.socket.connected) this.socket.disconnect();
        this.hooks.auth.set(false);
        this.hooks.socket.set(null);
        this.socket = null;
    }


    // CALL

    call(type, id = 0) {
        const endCall = () => {
            this.socket.emit('call', { type: 'decline', id: this.callData.current, socketId: this.callData.sockets[this.callData.current] });
            this.socket.emit('call', { type: 'end' });

            this.callData.current = 0;
            this.callData.state = 0;
            if (this.callData.call) this.callData.call.emit('stop');
            this.callData.call = null;
            delete this.callData.sockets[this.callData.current];
            this.hooks.call.set(0);
        }

        if (type === 'start') {
            if (!this.audioContext) this.audioContext = new AudioContext();
            if (this.callData.state) endCall();

            if (this.callData.incomes.has(id)) {
                this.socket.emit('call', { type: 'accept', id, socketId: this.callData.sockets[id] });
                this.callData.incomes.delete(id);
                this.callData.state = 2;
            } else {
                this.socket.emit('call', { type: 'start', id });
                this.callData.state = 1;
            }

            this.callData.current = id;
            this.hooks.call.set(this.callData.current);

        } else if (type === 'end') {
            if (this.callData.incomes.has(id)) {
                this.socket.emit('call', { type: 'decline', id, socketId: this.callData.sockets[id] });
                this.hooks.incomes.set(this.hooks.incomes.get.filter(v => v !== id));
                this.callData.incomes.delete(id);
            } else endCall();
        }

        this.setData(this.hooks.data.get);
    }

    callMuteToggle() {
        this.callData.muted = !this.callData.muted;
        this.callData.call.emit('mute', this.callData.muted);
        this.setData(this.hooks.data.get);
    }


    // DATA

    loadData(params) {
        this.request('main-data', params);
    }

    request(event, data) {
        // check if same request was already made 
        let found = false;
        for (let r of this.recentReq) {
            let same = true;
            
            for (let k of Object.keys(data)) 
                if (r[1][k] !== data[k]) same = false;
            if (same && event === r[0]) {
                found = true;
                break;
            }
        }

        if (found) return;
        this.recentReq.push([event, data]);

        if (this.reqLastSec > MAX_REQ_SEC) {
            // if (!this.hooks.alert.get.show)
            //     this.hooks.alert.set({show: true, text: 'Calm down!', type: 'error'});
        } else {
            this.reqLastSec++;
            this.socket.emit(event, data);
        }
    }

    setData(data) {
        // save profile scroll parameter to set after re-render 
        if (data.user && document.getElementById('profile-posts')) data.scroll = document.getElementById('profile-posts').scrollTop;
        
        this.hooks.alert.set({ show: false });
        /* WHY? 
         *
         * for a strange reason only alert hook
         * triggers update for entire app
         * compared to data hook,
         * which doesn't update anything below parent element
         * 
         * why am I using Socket class for updating global data object?
         * because it fucking doesn't work otherwise
         *  
         * I hate react
         * (15/08/21)
        */

        this.hooks.data.set(data);
    }

    updateOnline() {
        const profiles = [];
        this.hooks.data.get.user.contacts.forEach(id => profiles.push(id));
        Object.values(this.hooks.data.get.chats).forEach(v => profiles.includes(v.id) ? 0:profiles.push(v.id));
        Object.values(this.hooks.data.get.rooms).forEach(v => v.ids.filter(v => v !== this.hooks.data.get.user.id).forEach(id => profiles.includes(id) ? 0:profiles.push(id)));

        profiles.forEach(id => this.socket.emit('online', id));
    }


    // NOTIFICATIONS

    createNotification (params) {
        const n = new Notification(params.title, { ...params, silent: true });
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') n.close();
        });
    }

    
    // GTTS
    
    gtts(text) {
        // TODO 
        const gtts = new Gtts(text, 'en');
        let res;
        gtts.stream().pipe(res);
        console.log(res)
    }


    // VOICE MESSAGES

    async startRec(eq) {
        if (!(await window.navigator.mediaDevices.getUserMedia({audio: true}).catch(this.hooks.popup.set({ show: true, type: 'error', text: 'Unable to get microphone output' })))) return;
        if (!this.audioContext) this.audioContext = new AudioContext();

        this.rec = {
            recording: true,
            current: new Rec(this.audioContext, eq).eventHandler,
            timestamp: Date.now()
        }

        this.rec.current.emit('start');

        this.rec.current.on('stop', (data) => {
            if (data === 'mic-denied') this.hooks.popup.set({ show: true, type: 'error', text: 'Unable to get microphone output' });
        });

        return this.rec.current;
    }

    stopRec() {
        this.rec.current.emit('stop');
        this.rec = {
            recording: false,
            current: null,
            timestamp: 0
        }
    }
}

module.exports = Socket;
