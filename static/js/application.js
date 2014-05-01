// #1: WS/WS. Wait for WS to open, then WS.send and WS.onmessage
// #2: XHR/WS. XHR immediately, then WS.onmessage
// #3: XHR/poll. Continuously poll for msgs

var start = performance.now();
var inbox;
var checkpoint;
var messages = 16; //{{ messages }};
var received = 0;
var watchdog;
var a = 0;
function trace(char, msg) {
  console.log(char + "(" + ((performance.now() - start) / 1000).toFixed(3) + "):" + msg);
}
function write(msg) {
  var p = document.createElement("p");
  p.innerHTML = msg + ": " + (performance.now() - checkpoint).toFixed(0) + " ms"
  document.body.appendChild(p);
}

function onOpen(x) {
  trace("X", "Channel opened");
  write("WebSockets open");
  sendMessages();
}

function sendMessages() {
  checkpoint = performance.now();
  for (var i = 0; i < messages; ++i) {
    sendMessage('/send', i.toString());
  }
  write(messages.toString() + " XHRs");
  watchdog = setTimeout(terminate, 10000);
  checkpoint = performance.now();
}

sendMessage = function(path, opt_param) {
  trace("S", opt_param);
  if (a) {
    var xhr = new XMLHttpRequest();
    if (opt_param) {
      path += '?m=';
      path += opt_param;
    }
    xhr.open('POST', path, true);
    xhr.send();
  } else {
    inbox.send(opt_param.toString());
  }
}

function onMessage(m) {
  trace("R", m.data);
  if (++received == messages) {
    write(messages.toString() + " channel messages received");
    clearTimeout(watchdog);
  }
}

openChannel = function() {
  trace("X", "Creating socket");
  inbox = new ReconnectingWebSocket("ws://"+ location.host + "/ws");
  inbox.onmessage = onMessage;
  inbox.onopen = onOpen;
}

terminate = function() {
  trace("X", "Shutting down");
  write(received.toString() + " out of " + messages + " messages received");
}

 initialize = function() {
  trace("X", "Initialized, opening channel");
  checkpoint = performance.now();
  openChannel();
  //onMessage({data: '{{ initial_message }}'});
}      
setTimeout(initialize, 1);
