'use strict';


const generateId = (limit) => {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < limit; i++) id += chars[Math.floor(Math.random() * chars.length)];
	return id;
}

module.exports = { generateId }