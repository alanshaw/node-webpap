var assert = require("assert")
  , webpap = require("../")
  , async = require("async")
  , fs = require("fs")

describe("webpap", function () {
  
  it("should take multiple shots of the same page", function (done) {
    this.timeout(10000)
    
    webpap.createShoot("file://" + __dirname + "/fixtures/basic.html", function (er, shoot) {
      assert.ifError(er)
      
      async.parallel([
          function (cb) {
            shoot.take({width: 150, height: 138}, cb)
          }
        , function (cb) {
            shoot.take({width: 200, height: 256}, cb)
          }
      ], function (er, tmpImgPaths) {
        assert.ifError(er)
        
        assert.equal(
            fs.readFileSync(tmpImgPaths[0], {encoding: "utf-8"})
          , fs.readFileSync(__dirname + "/fixtures/150x138.png", {encoding: "utf-8"})
        )
        
        assert.equal(
            fs.readFileSync(tmpImgPaths[1], {encoding: "utf-8"})
          , fs.readFileSync(__dirname + "/fixtures/200x256.png", {encoding: "utf-8"})
        )
        
        done()
      })
      
    })
  })
  
})