var tmp = require("tmp")
  , fs = require("fs")
  , childProcess = require("child_process")
  , async = require("async")

tmp.setGracefulCleanup()

function Shoot (url, opts, cb) {
  this.url = url
  this.opts = opts
  this.q = async.queue(take.bind(this))
  this.halted = false
  
  // Create the tmp file for communications
  tmp.file(function (err, msgFilePath) {
    if (err) return cb(err)
    
    this.msgFilePath = msgFilePath
    
    initMsgPoll.call(this)
    
    var phantomArgs = [__dirname + '/webpap.phantom.js', msgFilePath, url]
    
    var phantomPath = opts.phantomPath || require("phantomjs").path
    
    if (opts.phantomConfig) {
      phantomArgs = Object.keys(opts.phantomConfig).map(function (key) {
        return '--' + key + '=' + opts.phantomConfig[key];
      }).concat(phantomArgs)
    }
    
    var phantomProcess = childProcess.spawn(phantomPath, phantomArgs)
    
    this.phantomProcess = phantomProcess
    
  }.bind(this))
}

function initMsgPoll () {
  
  var n = 0, id
  
  var cleanup = function() {
    clearTimeout(id)
    fs.unlink(this.msgFilePath)
  }.bind(this)
  
  // It's simple. As the page running in PhantomJS alerts messages, they
  // are written as JSON to a temporary file. This polling loop checks that
  // file for new lines, and for each one parses its JSON and emits the
  // corresponding event with the specified arguments.
  (function loopy() {
    
    fs.readFile(this.msgFilePath, function (err, lines) {
      if (err) return console.error("Failed to read messages file", err)
      
      // Split lines on \n, and removing a trailing line.
      lines = lines.split('\n').slice(0, -1)
      
      // Iterate over all lines that haven't already been processed.
      var done = lines.slice(n).some(function (line) {
        
        // Get args and method.
        var args = JSON.parse(line)
          , eventName = args[0]
        
        console.debug(JSON.stringify(['phantomjs'].concat(args)))
        
        this.phantomProcess.emit.apply(this.phantomProcess, args)
        
        // If halted, return true. Because the Array#some method was used,
        // this not only sets "done" to true, but stops further iteration
        // from occurring.
        return this.halted
      })
  
      if (done) return cleanup()
      
      // Update n so previously processed lines are ignored.
      n = lines.length
      
      // Check back in a little bit.
      id = setTimeout(loopy.bind(this), 100)
      
    }.bind(this))
    
  }.call(this))
}

/**
 * Take a picture
 * 
 * @param {Object} opts
 * @param {Function} cb
 */
Shoot.prototype.take = function (opts, cb) {
  if (this.halted) return cb(new Error("Cannot take after webpap halted"))
  this.q.push(opts, cb)
}

function take (opts, cb) {
  
  // Create file to save image data to
  tmp.file(function (err, imgFilePath) {
    
    var onTaken = function () {
      cb(null, imgFilePath)
    }
    
    // TODO: Set non response timeout
    
    this.phantomProcess.once("taken", onTaken)
    
    var msg = ["take", imgFilePath, opts]
    
    // Send the message
    fs.writeFile(this.msgFilePath, JSON.stringify(msg), {flag: "a"}, function (err) {
      if (err) console.error("Failed to tell phantomjs to take photo", msg)
    })
    
  }.bind(this))
}

Shoot.prototype.halt = function() {
  this.halted = true
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