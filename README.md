node-webpap [![Dependency Status](https://david-dm.org/alanshaw/node-webpap.png)](https://david-dm.org/alanshaw/node-webpap)
===

Take multiple pictures of a web page via the well known "say cheese", "cheeeese" retoric. i.e. ask to take a picture, webpage signals when it's ready, picture is taken.

Jumping through the hoops
---

The big problem is that node can't communicate with phantom via `child.send` (sending) or `child.on('message')` (receiving) so we have to use a communications file, which is polled for new messages every few milliseconds.