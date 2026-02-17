  const { RekognitionClient } = require("@aws-sdk/client-rekognition");
const { NodeHttpHandler } = require("@aws-sdk/node-http-handler");

const client = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 5000, // 5 sec connect
    socketTimeout: 8000,     // 8 sec max wait
  }),
});

module.exports = client;
