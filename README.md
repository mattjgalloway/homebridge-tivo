# homebridge-tivo

A Homebridge plugin for interfacing with a TiVo set top box.

# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-tivo`
3. Add a `tivo` accessory. See below for an example.

# Configuration

Configuration sample:

```
"accessories": [
  {
    "accessory": "tivo",
    "name": "Living Room TiVo",
    "ip": "192.168.1.100",
    "port": 31339
  }
]
```
