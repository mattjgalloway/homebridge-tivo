"use strict";

var net = require('net');
var util = require('util');

const TiVoConstants = {
    ResponseType: {
        CH_STATUS: "CH_STATUS",
        CH_FAILED: "CH_FAILED",
        LIVETV_READY: "LIVETV_READY",
        MISSING_TELEPORT_NAME: "MISSING_TELEPORT_NAME",
    },
    ChannelStatusReason: {
        LOCAL: "LOCAL",
        REMOTE: "REMOTE",
        RECORDING: "RECORDING",
    },
    ChannelSetFailureReason: {
        NO_LIVE: "NO_LIVE",
        MISSING_CHANNEL: "MISSING_CHANNEL",
        MALFORMED_CHANNEL: "MALFORMED_CHANNEL",
        INVALID_CHANNEL: "INVALID_CHANNEL",
    },
};

var TiVoConnection = function(config, commands, callback) {
    var that = this;

    config = config || {};
    config.port = typeof config.port === 'undefined' ? 31339 : config.port;
    config.attempts = typeof config.attempts === 'undefined' ? 5 : config.attempts;
    config.attempts = config.attempts > 0 ? config.attempts : 1;

    var client = new net.Socket();

    var connected = false;
    var commandsToSend = commands;
    var responses = [];

    var attempts = config.attempts;
    this.connect = function() {
        if (!connected && attempts > 0) {
            setTimeout(function() {
                client.connect(config.port, config.ip);
            }, 1000);
            attempts--;
            return true;
        } else {
            return false;
        }
    };
    client.on('close', function() {
        if (!that.connect()) {
            callback(responses);
        }
    });
    client.on('error', function() {
        if (!that.connect()) {
            callback(responses);
        }
    });
    client.on('connect', function() {
        connected = true;
        that.sendNextCommand();
    });

    var parseResponseMessage = function(message) {
        var response = {
            raw: message,
        };
        var split = message.split(" ");
        var type = split[0];
        switch (type) {
            case TiVoConstants.ResponseType.CH_STATUS:
                response.channel = split[1];
                response.channelStatusReason = split[split.length - 1];
                if (split.length == 4) {
                    response.subChannel = split[2];
                }
                break;
            case TiVoConstants.ResponseType.CH_FAILED:
                response.reason = split[1];
                break;
            default:
                break;
        }
        return response;
    };

    var data = "";
    client.on('data', function(d) {
        data += d;

        while (true) {
            var newline = data.indexOf("\r");
            if (newline > -1) {
                var thisData = data.slice(0, newline);
                data = data.slice(newline + 1);
                responses.push(parseResponseMessage(thisData));
            } else {
                break;
            }
        }
    });

    this.disconnect = function() {
        if (!connected) {
            return;
        }
        client.destroy();
    }

    this.sendNextCommand = function() {
        var command = commandsToSend.shift();
        if (typeof command === 'undefined') {
            setTimeout(function() {
                that.disconnect();
            }, 1000);
            return;
        }
        client.write(command + '\r', 'UTF8', function() {
            setTimeout(function() {
                that.sendNextCommand();
            }, 1000);
        });
    }

    setTimeout(function() {
        that.connect();
    }, 0);
}

module.exports = {
    constants: TiVoConstants,
    sendCommands: TiVoConnection,
}
