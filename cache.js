const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 }); // Adjust TTL (time-to-live) and check period as needed

module.exports = myCache;