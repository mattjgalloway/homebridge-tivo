"use strict";

var net = require('net');
var util = require('util');
var events = require('events');

function OneShot(callback) {
    var _callback = callback
    return function() {
        _callback.apply(this, arguments)
        _callback = function() {}
    }
}

var TiVoRemote = function(config) {
    var that = this;

    config = config || {};
    config.port = typeof config.port === 'undefined' ? 31339 : config.port;
    config.reconnect = typeof config.reconnect === 'undefined' ? 5000 : config.reconnect;

    var client = new net.Socket();
    var connected = false;
    var on = false;

    client.on('close', function() {
        connected = false;
        that.emit('disconnect');

        if (config.reconnect > 0) {
            setTimeout(function() {
                that.connect();
            }, config.reconnect);
        }
    });

    client.on('connect', function() {
        connected = true;
        that.emit('connect');
    });

    var data = "";
    client.on('data', function(d) {
        data += d;

        while (true) {
            var newline = data.indexOf("\r");
            if (newline > -1) {
                var thisData = data.slice(0, newline);
                data = data.slice(newline + 1);

                if (thisData.startsWith("CH_STATUS")) {
                    var split = thisData.split(" ");
                    that.emit('channel', split[1]);
                    continue;
                }

                that.emit('error', 'Unhandled command! (' + thisData + ')');
            } else {
                break;
            }
        }
    });

    this.connect = function() {
        if (connected) {
            return;
        }

        that.emit('connecting');
        client.connect(config.port, config.ip);
    }

    this.sendCommand = function(command, callback) {
        if (!connected) {
            if (typeof callback === 'function') {
                callback(false);
            }
            return;
        }

        client.write(command + '\r', 'UTF8', function() {
            if (typeof callback === 'function') {
                callback(true);
            }
        });
    }

    setTimeout(function() {
        that.connect();
    }, 0);
}

util.inherits(TiVoRemote, events.EventEmitter);

module.exports = TiVoRemote
