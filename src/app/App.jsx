const React = require('react');
require('dotenv').config();
const {isMobile} = require('react-device-detect');

const MenuButtonsM = require('./mobile/MenuButtons.jsx');
const ContentM = require('./mobile/Content.jsx');
const SideBarM = require('./mobile/SideBar.jsx');
const {AlertM, PopupM} = require('./mobile/Popup.jsx');

const MenuButtons = require('./MenuButtons.jsx');
const Content = require('./Content.jsx');
const SideBar = require('./SideBar.jsx');
const {Alert, Popup} = require('./Popup.jsx');

const Socket = require('./Socket.js');
 
let socketConnected = false;

function App (props) {
    const [authorized, setAuthorized] = React.useState(false);
    const [menu, setMenu] = React.useState({ type: 'auth', id: '' });
    const [alert, setAlert] = React.useState({ show: false, text: '' });
    const [popup, setPopup] = React.useState({ show: false, type: '' });
    const [getSocket, setSocket] = React.useState(null);
    const [mainData, setMainData] = React.useState({});
    const [call, setCall] = React.useState(0);
    const [incomeCalls, setIncomeCalls] = React.useState([]);

    if (!authorized && getSocket) getSocket.destroy();
    if (!authorized && popup.show) setPopup({ show: false });
    if (getSocket && menu.type === 'auth') setMenu({ type: 'profile', id: '' });
    else if (!authorized && menu.type !== 'auth') setMenu({ type: 'auth', id: '' });

    if (authorized && !socketConnected) {
        socketConnected = true;
        new Socket({
            data: { get: mainData, set: setMainData },
            auth: { get: authorized, set: setAuthorized },
            socket: { get: getSocket, set: setSocket },
            menu: { get: menu, set: setMenu },
            popup: { get: popup, set: setPopup },
            alert: { get: alert, set: setAlert },
            call: { get: call, set: setCall },
            incomes: { get: incomeCalls, set: setIncomeCalls }
        });
    } else if (!authorized) socketConnected = false;

    const data = getSocket ? {get: mainData, socket: getSocket, set: setMainData } : false;

    // main frame
    return isMobile ?
    (
        <div id='main'>
            <link rel="stylesheet" href="index-mob.css" />
            <ContentM menu={{get: menu, set: setMenu}} alert={setAlert} setAuth={setAuthorized} data={data} popup={{get: popup, set: setPopup}} />
            {menu.type === 'auth' ? '' : <SideBarM menu={{get: menu, set: setMenu}} data={data} alert={setAlert} incomes={{ get: incomeCalls, set: setIncomeCalls }} /> }
            {menu.type === 'auth' ? '' : <MenuButtonsM data={data} menu={{get: menu, set: setMenu}} />}
            <PopupM popup={{get: popup, set: setPopup}} confirm={{}} alert={{get: alert, set: setAlert}} menu={{ get: menu, set: setMainData }} incomes={{ get: incomeCalls, set: setIncomeCalls }} data={data} />
            <AlertM alert={{get: alert, set: setAlert}} />
        </div>
    )
    :
    (
        <div id='main'>
            <link rel="stylesheet" href="index.css" />
            {menu.type === 'auth' ? '' : <SideBar menu={{get: menu, set: setMenu}} data={data} alert={setAlert} incomes={{ get: incomeCalls, set: setIncomeCalls }} /> }
            <Content menu={{get: menu, set: setMenu}} alert={setAlert} setAuth={setAuthorized} data={data} popup={{get: popup, set: setPopup}} />
            {menu.type === 'auth' ? '' : <MenuButtons data={data} menu={{get: menu, set: setMenu}} />}
            <Popup popup={{get: popup, set: setPopup}} confirm={{}} alert={{get: alert, set: setAlert}} menu={{ get: menu, set: setMainData }} incomes={{ get: incomeCalls, set: setIncomeCalls }} data={data} />
            <Alert alert={{get: alert, set: setAlert}} />
        </div>
    );
}

module.exports = App;