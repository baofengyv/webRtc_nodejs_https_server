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

var fileServer = new(nodeStatic.Server)();
var app = https.createServer(options,(req, res) => {
  fileServer.serve(req, res);
}).listen(7777);

var io = socketIO.listen(app);
console.log("server starting...");

//
io.sockets.on('connection', function(socket) {

	console.log('[connection]');

	// convenience function to log server messages on the client
	function log() {
		console.log('[log..]');

		var array = ['[:server:]'];
		array.push.apply(array, arguments);
		socket.emit('log', array);
	}

	socket.on('message', function(message) {
		console.log('[message]');

		log('Client said: ', message);
		// for a real app, would be room-only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('create or join', function(room) {

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
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room, socket.id);
			io.sockets.in(room).emit('ready');
		} else { // max two clients
			socket.emit('full', room);
		}
	});

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
});

console.log("server started.");
