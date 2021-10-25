const React = require('react');
const Cookies = require('universal-cookie');
const cookie = new Cookies;

const Auth = require('./Auth.js');
const { logout } = require('./Auth.js');
const Attachs = require('./Files.js');
const { SettingsButton, AttachmentsButton } = require('./Buttons.jsx');
const Avatar = require('./Avatar.jsx');
const { ProfileDropDown, ContactsDropDown, RoomsDropDown } = require('./Popup.jsx');
const DynamicTextarea = require('react-textarea-autosize').default;

import DeleteIcon from './graphics/icon-delete.jsx';
import ShareIcon from './graphics/icon-share.jsx';
import LikeActiveIcon from './graphics/icon-star-active.jsx';
import LikeUnactiveIcon from './graphics/icon-star-unactive.jsx';
import SendIcon from './graphics/icon-send.jsx';
import MicIcon from './graphics/icon-mic.jsx';
import MicOffIcon from './graphics/icon-mic-off.jsx';
import CallIcon from './graphics/icon-call.jsx';
import FileIcon from './graphics/icon-file.jsx';
import EditIcon from './graphics/icon-edit.jsx';
import SoundIcon from './graphics/icon-sound.jsx';
import SoundStopIcon from './graphics/icon-sound-stop.jsx';
import PlayIcon from './graphics/icon-play.jsx';
import PauseIcon from './graphics/icon-pause.jsx';
import MessageIcon from './graphics/icon-message.jsx';

const getGeo = () => {
    return new Promise((res, rej) => {
        window.navigator.geolocation.getCurrentPosition((pos) => res(pos.coords), () => rej());
    });
}

const pxToVh = (px) => {
	return px * (100 / document.documentElement.clientHeight);
}

const formatTime = (time) => {
    const diff = (Date.now() - time) / 1000;
    const date = new Date(time);
    const dateArr = date.toString().split(' ');
    const t = dateArr[4].split(':').slice(0, 2).join(':');
    let temp;

    if (diff < 60) return 'a few seconds ago';
    else if (diff < 3600) return `${temp = Math.round(diff / 60)} minute${temp > 1 ? 's':''} ago`;
    else if (diff / 60 < 1440) return `${temp = Math.round(diff / 3600)} hour${temp > 1 ? 's':''} ago`;
    else if (diff / 60 < 2880) return `yesterday at ${t}`;
    else return `${diff < 31_563_000 ? `${dateArr[1]} ${dateArr[2]}`: `${dateArr[2]}/${dateArr[1]}/${dateArr[3]}`}, ${t}`;
}

const formatTimeMessage = (time) => {
    const diff = (Date.now() - time) / 1000;
    const date = new Date(time);
    const dateArr = date.toString().split(' ');
    const t = dateArr[4].split(':').slice(0, 2).join(':');
    const d = diff / 60 > 10800 ? `${dateArr[2]}/${dateArr[1]}/${dateArr[3]}` : 
    diff / 60 > 2880 ? `${Math.floor(diff / 60 / 1440)} days ago` : 
    diff / 60 > 1440 ? 'yesterday' : 'today';

    // if (diff / 60 < 1440) return t;
    // else return diff < 31_563_000 ? `${dateArr[1]} ${dateArr[2]}`: `${dateArr[2]}/${dateArr[1]}/${dateArr[3]}`;
    return [t, d];
}

function Content (props) {
    let showMenu;
    switch(props.menu.get.type) {
        case 'profile':
            showMenu = <UserFrame menu={props.menu} data={props.data} alert={props.alert} popup={props.popup} />;
            break;
        case 'contacts':
            showMenu = <ContactsFrame menu={props.menu} data={props.data} alert={props.alert} popup={props.popup} />;
            break;
        case 'rooms':
            showMenu = <RoomsFrame menu={props.menu} data={props.data} alert={props.alert} popup={props.popup} />;
            break;
        case 'settings':
            showMenu = <SettingsFrame data={props.data} setAuth={props.setAuth} alert={props.alert} />;
            break;
        default:
            showMenu = <AuthFrame setAuth={props.setAuth} placeholder='Type here...' />;
    }

    return (<>
        {cookie.get('notifications') === 'on' && 
        props.data.socket && 
        props.data.get.user &&
        !props.data.get.user.muted.filter(v => props.data.socket.callData.incomes.has(v)).length &&
        props.data.socket.callData.incomes.size
        ? <audio autoPlay src='sounds/income_call.mp3' />:''}
        <div id='content' className={props.menu.get.type === 'auth' ? '' : 'content-border-r content-border-l'}>{showMenu}</div>
    </>);
}

