"use strict";

var net = require('net');
var util = require('util');

var TiVoRemote = require('./TiVoRemote.js');

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

    this.channel = 0;
    this.on = false;

    var remote = new TiVoRemote({
        ip: config['ip'],
        port: config['port']
    });
    remote.on('channel', function(channel) {
        that.log.debug('Channel is now: ' + channel); 
        that.channel = channel;
        that.on = true;
    });
    remote.on('connecting', function() {
        that.log.debug('Connecting');
    });
    remote.on('connect', function() {
        that.log.debug('Connected');
    });
    remote.on('disconnect', function() {
        that.log.debug('Disconnected');
    });
    remote.on('error', function(error) {
        that.log.error('Error: ' + error);
    });
    this.remote = remote;

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
    callback(null, accessory.on);
};

TiVoAccessory.prototype._setOn = function(on, callback) {
    var accessory = this;
    if (on) {
        accessory.remote.sendCommand('IRCODE STANDBY', function(done) {
            if (done) {
                accessory.on = true;
            }
            callback(null);
        });
    } else {
        accessory.remote.sendCommand('IRCODE STANDBY', function(done) {
            if (!done) {
                callback(null);
                return;
            }

            setTimeout(function() {
                accessory.remote.sendCommand('IRCODE STANDBY', function(done) {
                    if (done) {
                        accessory.on = false;
                    }
                    callback(null);
                });
            }, 1000);
        });
    }
};

TiVoAccessory.prototype._getChannel = function(callback) {
    var accessory = this;
    callback(null, accessory.channel);
}

TiVoAccessory.prototype._setChannel = function(channel, callback) {
    var accessory = this;
    accessory.remote.sendCommand('SETCH ' + channel, function(done) {
        callback(null);
    });
}
