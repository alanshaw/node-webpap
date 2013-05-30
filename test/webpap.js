var assert = require("assert")
  , webpap = require("../")
  , async = require("async")
  , fs = require("fs")
  , PNG = require("png-js")

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
          });
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
          done()
        })
        
        done()
      })
    })
  })
  
})