var localVideo, remoteVideo, localStream, channel, pc, socket, 
    channelReady = false,
    started = false;

initialize = function() {
  console.log("Initializing; room=" + roomKey + ".");

  localVideo = document.getElementById("localVideo");
  remoteVideo = document.getElementById("remoteVideo");
  status = document.getElementById("status");

  resetStatus();
  openChannel();
  getUserMedia();
};

openChannel = function() {
  console.log("Opening channel.");
  var channel = new goog.appengine.Channel(token);
  var handler = {
    'onopen': onChannelOpened,
    'onmessage': onChannelMessage,
    'onerror': onChannelError,
    'onclose': onChannelClosed
  };
  socket = channel.open(handler);
};

resetStatus = function() {
  if (!initiator) {
    setStatus("Waiting for someone to join: <a href='" + roomLink + "'>" + roomLink + "</a>");
  } else {
    setStatus("Initializing...");
  }
};

getUserMedia = function() {
  try {
    navigator.webkitGetUserMedia({audio:true, video:true}, onUserMediaSuccess,
                                 onUserMediaError);
    console.log("Requested access to local media with new syntax.");
  } catch (e) {
    try {
      navigator.webkitGetUserMedia("video,audio", onUserMediaSuccess,
                                   onUserMediaError);
      console.log("Requested access to local media with old syntax.");
    } catch (e) {
      alert("webkitGetUserMedia() failed. Is the MediaStream flag enabled in about:flags?");
      console.log("webkitGetUserMedia failed with exception: " + e.message);
    }
  }
};

createPeerConnection = function() {
  try {
    pc = new webkitDeprecatedPeerConnection(pc_config,
                                            onSignalingMessage);
    console.log("Created webkitDeprecatedPeerConnnection with config '" + pc_config + "'.");
  } catch (e) {
    console.log("Failed to create webkitDeprecatedPeerConnection, exception: " + e.message);
    try {
      pc = new webkitPeerConnection(pc_config,
                                    onSignalingMessage);
      console.log("Created webkitPeerConnnection with config '" + pc_config + "'.");
    } catch (e) {
      console.log("Failed to create webkitPeerConnection, exception: " + e.message);
      alert("Cannot create PeerConnection object; Is the 'PeerConnection' flag enabled in about:flags?");
      return;
    }
  }
  pc.onconnecting = onSessionConnecting;
  pc.onopen = onSessionOpened;
  pc.onaddstream = onRemoteStreamAdded;
  pc.onremovestream = onRemoteStreamRemoved;
};

maybeStart = function() {
  if (!started && localStream && channelReady) {
    setStatus("Connecting...");
    console.log("Creating PeerConnection.");
    createPeerConnection();
    console.log("Adding local stream.");
    pc.addStream(localStream);
    started = true;
  }
};

setStatus = function(state) {
  footer.innerHTML = state;
};

sendMessage = function(path, message) {
  console.log('C->S: ' + message);
  path += '?r=' + roomKey + '&u=' + user;
  var xhr = new XMLHttpRequest();
  xhr.open('POST', path, true);
  xhr.send(message);
};

onChannelOpened = function() {
  console.log('Channel opened.');
  channelReady = true;
  if (initiator) maybeStart();
};

onChannelMessage = function(message) {
  console.log('S->C: ' + message.data);
  if (message.data != 'BYE') {
    if (message.data.indexOf('"ERROR"', 0) == -1) {
      if (!initiator && !started) maybeStart();
      pc.processSignalingMessage(message.data);
    }
  } else {
    console.log('Session terminated.');
    remoteVideo.src = null;
    remoteVideo.style.opacity = 0;
    initiator = 0;
    started = false;
    resetStatus();
  }
};

onChannelError = function() {
  console.log('Channel error.');
};

onChannelClosed = function() {
  console.log('Channel closed.');
};

onUserMediaSuccess = function(stream) {
  console.log("User has granted access to local media.");

  var url = webkitURL.createObjectURL(stream);

  localVideo.style.opacity = 1;
  localVideo.src = url;
  localStream = stream;

  if (initiator) maybeStart();
};

onUserMediaError = function(error) {
  console.log("Failed to get access to local media. Error code was " + error.code);
  alert("Failed to get access to local media. Error code was " + error.code + ".");
};

onSignalingMessage = function(message) {
  sendMessage('/message', message);
};

onSessionConnecting = function(message) {
  console.log("Session connecting.");
};

onSessionOpened = function(message) {
  console.log("Session opened.");
};

onRemoteStreamAdded = function(event) {
  console.log("Remote stream added.");
  var url = webkitURL.createObjectURL(event.stream);
  remoteVideo.style.opacity = 1;
  remoteVideo.src = url;
  setStatus("<input type='button' id='hangup' value='Hang up' onclick='onHangup()' />");
};

onRemoteStreamRemoved = function(event) {
  console.log("Remote stream removed.");
};

closeConnection = function() {
  console.log("Hanging up.");

  if (!!pc) {
    pc.close();
  }

  if (!!socket) {
    socket.close();
  }

  pc = null;
  socket = null;
};

onHangup = function() {
  localVideo.style.opacity = 0;
  remoteVideo.style.opacity = 0;

  closeConnection();

  setStatus("You have left the call. <a href='" + roomLink + "'>Click here</a> to rejoin.");
};

setTimeout(initialize, 1);