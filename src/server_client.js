"use strict";

var mysql = require('mysql');

var ERROR = "ERROR";
var SUCCESS = "SUCCESS";

module.exports = function(ws) {
  console.log("New client connected.");
  var ids = {};
  var objects = {};

  function _create_object() {
    var id = null;
    while(id === null || typeof objects[id] !== "undefined") {
      id = Math.random().toString(36);
    }
    objects[id] = {}
    return id;
  }

  function respond(id, status, result) {
    ws.send(JSON.stringify({
      id: id,
      status: status,
      result: result,
    }));
    delete ids[id];
  }

  function success(id, data) {
    respond(id, SUCCESS, data);
  }

  function error(id, err) {
    respond(id, ERROR, err);
  }

  function terminal(id, err) {
    error(id, err);
    ws.close();
  }

  ws.on('message', function(message_str) {
    var message = JSON.parse(message_str);
    if(typeof message.id === "undefined") {
      return terminal(null, "Message has no id");
    }
    if(typeof ids[message.id] !== "undefined") {
      return terminal(message.id, "Duplicate id specified in request.");
    }
    ids[message.id] = message;
    if(typeof message.type === "undefined") {
      return error(message.id, "Type must be specified.");
    }
    switch(message.type) {
      /* mysql proxies */
      case "mysql.createConnection":
        var obj_id = message.object;
        if(objects.hasOwnProperty(obj_id)) {
          return error(message.id, "Object id already in use.");
        }
        objects[obj_id] = mysql.createConnection.apply(null, message.args)
        return success(message.id, "Connection created.");

      case "mysql.createPool":
        var obj_id = message.object;
        if(objects.hasOwnProperty(obj_id)) {
          return error(message.id, "Object id already in use.");
        }
        objects[obj_id] = mysql.createPool.apply(null, message.args)
        return success(message.id, "Connection pool created.");

      /* mysql.Connection proxies */
      case "mysql.Connection.connect":
        var obj_id = message.connection;
        if(!objects.hasOwnProperty(obj_id)) {
          return error(message.id, "Object id not yet created.");
        }
        objects[obj_id].connect(function(err) {
          if(err) return error(message.id, err);
          success(message.id);
        })
        return;

      case "mysql.Connection.query":
        var obj_id = message.connection;
        if(!objects.hasOwnProperty(obj_id)) {
          return error(message.id, "Object id not yet created.");
        }
        message.args.push(function(err, results, fields) {
          if(err) return error(message.id, err);
          success(message.id, {
            results: results,
            fields: fields
          });
        });
        objects[obj_id].query.apply(objects[obj_id], message.args);
        return;

      case "mysql.Connection.release":
        var obj_id = message.connection;
        if(!objects.hasOwnProperty(obj_id)) {
          return error(message.id, "Object id not yet created.");
        }
        objects[obj_id].release();
        delete objects[obj_id];
        success(message.id, "Connection released");
        return;


      /* mysql.Pool proxies */
      case "mysql.Pool.getConnection":
        var obj_id = message.pool;
        if(!objects.hasOwnProperty(obj_id)) {
          return error(message.id, "Object id not yet created.");
        }
        objects[obj_id].getConnection(function(err, connection) {
          if(err) return error(message.id, err);
          var new_object = _create_object();
          objects[new_object] = connection;
          success(message.id, new_object);
        })
        return;

      default:
        error(message.id, "Unknown message type");
    }
  });
}
