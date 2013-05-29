// I marshall messages between the webpap module and the webpage
var system = require("system")
  , page = require("webpage").create()
  , fs = require("fs")

var args = ["msgFilePath", "url"].reduce(function (args, name, i) {
  args[name] = system.args[i + 1]
  return args
}, {})

console.log("webpap.phantom spawned")

var n = 0, imgFilePath

(function loopy() {
  
  // Split lines on \n, and removing a trailing line.
  var lines = fs.read(args.msgFilePath).split("\n").slice(0, -1)
  
  // Iterate over all lines that haven't already been processed.
  lines.slice(n).forEach(function (line) {
    
    // Get args and method.
    var args = JSON.parse(line)
      , eventName = args[0]
    
    // We're only interested in "take" messages
    if (eventName == "take") {
      imgFilePath = args[1]
      prepare(args[2])
    }
  })
  
  // Update n so previously processed lines are ignored.
  n = lines.length
  
  // Check back in a little bit.
  setTimeout(loopy, 100)
  
})()

function sendMessage () {
  fs.write(args.msgFilePath, JSON.stringify([].slice.call(arguments)) + "\n", "a")
}

var prepareTimeoutId;

// Signal to webpage that it should prepare for a picture to be taken
function prepare (opts) {
  
  console.log("webpap.phantom preparing page")
  
  page.clipRect = {
      top: opts.top || 0
    , left: opts.left || 0
    , width: opts.width || 100
    , height: opts.height || 100
  }
  
  // Set non repsonse timeout
  prepareTimeoutId = setTimeout(function () {
    sendMessage("timeout")
  }, opts.timeout || 30000)
  
  // HTML5 message the webpage to tell it to prepare for a photo, passing it opts
  page.evaluate(function (opts) {
    opts.sender = "webpap.phantom"
    window.postMessage(opts, "*")
  }, opts)
}

// Called when the page is ready for a photo to be taken
page.onCallback = function () {
  clearTimeout(prepareTimeoutId)
  page.render(imgFilePath)
  console.log("webpap.phantom photo written to", imgFilePath)
  sendMessage("taken", imgFilePath)
}

page.onConsoleMessage = function(msg) {
  console.log(msg)
}

page.open(args.url, function (status) {
  if (status === "fail") {
    page.close()
    return phantom.exit(1)
  }
  sendMessage("ready")
})
