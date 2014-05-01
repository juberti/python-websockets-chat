var start = performance.now();
var inbox;
var outbox;
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

function onInOpen(x) {
  trace("X", "In Channel opened");
  if (a) {
    write("WebSocket open");
    sendMessages();
  }
}

function onOutOpen(x) {
  trace("X", "Out channel opened");
  write("WebSockets open");
  sendMessages();
}

function sendMessages() {
  checkpoint = performance.now();
  for (var i = 0; i < messages; ++i) {
    sendMessage('/message', i.toString());
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
    outbox.send(opt_param.toString());
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
  trace("X", "Creating sockets");
  inbox = new ReconnectingWebSocket("ws://"+ location.host + "/receive");
  if (!a) {
    outbox = new ReconnectingWebSocket("ws://"+ location.host + "/submit");
    outbox.onopen = onOutOpen;
  }
  inbox.onmessage = onMessage;
  inbox.onopen = onInOpen;
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
