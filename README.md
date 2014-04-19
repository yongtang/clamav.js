clamavjs
========

A node.js library for ClamAV
-----------------------


This node.js library is intended to be served as a bridge between a node.js application and the ClamAV antivirus engine.

The library uses TCP socket (INET) to communicate with ClamAV daemon (clamd) through ClamAV's INSTREAM command. To use clamavjs library, use the following:

```
clamavjs=require('clamavjs');
clamav = new clamavjs(3310, '127.0.0.1');
clamav.scan('<directory>', function(filename, malicious, err) {
    if (malicious) {
        console.log(filename+': '+malicious+' FOUND');
    }
    else if (err) {
        console.log(filename+': '+err);
    }
    else {
        console.log(filename+': OK');
    }
});
```

will scan through the "directory" of a Linux machine and report any malicious files detected by ClamAV.


Performance
-----------
The clamavjs library is implemented in an asynchronous way. That is supposed to perform better when I/O is the bottleneck.

Contact
-------
If you have trouble with the library or have questions, check out the GitHub repository at http://github.com/yotang/clamavjs and I’ll help you sort it out.
