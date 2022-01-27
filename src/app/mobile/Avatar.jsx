const React = require('react');

import DefaultAvatar from '../graphics/avatar-default.jsx';


function Avatar(props) {
    return (<div onClick={props.onClick}>{props.url ? <img className={props.className} src={props.url} /> : props.room ? <div className={props.className + ' room-default-avatar'} >{props.room[0]}</div>:<DefaultAvatar className={props.className} />}</div>);
}

module.exports = Avatar; 