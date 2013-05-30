node-webpap [![Dependency Status](https://david-dm.org/alanshaw/node-webpap.png)](https://david-dm.org/alanshaw/node-webpap) [![Build Status](https://travis-ci.org/alanshaw/node-webpap.png?branch=master)](https://travis-ci.org/alanshaw/node-webpap)
===

Take _multiple_ pictures of a web page via the well known "say cheese", "cheeeese" retoric. i.e. ask to take a picture, webpage signals when it's ready, picture is taken.

How to
---

Your webpage needs to listen for a HTML5 message whose payload is an object with a `sender` property that has the value `webpap.phantom`. Other object properties will be as per the arguments you passed to `take`.

When your page is ready to have its picture taken it should call `window.callPhantom()`.

e.g.

index.js:

```javascript
var webpap = require("webpap")
  , fs = require("fs")

webpap.createShoot("http://localhost/index.html", {/* shoot options */}, function(err, shoot) {
  
  shoot.take({/* photo options */}, function(err, tmpImgPath) {
    
    // Move the image from the tmp path to where you want it
    fs.rename(tmpImgPath, "/path/to/img.png", function() {
      console.log("done");
    });
    
    // Always call halt to quit the phantom process
    shoot.halt();
  });
  
});
```

index.html:

```javascript
window.addEventListener('message', function(event) {
  if(event.data && event.data.sender && event.data.sender == 'webpap.phantom') {
    // Prepare for the photo to be taken
    // NOTE: event.data is the photo options you passed to Shoot#take
    // Time passes...
    // When ready:
    window.callPhantom();
  }
}, false);
```

### Take single

webpap provides a convenience function to allow you to create a shoot, take single a photo and halt the shoot automatically:

```javascript
var webpap = require("webpap")
  , fs = require("fs")

webpap("http://localhost/index.html", {/* shoot options */}, {/* photo options */}, function(err, tmpImgPath) {
  
  // Move the image from the tmp path to where you want it
  fs.rename(tmpImgPath, "/path/to/img.png", function() {
    console.log("done");
  });
  
});
```

Shoot options
---

Options passed to `webpap#createShoot`:

### phantomPath
Type: `String`
Default value: `Path provided by phantomjs module`

Path to phantom binary

### phantomConfig
Type: `Object`
Default value: `{}`

Object with key value pairs corresponding to phantomjs [command line options](https://github.com/ariya/phantomjs/wiki/API-Reference#command-line-options)

Photo options
---

Options passed to `Shoot#take`. Note that all these options are postMessage'd to your webpage before the shot is taken so you are free to pass arbirtary data.

### width
Type: `Number`
Default value: `100`

### height
Type: `Number`
Default value: `100`

### top
Type: `Number`
Default value: `0`

### left
Type: `Number`
Default value: `0`

### timeout
Type: `Number`
Default value: `30000`

Time in milliseconds before webpap considers the web page to be non responsive and returns with an error.


Jumping through the hoops
---

The big problem is that node can't communicate with phantom via `child.send` (sending) or `child.on('message')` (receiving) so we have to use a communications file, which is polled for new messages every few milliseconds.