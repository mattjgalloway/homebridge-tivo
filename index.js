"use strict";
var net = require('net');
var inherits = require('util').inherits;

var Service, Characteristic, ChannelCharacteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    makeChannelCharacteristic();
    homebridge.registerAccessory("homebridge-tivo", "tivo", TiVoAccessory);
}

function TiVoAccessory(log, config) {
    this.log = log;
    this.config = config;
    this.name = config['name'];
    this.ip = config['ip'];
    this.port = config['port'];

    this.remote = new TiVoRemote(this.ip, this.port);

    this.service = new Service.Switch(this.name);
    this.service
        .getCharacteristic(Characteristic.On)
        .on('get', this._getOn.bind(this))
        .on('set', this._setOn.bind(this));
    this.service
        .addCharacteristic(ChannelCharacteristic)
        .on('get', this._getChannel.bind(this))
        .on('set', this._setChannel.bind(this));
}

function makeChannelCharacteristic() {
    ChannelCharacteristic = function () {
        Characteristic.call(this, 'Channel', '212131F4-2E14-4FF4-AE13-C97C3232499D');
        this.setProps({
            format: Characteristic.Formats.STRING,
            unit: Characteristic.Units.NONE,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
        });
        this.value = "1";
    };

    inherits(ChannelCharacteristic, Characteristic);
}

TiVoAccessory.prototype.getServices = function() {
    var informationService = new Service.AccessoryInformation();
    informationService
        .setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.Manufacturer, 'TiVo')
        .setCharacteristic(Characteristic.Model, '1.0.0')
        .setCharacteristic(Characteristic.SerialNumber, this.ip);
    return [this.service, informationService];
};

TiVoAccessory.prototype._getOn = function(callback) {
    var accessory = this;
    accessory.remote.getStatus(function(status) {
        callback(null, status.split(" ")[0] == "CH_STATUS");
    });
};

TiVoAccessory.prototype._setOn = function(on, callback) {
    var accessory = this;
    if (on) {
        accessory.remote.sendCommand('IRCODE STANDBY', function() {
            callback(null);
        });
    } else {
        accessory.remote.sendCommand('IRCODE STANDBY', function() {
            accessory.remote.sendCommand('IRCODE STANDBY', function() {
                callback(null);
            });
        });
    }
};

TiVoAccessory.prototype._getChannel = function(callback) {
    var accessory = this;
    accessory.remote.getStatus(function(status) {
        var split = status.split(" ");
        var channel = parseInt(split[1], 10);
        callback(null, channel);
    });
}

TiVoAccessory.prototype._setChannel = function(channel, callback) {
    var accessory = this;
    accessory.remote.sendCommand('SETCH ' + channel, function() {
        callback(null);
    });
}

class TiVoRemote {
    constructor(ip, port) {
        this.ip = ip
        this.port = port
    }

    getStatus(callback) {
        var client = new net.Socket();
        client.connect(this.port, this.ip, function() {});

        var data = "";
        client.on('data', function(d) {
            data += d;
            if (data.includes("\r")) {
                callback(data.split("\r")[0]);
                client.destroy();
            }
        });
        client.on('error', function(d) {
            callback(null);
        });
    }

    sendCommand(command, callback) {
        var client = new net.Socket();
        client.connect(this.port, this.ip, function() {
            client.write(command + '\r');
            client.destroy();
            callback(null);
        });
    }
}
