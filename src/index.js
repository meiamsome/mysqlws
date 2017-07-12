"use strict";

;(function(root) {
  var has_require = typeof require !== 'undefined';

  if(has_require) {
    var WebSocket = require('ws');
    var Server = require('./server');
  } else {
    var WebSocket = root.WebSocket;
  }
  var mysqlws = function() {

  }

  if(has_require) mysqlws.Server = Server;

  if( typeof exports !== 'undefined' ) {
    if( typeof module !== 'undefined' && module.exports ) {
      exports = module.exports = mysqlws
    }
    exports.mysqlws = mysqlws
  }
  else {
    root.mysqlws = mysqlws
  }
})(this);
