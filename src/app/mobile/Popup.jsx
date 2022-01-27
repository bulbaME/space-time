const React = require('react');
const { AttachmentsButton } = require('./Buttons.jsx');
const Attachs = require('../Files.js');
const Avatar = require('./Avatar.jsx');
const { useSwipeable } = require('react-swipeable');

// icons
import DropdownDots from '../graphics/dropdown-dots.jsx';
import EditIcon from '../graphics/icon-edit.jsx';
import DisableIcon from '../graphics/icon-disable.jsx';
import EnableIcon from '../graphics/icon-enable.jsx';
import DeleteIcon from '../graphics/icon-delete.jsx';
import BlockIcon from '../graphics/icon-block.jsx';
import UnblockIcon from '../graphics/icon-unblock.jsx';
import NotifIcon from '../graphics/icon-notification.jsx';
import NotifIcon2 from '../graphics/icon-notification2.jsx';
import AddIcon from '../graphics/icon-add.jsx';
import UpArrowIcon from '../graphics/icon-arrow-up.jsx';
import DragDrop from '../graphics/post-draganddrop.jsx';
import CallIcon from '../graphics/icon-call.jsx';
import ExitIcon from '../graphics/icon-exit.jsx';
import LikeActiveIcon from '../graphics/icon-star-active.jsx';
import LikeUnactiveIcon from '../graphics/icon-star-unactive.jsx';
import CloseIcon from '../graphics/icon-close.jsx';
import ArrowIcon from '../graphics/icon-arrow.jsx'

const vhToPx = (vh) => {
	return vh * (document.documentElement.clientHeight / 100);
}

function AlertM (props) {
    const [alerts, setAlerts] = React.useState({ type: '', show: '', timeout: 0, text: {} });

    const classes = {
        message: ['alert', 'alert-hide', 'alert-t-message'],
        warning: ['alert', 'alert-hide', 'alert-t-warning'],
        success: ['alert', 'alert-hide', 'alert-t-success'],
        error: ['alert', 'alert-hide', 'alert-t-error']
    };
    const data = props.alert.get;

    const intrerupt = (alerts, skip=false) => {
        clearTimeout(alerts.timeout);
        if (skip) return;
        alerts.show = false;
        setAlerts(alerts);  // make alert invisible
        props.alert.set({show: false, text: data.text, type: props.alert.get.type});  // set call to false
    }

    if (data.show && !alerts.show) {
        if (alerts.show && data.type !== alerts.type) intrerupt(alerts, true);
        const timeout = setTimeout(() => intrerupt(alerts), props.alert.timeout || 1500);
        const text = alerts.text;
        text[data.type || 'error'] = data.text;
        setAlerts({ type: data.type, show: true, timeout, text });  // make alert visible
    }

    if (alerts.show)
        switch(alerts.type) {
            case 'warning':
            case 'success':
            case 'message':
                classes[alerts.type][1] = 'alert-show';
                break;
            default:
                classes.error[1] = 'alert-show';
        }

    return (
        <>
            <div className={classes.message.join(' ')} onClick={() => intrerupt(alerts)}>{ alerts.text.message }</div>
            <div className={classes.warning.join(' ')} onClick={() => intrerupt(alerts)}>{ alerts.text.warning }</div>
            <div className={classes.success.join(' ')} onClick={() => intrerupt(alerts)}>{ alerts.text.success }</div>
            <div className={classes.error.join(' ')} onClick={() => intrerupt(alerts)}>{ alerts.text.error }</div>
        </>
    );
}

