var fs = require('fs');
var net = require('net');
var path = require('path');

function clamavjs(port, host) {
  this.port = port ? port : 3310;
  this.host = host ? host : 'localhost';
}

clamavjsscan = function(port, host, pathname, callback) {
  pathname = path.normalize(pathname);
  fs.stat(pathname, function(err, stats) {
    if (err) {
      callback(pathname, null, err);
    }
    else if (stats.isDirectory()) {
      fs.readdir(pathname, function(err, lists) {
        lists.forEach(function(entry) {
          clamavjsscan(port, host, path.join(pathname, entry), callback);
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
            callback(pathname, result[1], null);
          }
          else if (status === 'stream: OK') {
            callback(pathname, null, null);
          }
          else {
            result = status.match(/^(.+) ERROR/);
            if (result != null) {
              callback(pathname, null, new Error(result[1]));
            }
            else {
              callback(pathname, null, new Error('Malformed Response['+status+']'));
            }
          }
        }
      }).on('error', function(err) {
        socket.destroy();
      }).on('close', function() {});
    }
    else if (err) {
      callback(pathname, null, err);
    }
    else {
      callback(pathname, null, new Error('Not a regular file or directory'));
    }
  });
}

clamavjs.prototype.scan = function(pathname, callback) {
  clamavjsscan(this.port, this.host, pathname, callback);
}

module.exports = clamavjs;