function AuthFrame (props) {
    const authPromise = Auth.tryAuth();

    const authFail = (
        <>
        <div id='auth-logo' className='css-selector'><p>SpaceTime</p></div>
        <div id='auth-button'>
            <a href='/auth'>SIGN IN WITH 
                <span className='asb'> G</span>
                <span className='asr'>O</span>
                <span className='asy'>O</span>
                <span className='asb'>G</span>
                <span className='asg'>L</span>
                <span className='asr'>E</span>
            </a>
        </div>
        </>
    );

    if (authPromise) {
        React.useEffect(async () => { 
            const { authorized } = await authPromise.then((res) => res.json());
            props.setAuth(authorized);
        }, []);

        return (<></>);
    } else return authFail;
}

function UserFrame (props) {
    const data = props.data.get;
    let id = props.menu.get.id;

    if (data.user && id === data.user.id) id = null;
    let profile = null;
    if (id) profile = data.profiles[id];
    else profile = data.user;

    
    if (!profile) {
        props.data.socket.loadData(id ? { type: 'profile', id }:{ type: 'user' })
        return (<></>);
    } 

    const input = React.useRef();

    const postDeleteButton = (id) => {
        props.data.socket.setData(deletePost(id));
        // const pressEvent = (event) => {
        //     if (event.key !== 'Enter') return;
        //     props.alert({ show: false });
        //     props.data.socket.setData(deletePost(id));
        // }

        // document.addEventListener('keydown', pressEvent);
        // setTimeout(() => document.removeEventListener('keydown', pressEvent), 3000);
        // props.alert({ show: true, type: 'warning', text: 'Press ENTER to confirm' });
    }


    const deletePost = (id) => {
        props.data.socket.request('post', { type: 'delete', id });
        data.user.posts = data.user.posts.filter(v => v.id !== id);
        return data;
    }

    const postLike = (id) => {
        props.data.socket.request('post', { type: 'like', id });
        data.user.liked_posts.push(profile.posts.find(v => v.id === id).id);
        profile.posts = profile.posts.map(v => {
            if (v.id === id) v.likes++;
            return v;
        });
        return data;
    }

    const postUnlike = (id) => {
        props.data.socket.request('post', { type: 'unlike', id });
        data.user.liked_posts = data.user.liked_posts.filter(v => v && v !== id).map(v => v.id);
        profile.posts = profile.posts.map(v => {
            if (v.id === id) v.likes--;
            return v;
        });
        return data;
    }

    const PostsBody = () => {
        const posts = [...profile.posts].reverse().map((v, i) => {
            return (
                <div className='profile-post' key={i}>
                    <Avatar className='profile-post-avatar' url={profile.avatar_url} />
                    {id ? '':<DeleteIcon className='profile-post-delete' onClick={() => postDeleteButton(v.id)} />}
                    <p className='profile-post-time'>{formatTime(v.timestamp)}</p>
                    <p className='profile-post-title'>{v.title}</p>
                    <p className='profile-post-text'>{v.text}</p>
                    {v.files ? <div className='profile-post-imageframe'>{loadFiles(v.files, props.popup, props.data)}</div>:''}
                    <div className='profile-post-buttons'>
                        {data.user.liked_posts.find(v_ => v_ === v.id) ? 
                            <LikeActiveIcon className='profile-post-liked' onClick={() => props.data.socket.setData(postUnlike(v.id))} /> 
                            : <LikeUnactiveIcon className='profile-post-unliked' onClick={() => props.data.socket.setData(postLike(v.id))} />}
                        <ShareIcon className='profile-post-share' />
                        {v.likes ? <div className='profile-post-likes'>{v.likes}</div>:''}
                    </div>
                </div>);
        });

        return (<div id='profile-posts'>{posts.length ? <><span id='profile-posts-bar' />{posts}</>:<p id='profile-noposts'>{!profile.in_contacts && profile.privacy.see === 'contacts' ? 'CLOSED PROFILE' : 'NO POSTS'}</p>}</div>);
    }

    const users = {
        add (id) {
            props.data.socket.request('user', { type: 'add', id });
            data.user.contacts.push(id);
            props.data.socket.setData(data);
        }
    }

    const InteractElement = () => (id ? (
        ( data.user.contacts.includes(id) ? <>
        <MessageIcon id='profile-write' onClick={() => props.menu.set({ type: 'contacts', id: profile.id })} />
        <CallIcon id='profile-call' onClick={profile.privacy.call === 'all' || profile.in_contacts ? () => props.data.socket.call('start', profile.id):null} style={profile.privacy.call === 'all' || profile.in_contacts ? {}:{cursor: 'not-allowed'}} />
        </>: (
        <div id='profile-add' onClick={() => users.add(id)}><p>ADD</p></div>) )
        ) : (
        <div id='profile-newpost' onClick={() => props.popup.set({ show: true, type: 'newpost' })}><p>NEW POST</p></div>
    ));

    React.useEffect(() => input.current.addEventListener('change', async (event) => {
        const blob = Attachs.check([...event.target.files])[0];
        if (blob && blob.type.startsWith('image/')) {
            const newFile = (await Attachs.toString([blob]))[0];
            props.data.socket.request('change', {type: 'avatar', data: newFile});
            data.user.avatar_url = (await Attachs.toUrls([blob]))[0];
            props.data.socket.setData(data);
        }
        else props.alert.set({ show: true, type: 'error', text: 'Image is bigger than 5MB' });
    }, false), []);

    // set old scroll value after re-render
    React.useLayoutEffect(() => {
        if (data.scroll) {
            const elem = document.getElementById('profile-posts');
            elem.scrollTop = data.scroll;
        }
    });

    return (
        <>
            <input type='file' accept='image/*' ref={input} style={{ display: 'none', position: 'absolute' }} />
            <div id='profile-bg' />
            <Avatar url={profile.avatar_url} className='profile-avatar' />
            {profile.id === data.user.id ? <EditIcon id='profile-avatar-edit' onClick={() => input.current.click()} />:''}
            <div id='profile-status'><p>{profile.status}</p></div>
            <div id='profile-name'>{profile.name}{profile.online ? <div id='profile-online' />:''}</div>
            <InteractElement />
            <p id='profile-id'>#{profile.profile_id}</p>
            <PostsBody />
            { id ? <ProfileDropDown menu={props.menu} data={props.data} />:''}
        </>
    );
}

