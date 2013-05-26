function Shoot (url, opts, cb) {
  this.url = url;
  this.opts = opts;
  
  // TODO: init phantom process and call cb when ready
}

Shoot.prototype.take = function (angles, cb) {
  if (Object.prototype.toString.call(angles) != '[object Array]') {
    angles = [angles]
  }
  
  // TODO: Send message to phantom process to take photos
}

// Convenience function for one off create shoot and shots
module.exports = function (url, angles, opts, cb) {
  new Shoot (url, opts, function (err, shoot) {
    if (err) return cb(err)
    shoot.take(angles, cb)
  })
}

module.exports.createShoot = function(url, opts, cb) {
    new Shoot(url, opts, cb)
}