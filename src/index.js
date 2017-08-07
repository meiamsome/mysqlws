"use strict";

(function(root) {
  var ERROR = "ERROR";
  var SUCCESS = "SUCCESS";

  var has_require = typeof require !== 'undefined';

  if(typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
    var WebSocket = window.WebSocket;
  } else if(has_require) {
    var WebSocket = require('ws');
    var Server = require('./server');
  } else {
    throw "Could not resolve WebSocket."
  }
  // Proxy object for a connection
  var ConnectionProxy = function(proxy_id, parent) {
    this.connect = function(cb) {
      parent._send({
        type: "mysql.Connection.connect",
        connection: proxy_id,
      }, function(result) {
        if(result.status === ERROR) {
          cb(result.result);
        } else cb();
      });
    }

    this.query = function(arg0, arg1, arg2) {
      var args = [];
      var cb;
      if(arg2 === null) {
        args = [arg0, arg1];
        cb = arg2;
      } else {
        args = [arg0];
        cb = arg1;
      }
      parent._send({
        type: "mysql.Connection.query",
        connection: proxy_id,
        args: args
      }, function(result) {
        if(result.status === ERROR) return cb(result.result);
        cb(null, result.result.results, result.result.fields);
      });
    }

    this.release = function() {
      parent._send({
        type: "mysql.Connection.release",
        connection: proxy_id
      }, function() {});
    }
  }

  // Proxy for a pool.
  var PoolProxy = function(proxy_id, parent) {
    this.getConnection = function(cb) {
      parent._send({
        type: 'mysql.Pool.getConnection',
        pool: proxy_id
      }, function(result) {
        if(result.status === ERROR) return cb(result.result);
        parent._register_object(result.result);
        cb(null, new ConnectionProxy(result.result, parent));
      })
    }
    // TODO
  }

  // Base mysql proxy
  var mysqlws = function(url, open_callback) {
    var socket = new WebSocket(url);
    var callbacks = {};
    var objects = {};
    var id = 0;
    var debug = false;
    var initialized = false;
    var self = this;

    socket.onmessage = function(message_ev) {
      var message = JSON.parse(message_ev.data);
      if(debug) console.log("Recv", message);
      callbacks[message.id](message);
    }

    socket.onopen = function() {
      initialized = true;
      open_callback(null, self);
    }

    socket.onerror = function(err) {
      if(!initialized) {
        open_callback(err);
      } else {
        console.log("Error in mysqlws: ", err);
      }
    }

    this._send = function(packet, callback) {
      packet.id = id++;
      callbacks[packet.id] = callback;
      if(debug) console.log("Send", packet);
      socket.send(JSON.stringify(packet));
    }

    this._create_object = function() {
      var id = null;
      while(id === null || typeof objects[id] !== "undefined") {
        id = Math.random().toString(36);
      }
      objects[id] = {}
      return id;
    }

    this._register_object = function(id) {
      objects[id] = {};
    }

    this.createConnection = function() {
      var my_id = this._create_object();
      this._send({
        type: "mysql.createConnection",
        object: my_id,
        args: [].slice.call(arguments)
      }, function() {});
      return new ConnectionProxy(my_id, this);
    }

    this.createPool = function() {
      var my_id = this._create_object();
      this._send({
        type: "mysql.createPool",
        object: my_id,
        args: [].slice.call(arguments)
      }, function() {});
      return new PoolProxy(my_id, this);
    }

    this.setDebug = function(_debug) {
      debug = _debug;
    }
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
