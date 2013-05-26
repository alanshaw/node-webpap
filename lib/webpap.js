var tmp = require("tmp")
  , fs = require("fs")
  , childProcess = require("child_process")
  , uuid = require("uuid")

function Shoot (url, opts, cb) {
  this.url = url
  this.opts = opts
  
  // Create the tmp file for communications
  tmp.file(function (err, msgFilePath) {
    if (err) return cb(err)
    
    this.msgFilePath = msgFilePath
    
    var phantomArgs = [__dirname + '/webpap.phantom.js', msgFilePath, url]
    
    var phantomPath = opts.phantomPath || require("phantomjs").path
    
    if (opts.phantomConfig) {
      phantomArgs = Object.keys(opts.phantomConfig).map(function (key) {
        return '--' + key + '=' + opts.phantomConfig[key];
      }).concat(phantomArgs)
    }
    
    var phantomProcess = childProcess.spawn(phantomPath, phantomArgs)
    
    this.phantomProcess = phantomProcess
    
    // TODO: Setup polling the messages file for new messages
    
  }.bind(this))
}

Shoot.prototype.take = function (angle, cb) {
  
  // Create file to save image data to
  tmp.file(function (err, imgFilePath) {
    
    var msgId = this.send("take", imgFilePath, angle)
    
    // TODO: Set non response timeout
    
    var onMessage = function (data) {
      
      if (data.id != msgId) return;
      
      this.phantomProcess.removeListener("message", onMessage)
      
      if (data.err) return cb(data.err)
      cb(null, imgFilePath)
      
    }.bind(this)
    
    this.phantomProcess.on("message", onMessage)
    
  }.bind(this))
}

/**
 * Send a message to the child phantomProcess
 * 
 * Messages look like:
 * [recipient, id, event, args...]
 * 
 * @param {String} name The message name
 * @param {...} args Arguments to pass along with the message
 * @return {String} ID for the message (used to identify replies)
 */
Shoot.prototype.send = function () {
  var args = [].slice.call(arguments)
    , id = uuid.v4()
    , msg = ["webpap.phantom", id].concat(Array.isArray(args[0]) ? args[0] : args)
  
  fs.writeFile(this.msgFilePath, JSON.stringify(msg), {flag: "a"}, function (err) {
    if (err) console.error("Failed to send message to phantomjs", msg)
  })
  
  return id
}

// Convenience function for one off create shoot and shot
module.exports = function (url, angle, opts, cb) {
  new Shoot (url, opts, function (err, shoot) {
    if (err) return cb(err)
    shoot.take(angles, cb)
  })
}

module.exports.createShoot = function (url, opts, cb) {
    new Shoot(url, opts, cb)
}