function SettingsFrame (props) {
    const [logoutClicked, setLogoutClicked] = React.useState(false);
    const [inputId, setInputId] = React.useState('');
    const [inputStatus, setInputStatus] = React.useState('');
    const [inputName, setInputName] = React.useState('');

    const inputRef = React.useRef();
    const statusRef = React.useRef();
    const nameRef = React.useRef();

    const randomEmoji = () => {
        const emojis = '😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭🤫🤥😶😐😑😬🙄😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠😈👿👹👺🤡💩👻💀☠️👽👾🤖🎃😺😸😹😻😼😽🙀😿😾';
        const index = Math.floor(emojis.length / 2 * Math.random()) * 2;
        return emojis.slice(index, index+2);
    }

    const changeId = (newId) => {
        if (newId === props.data.get.user.profile_id) props.alert({show: true, text: 'Your new ID must be NEW'});
        else if (!/^[a-z0-9]{1,}$/.test(newId)) props.alert({show: true, text: 'ID must consist of lowercase letters or numbers'});
        else if (!/^[a-z0-9]{5,16}$/.test(newId)) props.alert({show: true, text: 'Length of an ID must be between 5 and 15 characters'});
        else {
            props.data.socket.request('change', { type: 'id', id: newId });
            const data = props.data.get;
            data.user.profile_id = newId;
            props.data.set(data);
            props.alert({show: true, text: 'Nice profile ID!', type: 'success'});
            inputRef.current.value = '';
        }
    }

    const changeStatus = (newStatus) => {
        if (newStatus === props.data.get.user.status) return;
        const data = props.data.get;
        newStatus = newStatus ? newStatus : randomEmoji()+randomEmoji();
        data.user.status = newStatus;
        props.data.set(data);

        props.data.socket.request('change', { type: 'status', data: newStatus });
        props.alert({show: true, text: 'Status updated', type: 'success'});
        statusRef.current.value = '';
    }

    const changeName = (newName) => {
        if (!newName || newName === props.data.get.user.name) return;
        const data = props.data.get;
        data.user.name = newName;
        props.data.set(data);

        props.data.socket.request('change', { type: 'name', data: newName });
        props.alert({show: true, text: 'Name updated', type: 'success'});
        nameRef.current.value = '';
    }

    const user = props.data.get.user;

    // modify privacy settings
    const swp_ = (type, state) => {
        props.data.socket.request('change', { type: 'privacy', data: { type, state }});
        const data = props.data.get;
        data.user.privacy[type] = state;
        props.data.set(data);
    }

    const notifToggle = async () => {
        const elem = document.getElementById('settings-notify-button');
        if (elem.classList.contains('on')) {
            cookie.set('notifications', 'off');
            elem.classList.toggle('on');
            elem.classList.toggle('off');
        } else Notification.requestPermission().then((p) => {
            if (p === 'granted') {
                cookie.set('notifications', 'on');
                elem.classList.toggle('on');
                elem.classList.toggle('off');
            }
        });
    }

    return (
        <div id='settings-frame'>
            <div id='settings-text-frame'>
                <p className='settings-title'>Privacy</p>
                <p className='settings-text'>Who can write me</p>
                <p className='settings-text'>Who can call me</p>
                <p className='settings-text'>Who can see my posts</p>
                <div style={{width: '100%', height: '5vh'}} />
                <p className='settings-title'>Account</p>
                <p className='settings-text'>Change my ID</p>
                <p className='settings-text'>Change status</p>
                <p className='settings-text'>Change name</p>
            </div>
            <div id='settings-interact-frame-1'>
                <SettingsButton default={user.privacy.write} func={{on: () => swp_('write', 'contacts'), off: () => swp_('write', 'all')}} />
                <SettingsButton default={user.privacy.call} func={{on: () => swp_('call', 'contacts'), off: () => swp_('call', 'all')}} />
                <SettingsButton default={user.privacy.see} func={{on: () => swp_('see', 'contacts'), off: () => swp_('see', 'all')}} />
            </div>
            <div id='settings-change-id' className='settings-change'>
                <p className='settings-change-id-symb'>#</p>
                <input id='settings-change-input-id' className='settings-change-input' maxLength='16' ref={inputRef} placeholder={user.profile_id} onChange={(event) => setInputId(event.target.value)} />
                <div className='settings-change-submit' onClick={() => changeId(inputId)}><p>OK</p></div>
            </div>
            <div id='settings-change-status' className='settings-change'>
                <input className='settings-change-input' maxLength='16' ref={statusRef} placeholder={user.status} onChange={(event) => setInputStatus(event.target.value)} />
                <div className='settings-change-submit' onClick={() => changeStatus(inputStatus)}><p>OK</p></div>
            </div>
            <div id='settings-change-name' className='settings-change' style={{ fontWeight: 500 }}>
                <input className='settings-change-input' maxLength='10' ref={nameRef} placeholder={user.name} onChange={(event) => setInputName(event.target.value)} />
                <div className='settings-change-submit' onClick={() => changeName(inputName)}><p>OK</p></div>
            </div>
            <div id='settings-notify' onClick={notifToggle}><div id='settings-notify-button' className={cookie.get('notifications') === 'on' ? 'on':'off'} />Recieve notifications</div>
            <div id='settings-logout' className={logoutClicked ? 'settings-logout-click':''} onClick={() => { logout(props.setAuth); setLogoutClicked(true); }}><p>LOGOUT</p></div>
        </div>
    );
}