function PopupM (props) {
    const data = props.popup.get;
    let incomes = props.incomes.get;

    incomes = incomes.map(id => {
        const data_ = id[0] === 'r' ? props.data.get.rooms[id]:props.data.get.profiles[id];
        const close = (id) => {
            let incomes = props.incomes.get.filter(v => v !== id);
            data.show = false; 
            props.incomes.set(incomes);
            props.data.socket.setData(props.data.get);
        }

        if (!data_) props.data.socket.loadData({ type: 'profile', id });
        else {
            return (
            <div key={id} className='popup-income'>
                <p className='popup-income-name'>{data_.name}</p>
                <Avatar className='popup-income-avatar' url={data_.avatar_url} />
                <CallIcon className='popup-income-accept' onClick={() => props.data.socket.call('start', id)} />
                <CallIcon className='popup-income-decline' onClick={() => props.data.socket.call('end', id)} />
                <CloseIcon className='popup-income-close' onClick={() => close(id)} />
            </div>
            );
        }
    });

    let Element, bodyColor;
    switch(data.type) {
        case 'newpost':
            Element = NewPost;
            bodyColor = 'black';
            break;
        case 'confirm':
            Element = Confirm;
            bodyColor = 'none';
            break;
        case 'file':
            Element = FilePop;
            bodyColor = 'black';       
            break;     
        default:
            Element = '';
    }

    React.useEffect(() => {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') props.popup.set({ show: false });
        }, false);

        // document.addEventListener('dragover', (event) => {
        //     event.stopPropagation();
        //     event.preventDefault();

        //     event.path.forEach((elem) => {
        //         if (elem.className !== 'popup-income') return;
        //         elem.style.top = `${event.y - vhToPx(10)}px`;
        //         elem.style.left = `${event.x - vhToPx(10)}px`;
        //     });
        // });
    }, []);

    const close = () => props.popup.set({ show: false });
    props.popup.close = close;
    
    return (<>
        {incomes}
        { data.show && Element ? <>
        <div id='popup-body' onClick={close} style={{ backgroundColor: bodyColor }} />
        <Element data={props.data} close={close} popup={props.popup} alert={props.alert} /> 
        </> : ''}
        </>);
}

function FilePop (props) {
    const data = props.popup.get;
    const swiping = useSwipeable({
        onSwipedLeft: () => {
            if (data.next) data.next();
        },

        onSwipedRight: () => {
            if (data.prev) data.prev();
        }
    });

    return (<>
        <div id='popup-file-image-frame' onClick={props.close} {...swiping}>
        <CloseIcon id='popup-file-close' />
        { data.fType.startsWith('image') ? 
        <img id='popup-file-image' src={data.uri} />
        : <iframe id='popup-file-txt' src={data.uri} /> }
        </div>
    </>);
}

function Confirm (props) {
    const f = props.popup.get.func;

    return (
        <div id='popup-confirm-body'>
            <p>Are you sure?</p>
            <div id='popup-confirm-no' onClick={() => { f.no(); props.popup.close(); }}>NO</div>
            <div id='popup-confirm-yes' onClick={() => { f.yes(); props.popup.close(); }}>YES</div>
        </div>
    );
}

function NewPost (props) {
    const [input, setInput] = React.useState({ title: '', text: '' });
    const [files, setFiles] = React.useState([]);

    React.useEffect(() => {
        const field1 = document.getElementById('popup-newpost-textarea');
        const field2 = document.getElementById('popup-newpost-drop');
        
        field1.addEventListener('dragenter', dragHadler.in);
        field1.addEventListener('dragover', dragHadler.drag);
        field2.addEventListener('drag', dragHadler.drop);
        field2.addEventListener('drop', dragHadler.drop);

        field2.addEventListener('dragleave', dragHadler.out);
        field2.addEventListener('dragover', dragHadler.drag);
        field2.addEventListener('drag', dragHadler.drop);
        field2.addEventListener('drop', dragHadler.drop);
    }, []);

    const dragHadler = {
        in(e) {
            e.preventDefault();
            e.stopPropagation();

            const dragdrop = document.getElementById('popup-newpost-drop');
            const textarea = document.getElementById('popup-newpost-textarea');

            dragdrop.style.display = 'block';
            textarea.style.display = 'none';
        },

        out(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
    
                if (e.fromElement && e.fromElement.id !== 'popup-newpost-body') return;
            }

            const dragdrop = document.getElementById('popup-newpost-drop');
            const textarea = document.getElementById('popup-newpost-textarea');

            dragdrop.style.display = 'none';
            textarea.style.display = 'block';
        },

        drag(e) {
            e.preventDefault();
            e.stopPropagation();

        },

        drop(e) {
            e.preventDefault();
            e.stopPropagation();
            dragHadler.out();
            const newFiles = Attachs.check([...e.dataTransfer.files]);

            if (newFiles) setFiles(files.concat(newFiles));
            else props.alert.set({ show: true, type: 'error', text: 'One of your files is bigger than 5MB' });
        }
    }
 
    React.useEffect(() => {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && event.shiftKey) post();
        }, false);
    }, []);

    const post = async () => {
        const files_  = await Attachs.toString(files);
        if (input.title.length > 30 || input.text.length > 1500 || !(input.title || input.text || files_.length)) return; 
        const postBody = {
            title: input.title,
            text: input.text,
            files: files_
        };

        props.popup.close();
        props.data.socket.request('post', { type: 'new', data: postBody });
    }

    const updateInput = (event, type) => {
        if (type === 'title') input.title = event.target.value.trim();
        else input.text = event.target.value.trim();

        setInput(input);
    }

    return (<>
        <div id='popup-newpost-body'>
            <input maxLength='30' placeholder='Title' onChange={(event) => {updateInput(event, 'title')}} />
            <AttachmentsButton id='popup-newpost-attach' files={{get: files, set: setFiles}} alert={props.alert} />
            <UpArrowIcon id='submit' onClick={post} />
            <DragDrop id='popup-newpost-drop' style={{display: 'none'}}/>
            <textarea id='popup-newpost-textarea' maxLength='1500' placeholder='Write here...' wrap='soft' onChange={(event) => {updateInput(event, 'text')}} />
        </div>
    </>);
}

