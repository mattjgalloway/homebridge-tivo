var tivo = require('./TiVoConnection');

var config = {
  ip: '192.168.1.100',
  port: 31339,
}

tivo.sendCommands(config, [], function(responses, errors) {
    console.log('RESPONSES: ' + JSON.stringify(responses));
    console.log('ERRORS: ' + errors);
    tivo.sendCommands(config, ["SETCH 101"], function(responses, errors) {
        console.log('RESPONSES: ' + JSON.stringify(responses));
        console.log('ERRORS: ' + errors);
    });
});

