"use strict";

var net = require('net');
var util = require('util');

var tivo = require('./TiVoConnection');

var Service, Characteristic, ChannelCharacteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    makeChannelCharacteristic();
    homebridge.registerAccessory("homebridge-tivo", "tivo", TiVoAccessory);
}

function TiVoAccessory(log, config) {
    var that = this;

    this.log = log;
    this.config = config;
    this.name = config['name'];

    var tivoConfig = {
        ip: config['ip'],
        port: config['port']
    };

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

    util.inherits(ChannelCharacteristic, Characteristic);
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
    tivo.sendCommands(accessory.tivoConfig, [], function(responses) {
        callback(null, responses.length > 0);
    });
};

TiVoAccessory.prototype._setOn = function(on, callback) {
    var accessory = this;
    var commands = null;
    if (on) {
        commands = ['IRCODE STANDBY'];
    } else {
        commands = ['IRCODE STANDBY', 'IRCODE STANDBY'];
    }
    tivo.sendCommands(accessory.tivoConfig, commands, function(responses) {
        setTimeout(function() {
            tivo.sendCommands(accessory.tivoConfig, [], function(responses) {
                var completed = on ? responses.length > 0 : responses.length == 0;
                callback(completed ? null : "Failed");
            });
        }, 5000);
    });
};

TiVoAccessory.prototype._getChannel = function(callback) {
    var accessory = this;
    tivo.sendCommands(accessory.tivoConfig, [], function(responses) {
        var lastResponse = responses.pop();
        if (typeof lastResponse === 'undefined') {
            callback("Failed");
        }
        callback(null, lastResponse.channel);
    });
}

TiVoAccessory.prototype._setChannel = function(channel, callback) {
    var accessory = this;
    tivo.sendCommands(accessory.tivoConfig, ['SETCH ' + channel], function(responses) {
        callback(responses.length > 1 ? null : "Failed");
    });
}
