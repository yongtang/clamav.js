var fs = require('fs');
var net = require('net');
var path = require('path');

clamavscan = function(port, host, pathname, callback) {
  pathname = path.normalize(pathname);
  fs.stat(pathname, function(err, stats) {
    if (err) {
      callback(err, pathname);
    }
    else if (stats.isDirectory()) {
      fs.readdir(pathname, function(err, lists) {
        lists.forEach(function(entry) {
          clamavscan(port, host, path.join(pathname, entry), callback);
        });
      });
    }
    else if (stats.isFile()) {
      var socket = new net.Socket();
      var stream = fs.createReadStream(pathname);
      var status = '';
      socket.connect(port, host, function() {
        socket.write("nINSTREAM\n");
        stream.on('data', function(data) {
          var size = new Buffer(4);
          size.writeInt32BE(data.length, 0);
          socket.write(size);
          socket.write(data);
        }).on('end', function() {
          stream.destroy();
          var size = new Buffer(4);
          size.writeInt32BE(0, 0);
          socket.write(size);
        }).on('error', function(err) {
          stream.destroy();
        });
      }).on('data', function(data) {
        status += data;
        if (data.toString().indexOf("\n") !== -1) {
          socket.destroy();
          status = status.substring(0, status.indexOf("\n"));
          var result = status.match(/^stream: (.+) FOUND$/);
          if (result !== null) {
            callback(undefined, pathname, result[1]);
          }
          else if (status === 'stream: OK') {
            callback(undefined, pathname);
          }
          else {
            result = status.match(/^(.+) ERROR/);
            if (result != null) {
              callback(new Error(result[1]), pathname);
            }
            else {
              callback(new Error('Malformed Response['+status+']'), pathname);
            }
          }
        }
      }).on('error', function(err) {
        socket.destroy();
      }).on('close', function() {});
    }
    else if (err) {
      callback(err, pathname);
    }
    else {
      callback(new Error('Not a regular file or directory'), pathname);
    }
  });
}

function clamav() {

}

clamav.prototype.createScanner = function (port, host) {
  return {
    "port": (port ? port : 3310),
    "host": (host ? host : 'localhost'),
    "scan": function(pathname, callback) {
      clamavscan(this.port, this.host, pathname, callback);
    }
  };
}

clamav.prototype.ping = function(port, host, timeout, callback) {
  var status = '';
  var socket = new net.Socket();
  socket.setTimeout(timeout);
  socket.connect(port, host, function() {
    socket.write("nPING\n");
  }).on('data', function(data) {
    status += data;
    if (data.toString().indexOf("\n") !== -1) {
      socket.destroy();
      status = status.substring(0, status.indexOf("\n"));
      if (status === 'PONG') {
        callback();
      }
      else {
        socket.destroy();
        callback(new Error('Invalid response('+status+')'));
      }
    }
  }).on('error', function(err) {
    socket.destroy();
    callback(err);
  }).on('timeout', function() {
    socket.destroy();
    callback(new Error('Socket connection timeout'));
  }).on('close', function() {});
}

module.exports = exports = new clamav();

