var tmp = require("tmp")
  , fs = require("fs")
  , childProcess = require("child_process")
  , async = require("async")

tmp.setGracefulCleanup()

process.on('uncaughtException', function (err) {
   console.error(err.stack)
});

function Shoot (url, opts, cb) {
  
  if (!cb) {
    cb = opts
    opts = {}
  }
  
  this.url = url
  this.q = async.queue(take.bind(this))
  this.halted = false
  
  // Create the tmp file for communications
  tmp.file(function (err, msgFilePath) {
    if (err) return cb(err)
    
    var phantomArgs = [__dirname + '/webpap.phantom.js', msgFilePath, url]
    
    var phantomPath = opts.phantomPath || require("phantomjs").path
    
    if (opts.phantomConfig) {
      phantomArgs = Object.keys(opts.phantomConfig).map(function (key) {
        return '--' + key + '=' + opts.phantomConfig[key];
      }).concat(phantomArgs)
    }
    
    var phantomProcess = childProcess.spawn(phantomPath, phantomArgs)
    
    // Hook up the process stdout/stderr to our stdout/stderr
    
    phantomProcess.stdout.setEncoding("utf-8")
    phantomProcess.stderr.setEncoding("utf-8")
    
    phantomProcess.stdout.on("data", function (data) {
      console.log(data)
    })
    
    phantomProcess.stderr.on("data", function (data) {
      console.error(data)
    })
    
    // When the phantom page is ready to start snapping, we can call our callback
    phantomProcess.once("ready", function () {
      cb(null, this)
    }.bind(this))
    
    this.phantomProcess = phantomProcess
    this.msgFilePath = msgFilePath
    
    initMsgPoll(this)
    
  }.bind(this))
}

function initMsgPoll (shoot) {
  
  var n = 0, id;
  
  function cleanup () {
    clearTimeout(id)
    shoot.phantomProcess.kill()
    fs.unlink(shoot.msgFilePath)
  }
  
  // It's simple. As the page running in PhantomJS alerts messages, they
  // are written as JSON to a temporary file. This polling loop checks that
  // file for new lines, and for each one parses its JSON and emits the
  // corresponding event with the specified arguments.
  (function loopy() {
    
    fs.readFile(shoot.msgFilePath, {encoding: "utf-8"}, function (err, lines) {
      if (err) return console.error("Failed to read messages file", err)
      
      // Split lines on \n, and removing a trailing line.
      lines = lines.split('\n').slice(0, -1)
      
      // Iterate over all lines that haven't already been processed.
      lines.slice(n).forEach(function (line) {
        
        // Get args and method.
        var args = JSON.parse(line)
          , eventName = args[0]
        
        switch(eventName) {
          case "ready": shoot.phantomProcess.emit("ready"); break;
          case "taken": shoot.phantomProcess.emit("taken", args[1]); break;
        }
        
      })
      
      if (shoot.halted) return cleanup()
      
      // Update n so previously processed lines are ignored.
      n = lines.length
      
      // Check back in a little bit.
      id = setTimeout(loopy, 100)
    })
    
  })()
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
  tmp.file({postfix: ".png"}, function (err, imgFilePath) {
    
    var onTaken = function (imgFilePath) {
      cb(null, imgFilePath)
    }
    
    // TODO: Set non response timeout
    
    this.phantomProcess.once("taken", onTaken)
    
    var msg = ["take", imgFilePath, opts]
    
    // Send the message
    fs.writeFile(this.msgFilePath, JSON.stringify(msg) + "\n", {flag: "a"}, function (err) {
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