function ProfileDropDown (props) {
    const [dropped, setDropped] = React.useState(false);
    const profileId = props.menu.get.id;
    const data = props.data.get;

    const Menu = () => {
        return (<div className='profile-dropdown-menu' onClick={() => setDropped(false)}>
            <span id='profile-dropdown-bar' />
            {!data.user.muted.includes(profileId) ? 
                <NotifIcon className='profile-dropdown-item profile-dropdown-notify' onClick={() => { props.data.socket.request('user', { type: 'mute', id: profileId }); data.user.muted.push(profileId); props.data.socket.setData(data) }} />
            :   <NotifIcon2 className='profile-dropdown-item profile-dropdown-notify2' onClick={() => { props.data.socket.request('user', { type: 'unmute', id: profileId }); data.user.muted = data.user.muted.filter(v => v !== profileId); props.data.socket.setData(data) }} />}
            {data.user.contacts.includes(profileId) ? 
                <DisableIcon className='profile-dropdown-item profile-dropdown-delete' onClick={() => { props.data.socket.request('user', { type: 'remove', id: profileId }); data.user.contacts = data.user.contacts.filter(v => v !== profileId); props.data.socket.setData(data) }} />
            :   <EnableIcon className='profile-dropdown-item profile-dropdown-add' onClick={() => { props.data.socket.request('user', { type: 'add', id: profileId }); data.user.contacts.push(profileId); props.data.socket.setData(data) }} />}
            {data.user.blocked.includes(profileId) ? 
                <UnblockIcon className='profile-dropdown-item profile-dropdown-unblock' onClick={() => { props.data.socket.request('user', { type: 'unblock', id: profileId }); data.user.blocked = data.user.blocked.filter(v => v !== profileId); props.data.socket.setData(data) }} />
            :   <BlockIcon className='profile-dropdown-item profile-dropdown-block' onClick={() => { props.data.socket.request('user', { type: 'block', id: profileId }); data.user.blocked.push(profileId); props.data.socket.setData(data) }} />}
        </div>);
    }

    return (<>
        {dropped ? <Menu />:''}
        <DropdownDots id='profile-dropdown-dots' className={'profile-dropdown-dots-' + (dropped ? 'down':'up')} onClick={() => setDropped(!dropped)} />
    </>);
}

