const React = require('react');
const Attachs = require('../Files.js');

// import svg
import SettingsButtonCircle from '../graphics/settings-button-circle.jsx';
import AttachIcon from '../graphics/icon-attach.jsx';
import CloseIcon from '../graphics/icon-close.jsx';


function MenuButton (props) {
    const classes = ['menu-button', 'menu-button-unactive'];
    const id = props.id;
    const selected = props.selected;
    const active = selected === id;
    const changeButton = props.change;
    const Logo = props.logo
    const logoClasses = ['menu-button-logo', 'menu-button-logo-unactive'];

    if (active) {
        classes[1] = 'menu-button-active';
        logoClasses[1] = 'menu-button-logo-active';
    }

    return (
        <div 
            id={id} className={classes.join(' ')} 
            onClick={ () => changeButton(id) } // change selected button if clicked on 
        ><Logo className={logoClasses.join(' ')} /></div>
    );
}

function SettingsButton (props) {
    const [state, setState] = React.useState(props.default === 'contacts');
    const classes = ['settings-button', 'settings-button-off'];
    const circleClasses = ['settings-button-circle']
    if (state) circleClasses[1] = 'settings-button-circle-right', classes[1] = 'settings-button-on';

    const { on: onFunc, off: offFunc } = props.func;
    const toggle = () => {
        if(state) offFunc();
        else onFunc();
        setState(!state);
    }


    return (
        <div className={classes.join(' ')} onClick={toggle}>
            <p className='settings-text-small' style={{marginLeft: '-11vw'}}>anyone</p>
            <p className='settings-text-small' style={{marginLeft: '10vw'}}>contacts only</p>
            <SettingsButtonCircle className={circleClasses.join(' ')} />
        </div>
    ); 
}

function AttachmentsButton (props) {
    const input = React.useRef();
    const files = props.files;

    React.useEffect(() => input.current.addEventListener('change', (event) => {
        const newFiles = Attachs.check([...event.target.files]);
        if (newFiles) files.set(files.get.concat(newFiles));
        else props.alert.set({ show: true, type: 'error', text: 'One of your files is bigger than 5MB' });
    }, false), []);

    return (<div id={props.id}>
        <input multiple type='file' ref={input} style={{display: 'none', position: 'absolute'}}/>
        <AttachIcon id='attach' onClick={() => input.current.click()} />
        {files.get.length ? <div id='count'>{files.get.length}</div>:''}
        {files.get.length ? <CloseIcon id='clear' onClick={() => files.set([])} />:''}
    </div>);
}

module.exports = {
    MenuButton,
    SettingsButton,
    AttachmentsButton
}