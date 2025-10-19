const serverless = require("serverless-http");
const { app } = require("../index"); // or wherever your Express app instance lives

module.exports.handler = serverless(app);
