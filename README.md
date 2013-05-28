node-webpap [![Dependency Status](https://david-dm.org/alanshaw/node-webpap.png)](https://david-dm.org/alanshaw/node-webpap)
===

Take multiple pictures of a web page via the well known "say cheese", "cheeeese" retoric. i.e. ask to take a picture, webpage signals when it's ready, picture is taken.

How to
---

Your webpage needs to listen for a HTML5 message whose payload is an object with a `sender` property that has the value `webpap.phantom`. Other object properties will be as per the arguments you passed to `take`.

When your page is ready to have its picture taken it should call `window.callPhantom()`.

e.g.

index.js:

```javascript
var webpap = require("webpap");

webpap.createShoot("http://localhost/index.html", function(err, shoot) {

  shoot.take({foo: "bar"}, function(err, imgPath) {
    // ...
  });
  
});
```

index.html:

```javascript
window.addEventListener('message', function(event) {
  if(event.data && event.data.sender && event.data.sender == 'webpap.phantom') {
    // Prepare for the photo to be taken
    // Time passes...
    // When ready:
    window.callPhantom();
  }
}, false);
```


Jumping through the hoops
---

The big problem is that node can't communicate with phantom via `child.send` (sending) or `child.on('message')` (receiving) so we have to use a communications file, which is polled for new messages every few milliseconds.