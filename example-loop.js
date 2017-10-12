var TiVoRemote = require('./TiVoRemote');
var readline = require('readline');

if (process.argv.length < 3) {
  console.log('Usage: <script> <ip>');
  process.exit(1);
}

var config = {
  ip: process.argv[2],
  port: 31339
}
var remote = new TiVoRemote(config);

var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.setPrompt('');

remote.on('channel', function(channel) { console.log('Channel is now: ' + channel); });
remote.on('on', function(on) { console.log('On state is now: ' + on); });
remote.on('connecting', function() { console.log('Connecting'); });
remote.on('connect', function() { console.log('Connected'); rl.prompt(); });
remote.on('disconnect', function() { console.log('Disconnected'); });

rl.on('line', function(cmd) {
  remote.sendCommand(cmd);
});