function ContactsFrame (props) {
    const [files, setFiles] = React.useState([]);
    const [rec, setRec] = React.useState(0);
    const [recTime, setRecTime] = React.useState(0);
    const [invites, setInvites] = React.useState({});
    const eqElem = React.useRef();
    const inputRef = React.useRef();
    const data = props.data.get;
    const profile = data.profiles[props.menu.get.id];

    // get most recent chat
    if (!profile) return (<div id='contacts-select'>SELECT CHAT</div>);

    const [input, setInput] = React.useState('');
    const [inputHeight, changeInputHeight] = React.useState(0);

    const loadMessages = (history) => {
        return history.map((v, i) => {
            let [time, date] = formatTimeMessage(v.timestamp);
            return (<div key={i} className={`contacts-message-${v.sender === data.user.id ? 'r':'l'}`}>
                <div className='text'>{parseInvites(v.text)}</div>
                {v.audio.uri ? <AudioMessage data={v.audio} />:''}
                <div className='files'>{loadFiles(v.files, props.popup, false, 2)}</div>
                {v.geo && v.geo.lat ? <iframe className='map' src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4000!2d${v.geo.lon}!3d${v.geo.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sru!2s!4v1628611962984!5m2!1sru!2s`} loading='lazy' />:''}
                <div className='time'>{v.sender === data.user.id ? 
                <><div className='time-hover'>{date}</div>{time}</>:
                <>{time}<div className='time-hover'>{date}</div></>
                }</div>
                {history.length - i <= data.chats[profile.id].unread.count ? <div className='unread' />:''}
            </div>);
        });
    }

    const sendMessage = async (content) => {
        let text = content.text.trim();
        content.geo = {};
        text = text.split(' ');
        if (text.includes('@geo')) {
            text = text.filter(v => v !== '@geo');
            const geo = await getGeo().catch(() => props.alert({ show: 'true', type: 'error', text: 'Unnable to get your geoposition' }));
            if (geo) content.geo = { lat: geo.latitude, lon: geo.longitude };
        }
        text = text.join(' ');
        text = text.trim();

        for (let i in invites) text = text.replace(i, invites[i]);

        if (!text && !files.length && !rec && !content.geo.lat) return;
        const files_ = await Attachs.toString(files);
        content.files = files_;
        content.type = 'new';
        content.text = text;
        content.audio = {data: rec, time: recTime};
        props.data.socket.request('message', content);
        document.getElementById('contacts-bottom-textarea').value = '';
        setFiles([]);
        setInput('');
        setRec(0);
        setRecTime(0);
        setInvites({});
    }

    const inputOnChange = () => {
        const elem = document.getElementById('contacts-bottom-textarea');
        const text = elem.value;
        while (elem.value.indexOf('<room-inv/') !== -1) {
            let text = elem.value;
            const i1 = text.indexOf('<room-inv/');
            let temp1 = text.slice(i1);
            const i2 = temp1.indexOf('|');
            const i3 = temp1.indexOf('/>');
            let temp2 = temp1.slice(i2+1, i3);

            const inviteText = `invite to ${temp2}`;
            invites[inviteText] = temp1.slice(0, i3+2);
            elem.value = `${text.slice(0, i1)}${inviteText}${text.slice(i1 + i3+2)}`;
        }

        let textVerify = elem.value;
        for (let i in invites) {
            const i1 = textVerify.indexOf(i);
            if (i1 !== -1) textVerify = textVerify.slice(i1 + i.length);
            else delete invites[i];
        }

        setInvites(invites);
        setInput(text);
    }
    
    const parseInvites = (text) => {
        const ii = [];
        let text2 = text, sl = 0;
        while (text2.indexOf('<room-inv/') !== -1) {
            const i1 = text2.indexOf('<room-inv/');
            let temp1 = text2.slice(i1);
            const i2 = temp1.indexOf('/>');
            const i = [i1 + sl, i1+i2+2 + sl] 

            ii.push(i);
            text2 = text2.slice(i[1]);
            sl += i[1];
        }

        const parsed = ii.map((v, i) => {
            let text2 = '', text3 = '';
            if (!i) text2 = text.slice(0, v[0]);
            else text2 = text.slice(ii[i-1][1], v[0]);
            if (ii.length - 1 === i) text3 = text.slice(v[1]);

            let temp = text.slice(v[0]+10);
            const id = temp.slice(0, temp.indexOf('|'));
            const name = temp.slice(temp.indexOf('|')+1, temp.indexOf('/>'));

            return (<span key={i}>{text2}<span className='invite' onClick={() => props.data.socket.request('room', { type: 'join', id })}>Invite to {name}</span>{text3}</span>);
        });

        return parsed.length ? parsed:text;
    }

    React.useEffect(() => {
        if (inputHeight) {
            const elem = document.getElementById('contacts-bottom');
            elem.style.marginTop = `${inputHeight}vh`;
        } else onHeightChange();
    }, [inputHeight]);

    // scroll to bottom of the history
    React.useLayoutEffect(() => {
        const elem2 = document.getElementById('contacts-history');
        elem2.scrollTop = elem2.scrollHeight;
    }, [data.chats[profile.id] && data.chats[profile.id].history.length]);

    // view messages
    React.useEffect(() => {
        if (data.chats[profile.id].unread && data.chats[profile.id].unread.id === data.user.id) {
            props.data.socket.request('message', { type: 'watch', id: profile.id });
            data.chats[profile.id].unread = { id: '', count: 0 };
            props.data.socket.setData(data);
        }

    }, [data.chats[profile.id].unread ? data.chats[profile.id].unread.id:'']);

    React.useEffect(() => {
        if (rec) return;
        while (eqElem.current.firstChild)
            eqElem.current.removeChild(eqElem.current.lastChild);
        inputRef.current.value = '';
        
    }, [rec])

    const onHeightChange = () => {
        const IDEAL_H = 97;
        const style = getComputedStyle(document.querySelector('#contacts-bottom'));
        const height = pxToVh(parseInt(style['height']));
        const marginTop = pxToVh(parseInt(style['margin-top']));
        
        if (IDEAL_H !== height + marginTop) {
            const newMargin = -height + IDEAL_H;
            changeInputHeight(newMargin);
        }
    }

    const onKeyPress = (event) => {
        if (event.code === 'Enter') 
            if (!event.shiftKey) sendMessage({ text: input, id: profile.id });
    }

    const startRec = async () => {
        inputRef.current.value = '00:00';
        const interval = setInterval(() => {
            if (!props.data.socket.rec.timestamp) return;
            const diff = Date.now() - props.data.socket.rec.timestamp;
            const date = new Date(diff);
            setRecTime(diff);
            inputRef.current.value = `${(''+date.getMinutes()).length > 1 ? date.getMinutes():`0${date.getMinutes()}`}:${(''+date.getSeconds()).length > 1 ? date.getSeconds():`0${date.getSeconds()}`}`
        }, 100);

        const recorder = await props.data.socket.startRec(eqElem);
        recorder.on('data', (data) => {
            clearInterval(interval);
            setRec(data);
        });
        setRec(1);
    }

    return (<>
        <div id='contacts-history'>{loadMessages(data.chats[profile.id] ? data.chats[profile.id].history:[])}</div>
        <div id='contacts-top'>
            <ContactsDropDown menu={props.menu} data={props.data} />
            {props.data.socket.callData.state === 2 ? (props.data.socket.callData.muted ? <MicOffIcon id='contacts-mute' onClick={() => props.data.socket.callMuteToggle()} />:<MicIcon id='contacts-mute' onClick={() => props.data.socket.callMuteToggle()} />):''}
            {
                //                                                                                                                                                                                                                                                                                                                                                                                                            too long? 😯
            }
            <CallIcon id='contacts-call' className={props.data.socket.callData.current === profile.id && props.data.socket.callData.state ? 'contacts-call-active':'contacts-call-unactive'} onClick={profile.privacy.call === 'all' || profile.in_contacts || props.data.socket.callData.state === 2 ? () => props.data.socket.call(props.data.socket.callData.current === profile.id && props.data.socket.callData.state ? 'end':'start', profile.id):null} />
            <div id='contacts-top-profile' onClick={() => props.menu.set({ type: 'profile', id: profile.id })}><Avatar className={'contacts-top-avatar' + (profile.online ? ' contacts-top-avatar-online':'')} url={profile.avatar_url} /><p>{profile.name}</p></div></div>
        <div id='contacts-bottom'>
            <DynamicTextarea ref={inputRef} id='contacts-bottom-textarea' disabled={!data.user.contacts.includes(profile.id) || profile.blocked || rec || (!profile.in_contacts && profile.privacy.write === 'contacts')} onKeyUp={onKeyPress} maxLength='500' placeholder={!profile.in_contacts && profile.privacy.write === 'contacts' ? `${profile.name} is unreachable`:(data.user.contacts.includes(profile.id) && !profile.blocked ? 'Type here...':(profile.blocked ? `${profile.name} blocked you`:`Add ${profile.name} to write him`))} maxRows='7' onChange={inputOnChange} onHeightChange={onHeightChange} />
            <div id='contacts-eq' ref={eqElem} style={{display: rec ? 'flex':'none'}} />
            { rec === 0 ?
                <AttachmentsButton id='contacts-attach' files={{get: files, set: setFiles}} alert={{set: props.alert}} />
            : rec === 1 ?
                <SoundStopIcon id='contacts-attach' onClick={() => props.data.socket.stopRec()} style={{ marginTop: '0.7vh', right: '5.5vh' }} />
            :   <DeleteIcon id='contacts-attach' onClick={() => setRec(0)} style={{ top: '1.5vh', width: '3vh', height: '3vh' }} />
            }
            {input || files.length || typeof rec === 'object' ? <SendIcon id='contacts-bottom-2' onClick={() => sendMessage({ text: input, id: profile.id, audio: rec })} />:<MicIcon id='contacts-bottom-2' onClick={rec ? () => 0:startRec} className={rec === 1 ? 'contacts-rec':''} />}
            <span id='contacts-bottom-bar' />
        </div>
    </>);
}

function RoomsFrame(props) {
    const data = props.data.get;
    const room = data.rooms[props.menu.get.id];
    
    // get most recent chat
    if (!room) return (<div id='contacts-select'>SELECT ROOM</div>);
    
    const [files, setFiles] = React.useState([]);
    const [rec, setRec] = React.useState(0);
    const [recTime, setRecTime] = React.useState(0);
    const [invites, setInvites] = React.useState({});
    const eqElem = React.useRef();
    const inputRef = React.useRef();

    const [input, setInput] = React.useState('');
    const [inputHeight, changeInputHeight] = React.useState(0);

    const loadMessages = (history) => {
        return history.map((v, i) => {
            let [time, date] = formatTimeMessage(v.timestamp);
            return (<div key={i} className={`rooms-message-${v.sender === data.user.id ? 'r':'l'}`}>
                <Avatar url={v.sender === data.user.id ? data.user.avatar_url:data.profiles[v.sender].avatar_url} className='avatar' />
                <p className='name'>{v.sender === data.user.id ? 'You':data.profiles[v.sender].name}</p>
                <div className='text'>{parseInvites(v.text)}</div>
                {v.audio.uri ? <AudioMessage data={v.audio} />:''}
                <div className='files'>{loadFiles(v.files, props.popup, false, 2)}</div>
                {v.geo && v.geo.lat ? <iframe className='map' src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4000!2d${v.geo.lon}!3d${v.geo.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sru!2s!4v1628611962984!5m2!1sru!2s`} loading='lazy' />:''}
                <div className='time'>{v.sender === data.user.id ? 
                <><div className='time-hover'>{date}</div>{time}</>:
                <>{time}<div className='time-hover'>{date}</div></>
                }</div>
            </div>);
        });
    }

    const sendMessage = async (content) => {
        let text = content.text.trim();
        content.geo = {};
        text = text.split(' ');
        if (text.includes('@geo')) {
            text = text.filter(v => v !== '@geo');
            const geo = await getGeo().catch(() => props.alert({ show: 'true', type: 'error', text: 'Unnable to get your geoposition' }));
            if (geo) content.geo = { lat: geo.latitude, lon: geo.longitude };
        }
        text = text.join(' ');
        text = text.trim();

        for (let i in invites) text = text.replace(i, invites[i]);

        if (!text && !files.length && !rec && !content.geo.lat) return;
        const files_ = await Attachs.toString(files);
        content.files = files_;
        content.type = 'new';
        content.text = text;
        content.audio = {data: rec, time: recTime};
        props.data.socket.request('room', { type: 'message', id: room.id, data: content });
        document.getElementById('contacts-bottom-textarea').value = '';
        setFiles([]);
        setInput('');
        setRec(0);
        setRecTime(0);
        setInvites({});
    }

    const inputOnChange = () => {
        const elem = document.getElementById('contacts-bottom-textarea');
        const text = elem.value;
        while (elem.value.indexOf('<room-inv/') !== -1) {
            let text = elem.value;
            const i1 = text.indexOf('<room-inv/');
            let temp1 = text.slice(i1);
            const i2 = temp1.indexOf('|');
            const i3 = temp1.indexOf('/>');
            let temp2 = temp1.slice(i2+1, i3);

            const inviteText = `invite to ${temp2}`;
            invites[inviteText] = temp1.slice(0, i3+2);
            elem.value = `${text.slice(0, i1)}${inviteText}${text.slice(i1 + i3+2)}`;
        }

        let textVerify = elem.value;
        for (let i in invites) {
            const i1 = textVerify.indexOf(i);
            if (i1 !== -1) textVerify = textVerify.slice(i1 + i.length);
            else delete invites[i];
        }

        setInvites(invites);
        setInput(text);
    }
    
    const parseInvites = (text) => {
        const ii = [];
        let text2 = text, sl = 0;
        while (text2.indexOf('<room-inv/') !== -1) {
            const i1 = text2.indexOf('<room-inv/');
            let temp1 = text2.slice(i1);
            const i2 = temp1.indexOf('/>');
            const i = [i1 + sl, i1+i2+2 + sl] 

            ii.push(i);
            text2 = text2.slice(i[1]);
            sl += i[1];
        }

        const parsed = ii.map((v, i) => {
            let text2 = '', text3 = '';
            if (!i) text2 = text.slice(0, v[0]);
            else text2 = text.slice(ii[i-1][1], v[0]);
            if (ii.length - 1 === i) text3 = text.slice(v[1]);

            let temp = text.slice(v[0]+10);
            const id = temp.slice(0, temp.indexOf('|'));
            const name = temp.slice(temp.indexOf('|')+1, temp.indexOf('/>'));

            return (<span key={i}>{text2}<span className='invite' onClick={() => props.data.socket.request('room', { type: 'join', id })}>Invite to {name}</span>{text3}</span>);
        });

        return parsed.length ? parsed:text;
    }

    React.useEffect(() => {
        if (inputHeight) {
            const elem = document.getElementById('contacts-bottom');
            elem.style.marginTop = `${inputHeight}vh`;
        } else onHeightChange();
    }, [inputHeight]);

    // scroll to bottom of the history
    React.useLayoutEffect(() => {
        const elem2 = document.getElementById('contacts-history');
        elem2.scrollTop = elem2.scrollHeight;
    }, [room.history.length]);

    // reset recording
    React.useEffect(() => {
        if (rec) return;
        while (eqElem.current.firstChild)
            eqElem.current.removeChild(eqElem.current.lastChild);
        inputRef.current.value = '';
        
    }, [rec])

    const onHeightChange = () => {
        const IDEAL_H = 97;
        const style = getComputedStyle(document.querySelector('#contacts-bottom'));
        const height = pxToVh(parseInt(style['height']));
        const marginTop = pxToVh(parseInt(style['margin-top']));
        
        if (IDEAL_H !== height + marginTop) {
            const newMargin = -height + IDEAL_H;
            changeInputHeight(newMargin);
        }
    }

    const onKeyPress = (event) => {
        if (event.code === 'Enter') 
            if (!event.shiftKey) sendMessage({ text: input, id: room.id });
    }

    const startRec = async () => {
        inputRef.current.value = '00:00';
        const interval = setInterval(() => {
            if (!props.data.socket.rec.timestamp) return;
            const diff = Date.now() - props.data.socket.rec.timestamp;
            const date = new Date(diff);
            setRecTime(diff);
            inputRef.current.value = `${(''+date.getMinutes()).length > 1 ? date.getMinutes():`0${date.getMinutes()}`}:${(''+date.getSeconds()).length > 1 ? date.getSeconds():`0${date.getSeconds()}`}`
        }, 100);

        const recorder = await props.data.socket.startRec(eqElem);
        recorder.on('data', (data) => {
            clearInterval(interval);
            setRec(data);
        });
        setRec(1);
    }

    return (<>
        <div id='contacts-history'>{loadMessages(room.history)}</div>
        <div id='contacts-top'>
            <RoomsDropDown menu={props.menu} data={props.data} alert={props.alert} />
            {props.data.socket.callData.state === 2 ? (props.data.socket.callData.muted ? <MicIcon id='contacts-mute' onClick={() => props.data.socket.callMuteToggle()} />:<MicOffIcon id='contacts-mute' onClick={() => props.data.socket.callMuteToggle()} />):''}
            <CallIcon id='contacts-call' className={props.data.socket.callData.current === room.id && props.data.socket.callData.state ? 'contacts-call-active':'contacts-call-unactive'} onClick={() => props.data.socket.call(!props.data.socket.callData.state ? 'start':'end', room.id)} />
            <div id='contacts-top-profile'><Avatar className='contacts-top-avatar' room={room.name} url={room.avatar_url} /><p>{room.name}</p></div></div>
        <div id='contacts-bottom'>
            <DynamicTextarea ref={inputRef} id='contacts-bottom-textarea' onKeyUp={onKeyPress} maxLength='500' placeholder='Type here...' maxRows='7' onChange={inputOnChange} onHeightChange={onHeightChange} />
            <div id='contacts-eq' ref={eqElem} style={{display: rec ? 'flex':'none'}} />
            { rec === 0 ?
                <AttachmentsButton id='contacts-attach' files={{get: files, set: setFiles}} alert={{set: props.alert}} />
            : rec === 1 ?
                <SoundStopIcon id='contacts-attach' onClick={() => props.data.socket.stopRec()} style={{ marginTop: '0.7vh', right: '5.5vh' }} />
            :   <DeleteIcon id='contacts-attach' onClick={() => setRec(0)} style={{ top: '1.5vh', width: '3vh', height: '3vh' }} />
            }
            {input || files.length || typeof rec === 'object' ? <SendIcon id='contacts-bottom-2' onClick={() => sendMessage({ text: input, id: room.id, audio: rec })} />:<MicIcon id='contacts-bottom-2' onClick={rec ? () => 0:startRec} className={rec === 1 ? 'contacts-rec':''} />}
            <span id='contacts-bottom-bar' />
        </div>
    </>);
}

