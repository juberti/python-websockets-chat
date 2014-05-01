var start = performance.now();
var inbox;
var outbox;
var checkpoint;
var messages = 16; //{{ messages }};
var received = 0;
var watchdog;
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
  write("inbox.open");
  checkpoint = performance.now();
  for (var i = 0; i < messages; ++i) {
    sendMessage('/message', i.toString());
  }
  write(messages.toString() + " XHRs");
  watchdog = setTimeout(terminate, 10000);
  checkpoint = performance.now();
}

function onOutOpen(x) {
  trace("X", "Out Channel opened");
  write("outbox.open");
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
  inbox = new ReconnectingWebSocket("ws://"+ location.host + "/submit");
  outbox = new ReconnectingWebSocket("ws://"+ location.host + "/receive");
  inbox.onmessage = onMessage;
  inbox.onopen = onInOpen;
  outbox.onopen = onOutOpen;
}

sendMessage = function(path, opt_param) {
  /*var xhr = new XMLHttpRequest();
  if (opt_param) {
    path += '?m=';
    path += opt_param;
  }
  xhr.open('POST', path, true);
  trace("S", opt_param);
  xhr.send();*/
  outbox.send(opt_param);
};

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
