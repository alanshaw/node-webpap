var assert = require("assert")
  , webpap = require("../")
  , async = require("async")
  , fs = require("fs")
  , PNG = require("png-js")
  , childProcess = require("child_process")

describe("webpap", function () {
  
  it("should take multiple shots of the same page", function (done) {
    this.timeout(10000)
    
    webpap.createShoot("file://" + __dirname + "/fixtures/basic.html", function (er, shoot) {
      assert.ifError(er)
      
      function takeTask (w, h) {
        return function (cb) {
          shoot.take({width: w, height: h}, cb)
        }
      }
      
      function validateTask (path, w, h) {
        return function (cb) {
          var img = PNG.load(path)
          
          assert.equal(img.width, w)
          assert.equal(img.height, h)
          
          // Check valid PNG and non zero length
          img.decode(function (pixels) {
            assert.notEqual(pixels.length, 0)
            cb(null, pixels)
          })
        }
      }
      
      async.parallel([
          takeTask(150, 138)
        , takeTask(200, 256)
      ], function (er, tmpImgPaths) {
        assert.ifError(er)
        
        assert.equal(tmpImgPaths.length, 2)
        
        // Assert non zero 
        async.parallel([
            validateTask(tmpImgPaths[0], 150, 138)
          , validateTask(tmpImgPaths[1], 200, 256)
        ], function (er) {
          assert.ifError(er)
          shoot.halt()
          done()
        })
      })
    })
  })
  
  it("should successfully take a photo if autoCheese is enabled and webpage has no callback code", function (done) {
    this.timeout(10000)
    
    webpap.createShoot("file://" + __dirname + "/fixtures/auto-cheese.html", {autoCheese: true}, function (er, shoot) {
      assert.ifError(er)
      
      shoot.take({width: 128, height: 100}, function (er, tmpImgPath) {
        assert.ifError(er)
        
        // Make sure an image was created
        var img = PNG.load(tmpImgPath)
        
        assert.equal(img.width, 128)
        assert.equal(img.height, 100)
        
        // Check valid PNG and non zero length
        img.decode(function (pixels) {
          assert.notEqual(pixels.length, 0)
          done()
        })
      })
    })
  })
  
  it("should pass config params to phantomjs", function (done) {
    this.timeout(5000)
    
    var spawn = childProcess.spawn
    
    // When a child process is spawned, attach args to the resulting object
    childProcess.spawn = function () {
      var proc = spawn.apply(childProcess, arguments)
      proc.spawnArgs = [].slice.call(arguments)
      return proc
    }
    
    // Pass in phantom config
    var shootOpts = {
      phantomConfig: {
          "disk-cache": true
        , "web-security": false
      }
    }
    
    webpap.createShoot("file://" + __dirname + "/fixtures/basic.html", shootOpts, function (er, shoot) {
      assert.ifError(er)
      
      assert(shoot.phantomProcess.spawnArgs)
      
      // Spawn args should have two items: command, args
      assert.equal(shoot.phantomProcess.spawnArgs.length, 2)
      
      // Check our args were passed to the process
      assert.notEqual(shoot.phantomProcess.spawnArgs[1].indexOf("--disk-cache=true"), -1)
      assert.notEqual(shoot.phantomProcess.spawnArgs[1].indexOf("--web-security=false"), -1)
      
      // Tear down
      childProcess.spawn = spawn
      shoot.halt()
      done()
    })
  })
  
})