ClamAV.js
========

A node.js library for ClamAV
-----------------------


This node.js library is intended to be served as a bridge between a node.js application and the ClamAV antivirus engine.

The library uses TCP socket (INET) to communicate with ClamAV daemon (clamd) through ClamAV's INSTREAM command. To use this library, use the following:

```js
var clamav=require('clamav.js');

clamav.createScanner(3310, '127.0.0.1').scan('<directory>'
    , function(err, filename, malicious) {
  if (err) {
    console.log(filename+': '+err);
  }
  else if (malicious) {
    console.log(filename+': '+malicious+' FOUND'); 
  }
  else {
    console.log(filename+': OK');
  }
});

```

will scan through the "directory" of a Linux machine and report any malicious files detected by ClamAV.

Additionally, to check the availability of the ClamAV daemon, use the following:

```js
var clamav=require('clamav.js');

clamav.ping(3310, '127.0.0.1', 1000, function(err) {
  if (err) {
    console.log('127.0.0.1:3310 is not available['+err+']');
  }
  else {
    console.log('127.0.0.1:3310 is alive');
  }
});

```

where the third parameter 1000 is the timeout in milliseconds.


Installation
-----------
First install [node.js](http://nodejs.org) and [ClamAV](http://clamav.net), then:

```sh
$npm install clamav.js
```

Performance
-----------
The ClamAV.js library is implemented in an asynchronous way by utilizing transform stream of node.js. That is supposed to perform better when I/O is the bottleneck.

License
-----------
The ClamAV.js library is provided under the MIT License.

Contact
-------
If you have trouble with the library or have questions, check out the GitHub repository at http://github.com/yotang/clamav.js and I’ll help you sort it out.