function ContactsDropDown (props) {
    const [dropped, setDropped] = React.useState(false);
    const profileId = props.menu.get.id;
    const data = props.data.get;
    const deleteH = () => {
        const confirm = props.popup.get;

        confirm.func = {
            yes: () => props.data.socket.request('message', { type: 'clear', id: profileId }),
            no: () => 0 
        }
        confirm.type = 'confirm'
        confirm.show = true

        props.popup.set(confirm);
        props.data.socket.setData(props.data.get);
    }

    const Menu = () => {
        return dropped ? (<div className='contacts-dropdown-menu' onClick={() => setDropped(false)}>
            <span id='contacts-dropdown-bar' />
            {!data.user.muted.includes(profileId) ? 
                <NotifIcon className='contacts-dropdown-item contacts-dropdown-notify' onClick={() => { props.data.socket.request('user', { type: 'mute', id: profileId }); data.user.muted.push(profileId); props.data.socket.setData(data) }} />
            :   <NotifIcon2 className='contacts-dropdown-item contacts-dropdown-notify2' onClick={() => { props.data.socket.request('user', { type: 'unmute', id: profileId }); data.user.muted = data.user.muted.filter(v => v !== profileId); props.data.socket.setData(data) }} />}
            <DeleteIcon className='contacts-dropdown-item contacts-dropdown-delete' onClick={deleteH} />
            {data.user.blocked.includes(profileId) ?  
                <UnblockIcon className='contacts-dropdown-item contacts-dropdown-unblock' onClick={() => { props.data.socket.request('user', { type: 'unblock', id: profileId }); data.user.blocked = data.user.blocked.filter(v => v !== profileId); props.data.socket.setData(data) }} />
            :   <BlockIcon className='contacts-dropdown-item contacts-dropdown-block' onClick={() => { props.data.socket.request('user', { type: 'block', id: profileId }); data.user.blocked.push(profileId); props.data.socket.setData(data) }} />}
        </div>):'';
    }

    return (<>
        <Menu />
        <DropdownDots id='contacts-dropdown-dots' className={'contacts-dropdown-dots-' + (dropped ? 'down':'up')} onClick={() => setDropped(!dropped)} />
    </>);
}

