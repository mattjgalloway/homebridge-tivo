var TiVoRemote = require('./TiVoRemote');

var config = {
  ip: '192.168.1.100',
  port: 31339
}
var remote = new TiVoRemote(config);

remote.on('channel', function(channel) { console.log('Channel is now: ' + channel); });
remote.on('on', function(on) { console.log('On state is now: ' + on); });
remote.on('connecting', function() { console.log('Connecting'); });
remote.on('connect', function() {
  console.log('Connected');
  remote.sendCommand('SETCH 101');
});
remote.on('disconnect', function() { console.log('Disconnected'); });