function loadFiles(files, popup, data=false, f = 4) {
    if (!files.length) return '';
    const fCounter = Math.ceil(files.length / f);
    const view = (file) => {
        if (data) data.socket.setData(data.get);
        popup.set({ type: 'file', uri: file[0], fType: file[1], show: true });
    }

    const fileLoad = (file, i) => file[1].startsWith('image') ? <img src={file[0]} onClick={() => view(file)} alt={file[1]} key={i} />:<FileIcon className='images-file' alt='text file' key={i} onClick={() => view(file)} />;

    return (<div className='images-frame'>
        <div className='images-main'>{files.slice(0, fCounter).map(fileLoad)}</div>
        { files.length > 1 ? <div className='images-side'>{files.slice(fCounter).map(fileLoad)}</div>:''}
    </div>);
}

function AudioMessage(props) {
    const audioRef = React.useRef();
    const input = React.useRef();
    const [progress, setProgress] = React.useState(0);

    const onTimeChange = () => {
        const time = input.current.value;
        audioRef.current.currentTime = time / 1000;
        setProgress(time);
    }

    const onTimeUpdate = (e, time = audioRef.current.currentTime) => {
        setProgress(time * 1000);
    }

    const parseTime = (time) => {
        time = time - props.data.time;
        time = Math.floor(time / -1000);
        const seconds = `${time % 60}`;
        return `-${Math.floor(seconds / 60)}:${seconds.length > 1 ? seconds:`0${seconds}`}`;
    }

    React.useEffect(() => {
        const width =  progress / input.current.max * 100 + '%';
        input.current.style.setProperty('--bar-width', width);
    }, [progress]);

    return (<div className='audio'>
        <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={(e) => onTimeUpdate(e, props.data.time / 1000)}><source src={props.data.uri} /></audio>
        {audioRef.current && !(audioRef.current.paused || audioRef.current.ended) ? <PauseIcon className='audio-button' onClick={() => audioRef.current.pause()} />:<PlayIcon className='audio-button' onClick={() => audioRef.current.play()} />}
        <input ref={input} type='range' min='0' max={props.data.time} value={progress} className='audio-bar' onChange={onTimeChange} />
        <div className='audio-time'>{parseTime(progress)}</div>
    </div>);
}

module.exports = Content;
 