function RoomsDropDown (props) {
    const [dropped, setDropped] = React.useState(false);
    const input = React.useRef();
    const roomId = props.menu.get.id;
    const data = props.data.get;
    let nameTimeout = 0;

    React.useEffect(() => {
        if (!input.current) return;
        input.current.addEventListener('change', async (event) => {
        const blob = Attachs.check([...event.target.files])[0];
        if (blob && blob.type.startsWith('image/')) {
            const newFile = (await Attachs.toString([blob]))[0];
            props.data.socket.request('room', { type: 'update', id: roomId, data: { type: 'avatar', data: newFile }});
            data.rooms[roomId].avatar_url = (await Attachs.toUrls([blob]))[0];
            props.data.socket.setData(data);
        }
        else props.alert.set({ show: true, type: 'error', text: 'Image is bigger than 5MB' });
    }, false)}, [dropped]);

    const nameReq = {
        setName: (name) => {
            if (nameTimeout) clearTimeout(nameTimeout);
            nameTimeout = setTimeout(() => {
                if (name.length < 3) return;
                props.data.socket.request('room', { type: 'update', id: roomId, data: { type: 'name', data: name }});
                data.rooms[roomId].name = name;
                props.data.socket.setData(data);
            }, 2000);
        },

        clearName: () => {
            if (nameTimeout) clearTimeout(nameTimeout);
        }
    }

    const exitFunc = () => {
        props.data.socket.request('room', { type: 'leave', id: roomId });
        delete data.rooms[roomId];
        props.data.socket.setData(data);
    }

    const changeName = (event) => {
        const name = event.target.value;
        nameReq.setName(name);
    }

    const clear = () => {
        props.data.socket.request('room', { type: 'update', id: roomId, data: { type: 'clear' }});
        data.rooms[roomId].history = [];
        props.data.socket.setData(data); 
    }

    const setAdmin = (id) => {
        if (data.rooms[roomId].admins.includes(data.user.id)) {
            if (data.rooms[roomId].admins.includes(id)) {
                props.data.socket.request('room', { type: 'update', id: roomId, data: { type: 'unset-admin', data: id }});
                data.rooms[roomId].admins = data.rooms[roomId].admins.filter(v => v !== id);
            } else {
                props.data.socket.request('room', { type: 'update', id: roomId, data: { type: 'set-admin', data: id }});
                data.rooms[roomId].admins.push(id);
            } 

            props.data.socket.setData(data);
        }
    }

    const kick = (id) => {
        props.data.socket.request('room', { type: 'leave', id: roomId, userId: id });
        data.rooms[roomId].admins = data.rooms[roomId].ids.filter(v => v !== id);
        if (id === data.user.id) delete data.rooms[roomId];
        props.data.socket.setData(data);
    }

    const loadMembers = () => {
        return data.rooms[roomId].ids.map(id => {
            const profile = id === data.user.id ? data.user : data.profiles[id] || props.data.socket.loadData({ type: 'profile', id });

            if (!profile) return;

            return (<div className='rooms-memeber' key={id}>
                <Avatar className={`rooms-memeber-avatar ${profile.online ? 'rooms-memeber-avatar-online':''}`} url={profile.avatar_url} onClick={() => props.menu.set({ type: 'profile', id })} />
                <p className='rooms-memeber-name'>{profile.name}</p>
                {data.rooms[roomId].admins.includes(id) ? <LikeActiveIcon className='rooms-memeber-admin-on' onClick={() => setAdmin(id)} style={data.rooms[roomId].admins.includes(data.user.id) ? { cursor: 'pointer' }:{}} />:<LikeUnactiveIcon className='rooms-memeber-admin-off' onClick={() => setAdmin(id)} style={data.rooms[roomId].admins.includes(data.user.id) ? { cursor: 'pointer' }:{}} />}
                {data.rooms[roomId].admins.includes(data.user.id) ? <CloseIcon className='rooms-memeber-kick' onClick={() => kick(id)} />:''}
            </div>);
        });
    }

    const copyInvite = () => {
        const text = `<room-inv/${roomId}|${data.rooms[roomId].name}/>`
        window.navigator.clipboard.writeText(text);
        props.alert({ show: true, type: 'success', text: 'Invite copied to the clipboard' });
    }

    const Menu = () => {
        return dropped ? (<>
            <input type='file' accept='image/*' ref={input} style={{ display: 'none', position: 'absolute' }} />
            <div className='rooms-dropdown-menu1' />
            <div className='rooms-dropdown-menu2'>
                <div id='roooms-dropdown-members'>
                    {loadMembers()}
                </div>
                <span id='rooms-dropdown-bar' />
                <Avatar className='rooms-dropdown-avatar' url={data.rooms[roomId].avatar_url} room={data.rooms[roomId].name} onClick={data.rooms[roomId].admins.includes(data.user.id) ? (() => input.current.click()):() => 0} />
                {!data.user.muted.includes(roomId) ? 
                    <NotifIcon className='rooms-dropdown-notify' onClick={() => { props.data.socket.request('user', { type: 'mute', id: roomId }); data.user.muted.push(roomId); props.data.socket.setData(data) }} />
                :   <NotifIcon2 className='rooms-dropdown-notify' style={{ paddingLeft: '0.1vh' }} onClick={() => { props.data.socket.request('user', { type: 'unmute', id: roomId }); data.user.muted = data.user.muted.filter(v => v !== roomId); props.data.socket.setData(data) }} />}
                <input className='rooms-dropdown-name' onChange={changeName} disabled={!data.rooms[roomId].admins.includes(data.user.id)} placeholder={data.rooms[roomId].name} maxLength='15' />
                <DeleteIcon className={`rooms-dropdown-delete ${data.rooms[roomId].admins.includes(data.user.id) ? 'rooms-dropdown-delete-admin':''}`} style={data.rooms[roomId].admins.includes(data.user.id) ? {}:{ cursor: 'not-allowed' }} onClick={data.rooms[roomId].admins.includes(data.user.id) ? clear:null} />
                <ExitIcon id='rooms-dropdown-exit' onClick={exitFunc} />
                <AddIcon id='rooms-dropdown-add' onClick={copyInvite} />
            </div>
        </>) : '';
    }

    return (<>
        <Menu />
        <DropdownDots id='rooms-dropdown-dots' className={'rooms-dropdown-dots-' + (dropped ? 'down':'up')} onClick={() => setDropped(!dropped)} />
    </>);
}

module.exports = {AlertM, PopupM, ProfileDropDown, ContactsDropDown, RoomsDropDown, Confirm};