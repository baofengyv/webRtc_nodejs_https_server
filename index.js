'use strict';

const   os = require('os');
const   fs = require('fs');
const   nodeStatic = require('node-static');
const   socketIO = require('socket.io');
const   https = require('https');
const   options = {
		  cert: fs.readFileSync('nginx.crt'),
		  key:  fs.readFileSync('nginx.key')
		};

// https 文件服务器
const fileServer = new(nodeStatic.Server)();
const app = https.createServer(options,(req, res) => {
  fileServer.serve(req, res);
}).listen(8081);

const io = socketIO.listen(app);
console.log("server starting...");

var socketlist = [];
io.sockets.on('connection', function(socket) {
    socketlist.push(socket);
    socket.emit('socket_is_connected','You are connected!');
    socket.on('close', function () {
      console.log('socket closed');
      socketlist.splice(socketlist.indexOf(socket), 1);
    });
});

//sockets 建立时
io.sockets.on('connection', function(socket) {

	console.log('[connection]');

	socketlist.push(socket);

	socket.on('destroyAll', function () {

      socketlist.forEach(function(socket) {
		  socket.destroy();
		});
    });
	// 收到消息后向所有连接的客户端广播 收到的消息
	socket.on('message', function(message) {
		console.log('[message]');

		log('Client said: ', message);
		// for a real app, would be room-only (not broadcast)
		socket.broadcast.emit('message', message);
		// io.sockets.in(socket.roomName).emit('message', message);
		// console.log("message on ",socket.roomName);
	});

	socket.on('create or join', function(room) {


// socket.roomName = room;



		console.log('[create or join]');
		log('Received request to create or join room ' + room);

		var numClients = io.sockets.sockets.length;
		log('Room ' + room + ' now has ' + numClients + ' client(s)');

		if (numClients === 1) {
			socket.join(room);
			log('Client ID ' + socket.id + ' created room ' + room);
			socket.emit('created', room, socket.id);
		} else if (numClients === 2) {
			log('Client ID ' + socket.id + ' joined room ' + room);

			// 给房间里所有的人发通知
			io.sockets.in(room).emit('join', room);
			// 当前socket加入房间room
			socket.join(room);
			socket.emit('joined', room, socket.id);
		}
	});

	//  这个还没看到
	socket.on('ipaddr', function() {
		console.log('[ipaddr]');
		var ifaces = os.networkInterfaces();
		for (var dev in ifaces) {
			ifaces[dev].forEach(function(details) {
				if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
					socket.emit('ipaddr', details.address);
				}
			});
		}
	});

	socket.on('bye', function(){
		console.log('received bye');
	});

	// convenience function to log server messages on the clien
	// 在客户端打出服务器信息
	function log() {
		console.log('[log..]');

		var array = ['::::server:'];
		array.push.apply(array, arguments);
		socket.emit('log', array);
	}
});

console.log("server started.");
