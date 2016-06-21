// var isInitiator = false; //标识房间的创建者 创建者发起视频连接呼叫
var localStream;
var pc;
var remoteStream;

var pcConfig = {
  'iceServers': [{
    'url': 'stun:stun.schlund.de'
  }]
};

/////////////////////////////////////////////

var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');

var socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or join room', room);
}

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

// 获取本地音视频流
navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
.then(setLocalStream)
.catch(function(e) {
  alert('无法获取本地音视频流: ' + e.name);
});

////////////////////////////////////////////////////
function setLocalStream(stream) {
  console.log("设置本地视频流");
  localVideo.src = window.URL.createObjectURL(stream);
  localStream = stream;

  createPeerConnection();
}


////////////////////////////////////////////////////

// 服务器传来log信息  就打印出来
// socket.on('log', function(array) {
//   console.log.apply(console, array);
// });

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message.type === 'offer') {
    // 远程发来的offer（另一端的sessionDescription）
      // 设置远程description
      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
  } else if (message.type === 'answer') {
      pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' ) {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      });
      pc.addIceCandidate(candidate);
  }
});


/////////////////////////////////////////////////////////

function doCall() {

  console.log('创建 offer....');

  pc.createOffer(setSessionDesctiptionAndSend, handleCreateOfferError);

}

function setSessionDesctiptionAndSend(sessionDescription) {

  console.log('创建 offer OK...  设置为本地SessionDescription并发送');

  // 设置本地描述符 会触发ice过程
  pc.setLocalDescription(sessionDescription);

return;
  sendMessage(sessionDescription);
}
function handleCreateOfferError(event) {
  console.log('创建offer失败: ', event);
}

/////////////////////////////////////////////////////////

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setSessionDesctiptionAndSend2,
    onCreateSessionDescriptionError
  );
}



function setSessionDesctiptionAndSend2(sessionDescription) {

  console.log('create answer OK.');

  pc.setLocalDescription(sessionDescription);
  console.log('setLocalSessionDescription And sending sessionDescription');
  sendMessage(sessionDescription);
}



function onCreateSessionDescriptionError(error) {
  trace('创建 session description 失败： ' + error.toString());
}


/////////////////////////////////////////////////////////

function sendMessage(message) {
  // console.log('Client sending message: ', message);
  socket.emit('message', message);
}
/////////////////////////////////////////////////////////
      function createPeerConnection() {
          try {
              pc = new RTCPeerConnection(pcConfig);
              pc.onicecandidate = handleIceCandidate;
              pc.onaddstream = handleRemoteStreamAdded;
              pc.onremovestream = handleRemoteStreamRemoved;

              pc.addStream(localStream);

              console.log('创建 RTCPeerConnnection');
          } catch (e) {
              console.log('Failed to create PeerConnection, exception: ' + e.message);
              alert('Cannot create RTCPeerConnection object.');
              return;
          }
      }
              function handleIceCandidate(event) {
                // console.log('icecandidate event: ', event);
                if (event.candidate) {
                  sendMessage({
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                  });
                } else {
                  console.log('End of candidates.');
                }
              }

              function handleRemoteStreamAdded(event) {
                console.log('Remote stream added.');
                remoteVideo.src = window.URL.createObjectURL(event.stream);
                remoteStream = event.stream;
              }
              function handleRemoteStreamRemoved(event) {
                console.log('Remote stream removed. Event: ', event);
              }