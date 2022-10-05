//for copying default pfp
const { S3Client, CopyObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'ap-northeast-1' });

//for invalidation
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const cloudFrontClient = new CloudFrontClient({ region: 'ap-northeast-1' });

module.exports = {
  s3: s3Client,
  CopyObjectCommand,
  cf: cloudFrontClient,
  CreateInvalidationCommand,
};
