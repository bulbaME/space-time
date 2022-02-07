const React = require('react');

import SearchIcon from './graphics/icon-search.jsx';
import NotifIcon2 from './graphics/icon-notification2.jsx';
import AddIcon from './graphics/icon-add.jsx';
const Avatar = require('./Avatar.jsx');

function SideBar (props) {
    const data = props.data.get;
    if (!data.user) return <></>;
    const [sidebar, setSidebar] = React.useState({ type: 'contacts', id: ''});
    const [searchInput, setSearchInput] = React.useState('');
    const [searchTimeout, setSearchTimeout] = React.useState(0);
    const [callTimeInt, setCallTimeInt] = React.useState(0);
    const callTimeRef = React.useRef();
    const searchRef = React.useRef();

    const callTimeCount = (timestamp) => {
        let time = Date.now() - timestamp;
        time = Math.floor(time / 1000);
        const seconds = `${time % 60}`;
        const minutes = Math.floor(seconds / 60);
        return `Call ${minutes.length > 1 ? minutes:`0${minutes}`}:${seconds.length > 1 ? seconds:`0${seconds}`}`;
    }

    React.useLayoutEffect(() => {
        props.data.socket.loadData({ type: 'chats' });
        props.data.socket.loadData({ type: 'rooms' });
        // data.user.contacts.forEach(v => props.data.socket.loadData({ type: 'profile', id: v }));
    }, []);

    if (props.menu.get.type === 'contacts' && sidebar.type !== 'contacts') setSidebar({ type: 'contacts', id: ''});
    else if (props.menu.get.type === 'rooms' && sidebar.type !== 'rooms') setSidebar({ type: 'rooms', id: ''});

    const loadChats = (chats, setMenu, isRoom=false) => {
        if (!chats || !chats.filter(v => v).length) return [];
        chats = chats.filter(v => v);

        return chats.sort((a, b) => {
            a = a.history && a.history.length ? a.history[a.history.length-1].timestamp : 0;
            b = b.history && b.history.length ? b.history[b.history.length-1].timestamp : 0;
            return b - a;
        }).map((v, i) => {
            if (v.id === data.user.id) return;
            const lastMessage = v.history && v.history[0] ? v.history[v.history.length-1] : '';
            
            if (props.data.socket.callData.current === v.id && props.data.socket.callData.state === 2 && !callTimeInt) { 
                setCallTimeInt(setInterval(() => {
                    if (callTimeRef.current) callTimeRef.current.innerHTML = callTimeCount(props.data.socket.callData.timestamp);
                }, 1000));        
            }

            if (props.data.socket.callData.state !== 2 && callTimeInt) {
                clearInterval(callTimeInt);
                setCallTimeInt(0);
            }

            const descr = (lastMessage && sidebar.type === 'rooms' && !props.data.socket.callData.call ? `${lastMessage.sender === data.user.id ? 'You':data.profiles[lastMessage.sender].name}: `:'') + (
            (props.data.socket.callData.current === v.id && props.data.socket.callData.state === 1 ? 'Outgoing Call':'')
            || (props.data.socket.callData.current === v.id ? `Call 00:00`:'')
            || (props.data.socket.callData.incomes.has(v.id) ? 'Incoming Call':'')
            || (lastMessage.text && lastMessage.text.indexOf('<room-inv/') !== -1 ? 'Invite':'')
            || lastMessage.text 
            || (lastMessage && lastMessage.files[0] ? (lastMessage.files[0][1].startsWith('image') ? 'Image':'File'):'')
            || (lastMessage && lastMessage.audio.uri ? 'Audio Message':'')
            || (lastMessage && lastMessage.geo.lat ? 'Geolocation':''))
            || (searchInput ? ' ':'');

            const chatClick = () => {
                searchRef.current.value = ''; 
                setSearchInput('');
                setMenu(v.id);
            }

            return (
                <div key={i} className='sidebar-chat' onClick={chatClick} style={{ backgroundColor: ['contacts', 'rooms'].includes(props.menu.get.type) && v.id === props.menu.get.id ? 'var(--blue-mid)':'inherit' }}>
                    <Avatar className='sidebar-chat-logo' room={v.id[0] === 'r' ? v.name:''} url={v.avatar_url || ''} />
                    {v.online ? <div id='sidebar-chat-online' />:''}
                    {v.unread && v.history.length && v.unread.count ? (v.unread.id !== data.user.id ? <div className='sidebar-unread1' />:<div className='sidebar-unread2'>{v.unread.count <= 1000 ? v.unread.count:'999+'}</div>):''}
                    <p className='sidebar-chat-name'>{v.name || ''}{data.user.muted.includes(v.id) ? <NotifIcon2 className='sidebar-chat-muted' />:''}</p>
                    <p className='sidebar-chat-descr' ref={props.data.socket.callData.current === v.id && props.data.socket.callData.state === 2 ? callTimeRef : null} style={descr ? {}:{opacity: '0.7'}}>{descr || 'No messages yet'}</p>
                </div>
            );
        });
    }

    const searchReq = {
        setSearch: (data) => {
            if (searchTimeout) clearTimeout(searchTimeout);
            setSearchTimeout(setTimeout(() => {
                props.data.socket.request('search', data)
            }, 2000));
        },

        clearSearch: () => {
            if (searchTimeout) clearTimeout(searchTimeout);
        }
    }

    const afterSearch = (text, chats) => {
        text = text.toLowerCase().trim();

        if (sidebar.type == 'contacts') Object.values(data.profiles).map((v) => {
            if (v.name.toLowerCase().indexOf(text) !== -1) chats.push(v); // by name
            else if (text.indexOf('#') !== -1 && text.length > 1 && v.profile_id.indexOf(text.slice(1)) !== -1) chats.push(v); // by id
        });

        else Object.values(data.rooms).map(v => {
            if (v.name.toLowerCase().indexOf(text) !== -1) chats.push(v); // by name
        });

        return chats;
    }

    const search = (text) => {
        let chats = []; 

        if (!text) return [];

        // profile search
        if (text.indexOf('#') !== -1) {
            let id = text.slice(text.indexOf('#')+1);

            id = id.slice(0, id.indexOf(' ') === -1 ? id.length:id.indexOf(' '));
            // do not allow searching for self id
            if (id == data.user.id) return [];

            const profile = data.profiles[id];

            if (!profile && id) searchReq.setSearch({ type: 'user', id });
        }

        // room search
        if (text.indexOf('@') !== -1) {
            let id = text.slice(text.indexOf('@')+1);
            id = id.slice(0, id.indexOf(' ') === -1 ? id.length:id.indexOf(' '));

            if (id) searchReq.setSearch('search', { type: 'room', id });
        }

        if (text.indexOf('#') + text.indexOf('@') < -1) searchReq.clearSearch();

        afterSearch(text, chats);
    }

    const inputChange = (event) => {
        const text = event.target.value;
        setSearchInput(text);
        search(text);
    }

    const getIdFromChat = (ch) => ch.ids.filter(v => v !== data.user.id)[0];
    const canShowChat = (id) => data.user.contacts.includes(id) || data.user.privacy.write === 'all';
    const canShowCallChat = (id) => data.user.contacts.includes(id) || data.user.privacy.call === 'all';

    let chats
    , chatMenuSet = (id) => props.menu.set({ type: canShowChat(id) || data.chats[id] ? 'contacts':'profile', id })
    , roomMenuSet = (id) => props.menu.set({ type: 'rooms', id });
    // search 
    if (searchInput) { 
        if (sidebar.type === 'contacts') chats = loadChats(afterSearch(searchInput, []), chatMenuSet);
        if (sidebar.type === 'rooms') chats = loadChats(afterSearch(searchInput, []), roomMenuSet);
    }
    // load rooms
    else if (sidebar.type === 'rooms') chats = loadChats(Object.values(data.rooms), roomMenuSet);
    // load chats
    else chats = (() => {
        Object.values(data.chats).map(v => v.ids ? getIdFromChat(v) : '' )
        .filter(v => (canShowCallChat(v) || canShowChat(v)) && !data.profiles[v]).forEach(v => 
            { if (v) props.data.socket.loadData({ type: 'profile', id: v }); });

        return loadChats([
            ...data.user.contacts.map(v => {
                const chat = data.chats[v];
                if (data.profiles[v]) return {...chat, ...data.profiles[v]};
            }),
            ...Object.values(data.chats).map(v => {
                if (!v.ids) v.ids = [v.id, data.user.id];
                const profile = data.profiles[getIdFromChat(v)];
                if (profile && canShowChat(profile.id) && v.history.length && !data.user.contacts.includes(profile.id))
                    return {...v, ...profile};
            }),
            ...Array.from(props.data.socket.callData.incomes).map(v => {
                const profile = data.profiles[v];
                if (profile && canShowCallChat(v) && !data.chats[v]) return { ...profile, history: [] };
            })], chatMenuSet);
    })();

    return <div id='sidebar'>
            <div id='sidebar-search'>
                <SearchIcon id='sidebar-search-icon' />
                <input id='sidebar-search-input' ref={searchRef} autoComplete='off' placeholder='Search...' maxLength='20' onChange={inputChange} style={searchInput.indexOf('#') + searchInput.indexOf('@') >= -1 ? {fontFamily: `'DM Mono', monospace`, fontWeight: 400}:{}} />
            </div>
            {chats.length ? <div id='sidebar-chats'>{chats}</div>:<p id='sidebar-text'>{searchInput ? 'SEARCHING':(sidebar.type === 'rooms' ? 'NO ROOMS':'NO CONTACTS')}</p>}
            {sidebar.type === 'rooms' ? <AddIcon id='sidebar-newroom' onClick={() => props.data.socket.request('room', { type: 'new' })} />:''}
        </div>;
}

module.exports = SideBar;