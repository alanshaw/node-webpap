// I marshall messages between the webpap module and the webpage
var system = require("system")
  , page = require("webpage").create()
  , fs = require("fs")

var args = ["msgFilePath", "url"].reduce(function (args, name, i) {
  args[name] = system.args[i + 1]
}, {})

page.open(args.url, function (status) {
  if (status === 'fail') {
    page.close()
    return phantom.exit(1)
  }
})

var n = 0, imgFilePath;

(function loopy() {
  
  // Split lines on \n, and removing a trailing line.
  var lines = fs.read(args.msgFilePath).split('\n').slice(0, -1)
  
  // Iterate over all lines that haven't already been processed.
  lines.slice(n).forEach(function (line) {
    
    // Get args and method.
    var args = JSON.parse(line)
      , eventName = args[0]
    
    if (eventName == "take") {
      
      log("webpap.phantom got take event " + args)
      
      imgFilePath = args[1]
      
      // Signal to webpage that it should prepare for a picture to be taken
      prepare(args[2])
    }
  })
  
  // Update n so previously processed lines are ignored.
  n = lines.length
  
  // Check back in a little bit.
  setTimeout(loopy, 100)
  
})()

function prepare (opts) {
  
  log("webpap.phantom preparing page")
  
  page.clipRect = {
      top: opts.top || 0
    , left: opts.left || 0
    , width: opts.width || 0
    , height: opts.height || 0
  }
  
  // TODO: Set non repsonse timeout
  
  // TODO: HTML5 message the webpage to tell it to prepare for a photo, passing it opts
  //page.evaluate()
}

page.onCallback = function () {
  
  log("webpap.phantom page ready")
  
  page.render(imgFilePath)
  
  log("webpap.phantom photo taken")
  
  fs.write(args.msgFilePath, JSON.stringify(["taken"]) + "\n", "a")
}

function log (msg) {
  fs.write(args.msgFilePath, JSON.stringify(["log", msg]) + "\n", "a")
}

