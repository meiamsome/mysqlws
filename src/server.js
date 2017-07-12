"use strict";

/* Only available on node */
var WebSocket = require('ws');
var client = require('./server_client');
var mysqlws = module.exports = function(conf) {
  this.server = new WebSocket.Server({port: 8080});
  this.server.on('connection', client);
}

if(require.main === module) {
  new mysqlws();
}
