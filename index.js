var fs = require('fs');
var net = require('net');
var path = require('path');
var util = require('util');
var Transform = require('stream').Transform;
util.inherits(ClamAVChannel, Transform);

function ClamAVChannel(options) {
  if (!(this instanceof ClamAVChannel))
    return new ClamAVChannel(options);

  Transform.call(this, options);
  this._inBody = false;
}
ClamAVChannel.prototype._transform = function(chunk, encoding, callback) {
  if (!this._inBody) {
    this.push("nINSTREAM\n");
    this._inBody = true;
  }

  var size = new Buffer(4);
  size.writeInt32BE(chunk.length, 0);
  this.push(size);
  this.push(chunk);

  callback();
};
ClamAVChannel.prototype._flush = function (callback) {
  var size = new Buffer(4);
  size = new Buffer(4);
  size.writeInt32BE(0, 0);
  this.push(size);

  callback();
};

clamavstreamscan = function(port, host, stream, complete, object, callback) {
  var socket = new net.Socket();
  var status = '';
  socket.connect(port, host, function() {
    var channel = new ClamAVChannel();
    stream.pipe(channel).pipe(socket).on('end', function() {
      complete(stream);
    }).on('error', function(err) {
      callback(new Error(err), object);
      complete(stream);
    });
  }).on('data', function(data) {
    status += data;
    if (data.toString().indexOf("\n") !== -1) {
      socket.destroy();
      status = status.substring(0, status.indexOf("\n"));
      var result = status.match(/^stream: (.+) FOUND$/);
      if (result !== null) {
        callback(undefined, object, result[1]);
      }
      else if (status === 'stream: OK') {
        callback(undefined, object);
      }
      else {
        result = status.match(/^(.+) ERROR/);
        if (result != null) {
          callback(new Error(result[1]), object);
        }
        else {
          callback(new Error('Malformed Response['+status+']'), object);
        }
      }
    }
  }).on('error', function(err) {
    socket.destroy();
    callback(err, object);
  }).on('close', function() {});
}

clamavfilescan = function(port, host, filename, callback) {
  var stream = fs.createReadStream(filename);
  clamavstreamscan(port, host, stream, function(stream) { stream.destroy(); }, filename, callback);
}

clamavpathscan = function(port, host, pathname, callback) {
  pathname = path.normalize(pathname);
  fs.stat(pathname, function(err, stats) {
    if (err) {
      callback(err, pathname);
    }
    else if (stats.isDirectory()) {
      fs.readdir(pathname, function(err, lists) {
        lists.forEach(function(entry) {
          clamavpathscan(port, host, path.join(pathname, entry), callback);
        });
      });
    }
    else if (stats.isFile()) {
        clamavfilescan(port, host, pathname, callback);
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
    "scan": function(object, callback) {
      if (typeof object === 'string') {
        clamavpathscan(this.port, this.host, object, callback);
      }
      else {
        clamavstreamscan(this.port, this.host, object, function(stream){ }, object, callback);
      }
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

clamav.prototype.version = function(port, host, timeout, callback) {
  var status = '';
  var socket = new net.Socket();
  socket.setTimeout(timeout);
  socket.connect(port, host, function() {
    socket.write("nVERSION\n");
  }).on('data', function(data) {
    status += data;
    if (data.toString().indexOf("\n") !== -1) {
      socket.destroy();
      status = status.substring(0, status.indexOf("\n"));
      if (status.length > 0) {
        callback(undefined, status);
      }
      else {
        socket.destroy();
        callback(new Error('Invalid response'));
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

