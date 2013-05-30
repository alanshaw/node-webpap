module.exports = process.env.WEBPAP_COV
   ? require('./lib-cov/webpap')
   : require('./lib/webpap')