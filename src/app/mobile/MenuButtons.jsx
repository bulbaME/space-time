const React = require('react');
const { MenuButton } = require('./Buttons.jsx')

// import svg logos
import LogoProfile from '../graphics/logo-profile.jsx';
import LogoContacts from '../graphics/logo-contacts.jsx';
import LogoRooms from '../graphics/logo-rooms.jsx';
import LogoSettings from '../graphics/logo-settings.jsx';

function MenuButtonsM (props) {
    const [selected, setSelected] = React.useState(props.selected);
    const [lastChatSelected, setLastChatSelected] = React.useState({ rooms: '', chats: '' });
    if (selected !== `menu-button-${props.menu.get.type}`) setSelected(`menu-button-${props.menu.get.type}`);

    // parse button id and set current menu
    const changeFunc = (id) => {
        const type = id.slice(id.lastIndexOf('-') + 1);
        setSelected(id);

        if (props.menu.get.type == 'contacts') {
            lastChatSelected.chats = props.menu.get.id;
            setLastChatSelected(lastChatSelected);
        }

        if (props.menu.get.type == 'rooms') {
            lastChatSelected.rooms = props.menu.get.id;
            setLastChatSelected(lastChatSelected); 
        }

        let last;
        switch(type) {        
            case 'contacts':
                if (lastChatSelected.chats) last = lastChatSelected.chats;
                if (!last && Object.values(props.data.get.chats).length) last = Object.values(props.data.get.chats).sort((a, b) => {
                    if (!a.history.length) return 1;
                    if (!b.history.length) return -1;

                    let t1 = a.history[a.history.length-1].timestamp, t2 = b.history[b.history.length-1].timestamp;
                    return t1 > t2 ? -1 : 1;
                }, )[0].ids.filter(v => v !== props.data.get.user.id)[0];
                
                props.menu.set({ type: 'contacts', id: last || '' });
            break;
            case 'rooms':
                if (lastChatSelected.rooms) last = lastChatSelected.rooms;
                if (!last && Object.values(props.data.get.rooms).length) last = Object.values(props.data.get.rooms).sort((a, b) => {
                    if (!a.history.length) return 1;
                    if (!b.history.length) return -1;

                    let t1 = a.history[a.history.length-1].timestamp, t2 = b.history[b.history.length-1].timestamp;
                    return t1 > t2 ? -1 : 1;
                }, )[0].id;
                
                props.menu.set({ type: 'rooms', id: last || '' });
            break;
            default:
                props.menu.set({ type });
        }


    }

    const menu = props.menu.get;
    if (menu.type === 'auth') return <div id='buttons-bar' />;
    else return (
        <div id='buttons-bar'>
            <MenuButton id='menu-button-profile' selected={selected} change={changeFunc} logo={LogoProfile} />
            <MenuButton id='menu-button-contacts' selected={selected} change={changeFunc} logo={LogoContacts} />
            <MenuButton id='menu-button-rooms' selected={selected} change={changeFunc} logo={LogoRooms} />
            <MenuButton id='menu-button-settings' selected={selected} change={changeFunc} logo={LogoSettings} /> 
        </div>
    );
}

module.exports = MenuButtonsM;