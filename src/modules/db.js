'use strict'; 


const fs = require('fs');
const { promisify } = require('util');
const { MongoClient } = require('mongodb');
const redis = require('redis');
const firebase = require('firebase-admin');

const { generateId } = require('./utils.js');
const { join } = require('path');

const MAX_FILE_SIZE = 2_500_000; // == 5 000 000 bytes (a character is 16 bit)
const FILE_URI_LIFETIME = 86_400_000; // == 24 hours 

class DB {
	async init() {
		const db_access = JSON.parse(fs.readFileSync('db-secret.json'));

		// firestore
		const firebaseStorage = firebase.initializeApp({
			credential: firebase.credential.cert('firebase-secret.json')
		}).storage();

		const firestore = {
			bucket: firebaseStorage.bucket(db_access.firestore.bucketName),

			async get(path) {
				return (await firestore.bucket.file(path).get())[0];
			},

			async getAll(path) {
				return (await firestore.bucket.getFiles({ prefix: path }))[0];
			},

			delete(path) {
				firestore.bucket.file(path).delete();
			}, 

			deleteAll(path) {
				firestore.bucket.deleteFiles({ prefix: path });
			},

			async save(path, data, returnlink=false, lifetime = FILE_URI_LIFETIME) {
				if (returnlink) {
					const file = firestore.bucket.file(path);
					if (await file.save(data) | true)
						return (await firestore.getFileLink(path));
				} else firestore.bucket.file(path).save(data);
			}, 

			async getFileLink(path, lifetime = FILE_URI_LIFETIME) {
				const expires = Date.now() + lifetime;
				const redisPath = `file/${path}`;
				if (await redisCheck(redisPath)) return await redisGet(redisPath);

				const uri = (await (firestore.bucket.file(path).getSignedUrl({ action: 'read', expires })))[0];
				redisClient.set(redisPath, uri, 'PX', lifetime);
				return uri;
			}
		}

		this.getFileLink = firestore.getFileLink;

		this.getFiles = firestore.getAll;

		// redis
		const redisClient = redis.createClient(process.env.REDIS_PORT);
		const redisGet = promisify(redisClient.get).bind(redisClient);
		const redisCheck = promisify(redisClient.exists).bind(redisClient);
		const redisRange = promisify(redisClient.lrange).bind(redisClient);

		// mongodb
		const mongoClient = new MongoClient(db_access.mongodb.url);
		await mongoClient.connect();
		const mongodb = mongoClient.db(db_access.mongodb.name);

		const user_ = this.user = {
			users: mongodb.collection('users'),

			// add socket id to db
			connect(userId, clientId) {
				redisClient.rpush(userId, clientId);
			},

			// remove socket id from db
			disconnect(userId, clientId) {
				redisClient.lrem(userId, 1, clientId);
			},

			// return socket binded to single id
			async getSockets(userId) {
				return (await user_.checkOnline(userId)) ? await redisRange(userId, 0, 50):[];
			},

			// check if user is online
			async checkOnline(userId) {
				return (await redisCheck(userId));
			},

			// get user id from auth key
			async processAuthKey(key) {
				const found = (await user_.users.findOne({ auth_key: key }));
				if (found) return found.id;
			},

			// get user by id
			async get(userId) {
				const found = await user_.users.findOne({ id: userId }); 

				if(found) {
					found.online = await redisCheck(userId);
					if (found.avatar_url) found.avatar_url = await firestore.getFileLink(found.avatar_url);
					for (let p = 0; p < found.posts.length; p++) {
						if (!found.posts[p].files.length) continue;
						const newList = [];
						for (let i of found.posts[p].files) newList.push([await firestore.getFileLink(i[0]), i[1]]);
						found.posts[p].files = newList;
					}
				}
				return found;
			},

			// get user by profile id
			async getByProfile(id) {
				const found = await user_.users.findOne({ profile_id: id }); 

				if(found) {
					found.online = await redisCheck(id);
					if (found.avatar_url) found.avatar_url = await firestore.getFileLink(found.avatar_url);
					for (let p = 0; p < found.posts.length; p++) {
						if (!found.posts[p].files.length) continue;
						const newList = [];
						for (let i of found.posts[p].files) newList.push([await firestore.getFileLink(i[0]), i[1]]);
						found.posts[p].files = newList;
					}
				}
				return found;
			},

			// create new user in database
			new(data) {
				const authKey = `${data.id}-${generateId(6)}`;
				const userBody = {
					id: data.id,
					auth_key: authKey,
					name: data.name,
					profile_id: data.id.slice(0,16),
					avatar_url: '',
					language: data.lang,
					status: 'hello everyone 👋',
					posts: [],
					liked_posts: [],
					contacts: [],
					blocked: [],
					muted: [],
					privacy: {
						write: 'all',
						call: 'contacts',
						see: 'all'
					}
				}

				user_.users.insertOne(userBody);

				return authKey;
			},

			user: {
				// add user to contacts
				async add (userId1, userId2) {
					user_.users.updateOne({ id: userId1 }, { $addToSet: { contacts: userId2 }});
					// if needed create chat with another user
					if (!(await chats_.get(userId1, userId2))) return chats_.new(userId1, userId2);
				},

				// remove user from contacts
				remove (userId1, userId2) {
					return user_.users.updateOne({ id: userId1 }, { $pull: { contacts: userId2 }});
				},

				block (userId1, userId2) {
					return user_.users.updateOne({ id: userId1 }, { $addToSet: { blocked: userId2 }});
				},

				unblock (userId1, userId2) {
					return user_.users.updateOne({ id: userId1 }, { $pull: { blocked: userId2 }});
				},

				mute (userId1, userId2) {
					return user_.users.updateOne({ id: userId1 }, { $addToSet: { muted: userId2 }});
				},

				unmute (userId1, userId2) {
					return user_.users.updateOne({ id: userId1 }, { $pull: { muted: userId2 }});
				}
			},

			post: {
				// like post
				async like(userId, postId) {
					if (!(await user_.users.findOne({ id: userId, liked_posts: postId }))) {
						const authorId = postId.slice(0, postId.indexOf('-'));
						user_.users.updateOne({ id: userId }, { $addToSet: { liked_posts: postId } });
						return user_.users.updateOne({ id: authorId, 'posts.id': postId }, { $inc: { 'posts.$.likes': 1 }});
					}
				},

				// unlike post
				async unLike(userId, postId) {
					if (await user_.users.findOne({ id: userId, liked_posts: postId })) {
						const authorId = postId.slice(0, postId.indexOf('-'));
						user_.users.updateOne({ id: userId }, { $pull: { liked_posts: postId } });
						return user_.users.updateOne({ id: authorId, 'posts.id': postId }, { $inc: { 'posts.$.likes': -1 }});
					}
				},

				// create new post
				async new(userId, content) {
					// check for file size
					if (content.files.length && content.files.reduce((p, c) => p + c) > content.files.length * MAX_FILE_SIZE) return;

					const postId = `${userId}-${generateId(5)}`;
					const files = [];
					const urls = [];

					let c = 0;
					for (let f of content.files) {
						c++;
						const type = f.type && f.type.startsWith('image') ? f.type.slice(6) : 'txt';
						const path = `${userId}/posts/${postId}/${c}.${type}`;
						files.push([path, f.type]);
						urls.push([await firestore.save(path, f.data, true), f.type]);
					}

					const postBody = {
						id: postId,
						title: content.title,
						text: content.text,
						files,
						timestamp: Date.now(),
						likes: 0
					};

					user_.users.updateOne({ id: userId }, { $addToSet: { posts: postBody }});
					return {...postBody, files: urls};
				}, 

				// delete a post
				async delete(userId, postId) {
					firestore.deleteAll(`${userId}/posts/${postId}`);
					return user_.users.updateOne({ id: userId }, { $pull: { posts: { id: postId }}});
				}
			},

			// modify user data
			update: {
				async profileId(userId, profileId) {
					if (await user_.getByProfile(profileId)) return false;
					else {
						user_.users.updateOne({ id: userId }, { $set: { profile_id: profileId } })
						return true;
					}
				},

				// change user name
				name(userId, name) {
					return user_.users.updateOne({ id: userId }, { $set: { name: name }});
				},

				// change user avatar
				avatar(userId, data) {
					if(!data.data || !data.type) return;

					const imgType = data.type.slice(6);
					const path = `avatars/${userId}.${imgType}`;
					user_.users.updateOne({ id: userId }, { $set: { avatar_url: path }});
					return firestore.save(path, data.data);
				},

				// change user status
				status(userId, status){
					return user_.users.updateOne({ id: userId }, { $set: { status: status }});
				},

				// change user privacy settings
				privacy(userId, type, state) {
					switch(type) {
						case 'call':
							return user_.users.updateOne({ id: userId }, { $set: { 'privacy.call': state }});
							break;
						case 'write':
							return user_.users.updateOne({ id: userId }, { $set: { 'privacy.write': state }});
							break;
						case 'see':
							return user_.users.updateOne({ id: userId }, { $set: { 'privacy.see': state }});
					}
				}
			},

			// check if user1 is in contact list of user2
			checkContacts(userId1, userId2) {
				return user_.users.findOne({ id: userId1, 'contacts.$': userId2 });
			}
		}

		const chats_ = this.chats = {
			chats: mongodb.collection('chats'),

			// get chat
			async get(userId1, userId2) {
				return await chats_.chatFiles(await chats_.chats.findOne({ ids: { $all: [userId1, userId2] }}));
			},

			async getAll(userId) {
				const chats = await chats_.chats.find({ ids: userId }).toArray();
				for (let c = 0; c < chats.length; c++) chats[c] = await chats_.chatFiles(chats[c]);
				return chats;
			},

			new(userId1, userId2) {
				chats_.chats.insertOne({ ids: [userId1, userId2], history: [], unread: { id: '', count: 0 }});
			},

			async clear(userId1, userId2) {
				const chat = await chats_.chats.findOne({ ids: { $all: [userId1, userId2]}});

				for (let m of chat.history) firestore.deleteAll(m.id);

				chats_.chats.updateOne({ ids: { $all: [userId1, userId2]}}, { $set: { history: [], unread: { id: '', count: 0 }}});
			},

			async remove(userId1, userId2, msgid) {
				const chat = await chats_.chats.findOne({ ids: { $all: [userId1, userId2]}});

				for (let m of chat.history) firestore.deleteAll(m.id);

				chats_.chats.updateOne({ ids: { $all: [userId1, userId2]}}, { $set: { history: [], unread: { id: '', count: 0 }}});
			},

			async read(userId1, userId2) {
				return await chats_.chats.updateOne({ ids: { $all: [userId1, userId2] }, 'unread.id': userId1 }, { $set: { unread: { id: '', count: 0 }}});
			},

			async chatFiles(chat) {
				if (!chat) return;
				for (let p = 0; p < chat.history.length; p++) {
					if (chat.history[p].audio.uri) chat.history[p].audio.uri = await firestore.getFileLink(chat.history[p].audio.uri);
					if (!chat.history[p].files.length) continue;
					const newList = [];
					for (let i of chat.history[p].files) newList.push([await firestore.getFileLink(i[0]), i[1]]);
					chat.history[p].files = newList;
				}

				return chat;
			},

			message: {
				async new(userId1, userId2, content) {
					const files = [];
					const urls = [];
					const timestamp = Date.now();
					const id = `${timestamp}-${generateId(4)}`;

					let audioData = {}, audioUrl = '';
					if (content.audio.data) {
						audioData = {uri: `${id}/audio.mp3`, time: content.audio.time};
						audioUrl = await firestore.save(audioData.uri, content.audio.data, true);
					}

					let c = 0;
					for (let f of content.files) {
						c++;
						const type = f.type && f.type.startsWith('image') ? f.type.slice(6) : 'txt';
						const path = `${id}/${c}.${type}`;
						files.push([path, f.type]);
						urls.push([await firestore.save(path, f.data, true), f.type]);
					}

					const message = {
						timestamp,
						id,
						files: files,
						text: content.text,
						reply: content.reply ? content.reply : 0,
						sender: userId1,
						audio: audioData,
						geo: content.geo
					};

					chats_.chats.updateOne({ ids: { $all: [userId1, userId2] }}, { $addToSet: { history: message }, $inc: { 'unread.count': 1 }, $set: { 'unread.id': userId2 }});
					return {...message, files: urls, audio: {time: message.audio.time, uri: audioUrl}};
				},

				async delete(userId1, userId2, id) {
					const data = await chats_.chats.updateOne({ ids: { $all: [userId1, userId2] } }, { $pull: { history: { id, sender: userId1 }}});
					return !!data.modifiedCount;
				},

				read(userId1, userId2, timestamp) {
					chats_.chats.updateMany({ ids: { $all: [userId1, userId2] }, 'history.$.timestamp': timestamp }, { $set: { history: { read: 1 }}});
				}
			}
		}

		const rooms_ = this.rooms = {
			rooms: mongodb.collection('rooms'),

			async check(userId, roomId) {
				const room = await rooms_.rooms.findOne({ id: roomId, ids: userId });
				if (!room) return false;
				if (room.avatar_url) room.avatar_url = await firestore.getFileLink(room.avatar_url);
				return await chats_.chatFiles(room);
			},

			async get(roomId) {
				const room = await rooms_.rooms.findOne({ id: roomId });
				if (!room) return false;
				if (room.avatar_url) room.avatar_url = await firestore.getFileLink(room.avatar_url);
				return await chats_.chatFiles(room);
			},

			async getAll(userId) {
				const rooms = await rooms_.rooms.find({ ids: userId }).toArray();
				for (let c = 0; c < rooms.length; c++) {
					if (rooms[c].avatar_url) rooms[c].avatar_url = await firestore.getFileLink(rooms[c].avatar_url);
					rooms[c] = await chats_.chatFiles(rooms[c]);
				}
				return rooms;
			},

			async new(data) {
				const id = 'r' + generateId(6);
				if (await rooms_.rooms.insertOne({ id, history: [], name: data.name, avatar_url: '', admins: [], ids: []})) return id;
			},

			async clear(roomId) {
				const room = await rooms_.rooms.findOne({ id: roomId });
				for (let m of room.history) firestore.deleteAll(m.id);
				rooms_.rooms.updateOne({ id: roomId }, { $set: { history: [] }});
			},

			async join(userId, roomId) {
				return await rooms_.rooms.updateOne({ id: roomId }, { $addToSet: { ids: userId }});
			},

			async leave(userId, roomId) {
				rooms_.rooms.updateOne({ id: roomId }, { $pull: { ids: userId }});
			},

			async delete(roomId) {
				rooms_.rooms.deleteOne({ id: roomId });
			},

			call: {
				async start(roomId) {
					if (redisCheck(`call/${roomId}`)) redisClient.INCR(`call/${roomId}`);
					else redisClient.set(`call/${roomId}`, 1);
				},

				async end(roomId) {
					redisClient.DECR(`call/${roomId}`);
					if (await redisGet(`call/${roomId}`) === 0) redisClient.del(`call/${roomId}`);
				},

				async check(roomId) {
					if (await redisCheck(`call/${roomId}`)) await redisGet(`call/${roomId}`);
					else 0;
				}
			},

			message: {
				async new(userId, roomId, content) {
					const files = [];
					const urls = [];
					const timestamp = Date.now();
					const id = `${timestamp}-${generateId(4)}`;

					let audioData = {}, audioUrl = '';
					if (content.audio.data) {
						audioData = {uri: `${id}/audio.mp3`, time: content.audio.time};
						audioUrl = await firestore.save(audioData.uri, content.audio.data, true);
					}

					let c = 0;
					for (let f of content.files) {
						c++;
						const type = f.type && f.type.startsWith('image') ? f.type.slice(6) : 'txt';
						const path = `${id}/${c}.${type}`;
						files.push([path, f.type]);
						urls.push([await firestore.save(path, f.data, true), f.type]);
					}

					const message = {
						timestamp,
						id,
						files: files,
						text: content.text,
						reply: content.reply ? content.reply : 0,
						sender: userId,
						audio: audioData,
						geo: content.geo
					};

					rooms_.rooms.updateOne({ id: roomId }, { $addToSet: { history: message } });
					return {...message, files: urls, audio: {time: message.audio.time, uri: audioUrl}};
				},

				delete(userId, roomId, id) {
					rooms_.rooms.updateOne({ id: roomId }, { $pull: { history: { id, sender: userId }}});
				}
			},

			update: {
				name(roomId, name) {
					rooms_.rooms.updateOne({ id: roomId }, { $set: { name } })
				},

				avatar(roomId, data) {
					if(!data.data || !data.type) return;

					const imgType = data.type.slice(6);
					const path = `avatars/${roomId}.${imgType}`;
					firestore.save(path, data.data);
					rooms_.rooms.updateOne({ id: roomId }, { $set: { avatar_url: path }});
				},

				addAdmin(roomId, userId) {
					rooms_.rooms.updateOne({ id: roomId, ids: userId }, { $addToSet: { admins: userId } });
				},

				delAdmin(roomId, userId) {
					rooms_.rooms.updateOne({ id: roomId, ids: userId }, { $pull: { admins: userId } });
				}
			}
		}

		const call_ = this.call = {
			set(userId1, userId2) {
				redisClient.set(`call-${userId1}`, userId2);
			},

			del(userId) {
				redisClient.del(`call-${userId}`);
			},

			async verify(userId1, userId2) {
				if (await redisCheck(`call-${userId1}`)) return (await redisGet(`call-${userId1}`) === userId2);
				else return false;
			},
			
			async check(userId1) {
				return await redisCheck(`call-${userId1}`);
			}
		}

		return this;
	}
}

module.exports = DB;