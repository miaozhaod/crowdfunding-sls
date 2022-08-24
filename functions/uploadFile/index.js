const AWS = require("aws-sdk");
const parser = require("lambda-multipart-parser");
const sharp = require("sharp");

const BUCKET = process.env.BUCKET;
const s3 = new AWS.S3();

module.exports.handler = async event => {
  console.log("lambda uploadFile event string ... ", JSON.stringify(event));
  const result = await parser.parse(event);
  console.log("result ... ", result);
  const { user_id, width, height } = result;
  const { content } = result.files[0];

  let buffer;
  if (width && height) {
    buffer = await sharp(content)
      .resize(parseInt(width), parseInt(height))
      .toFormat("jpg")
      .jpeg({ quality: 90 })
      .toBuffer();
  } else {
    buffer = await sharp(content)
      .resize(500, 500)
      .toFormat("jpg")
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  try {
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: `${user_id}.jpg`,
        ACL: "public-read",
        Body: buffer,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        link: `https://${BUCKET}.s3.amazonaws.com/${user_id}.png`,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
