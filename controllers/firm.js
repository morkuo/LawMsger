require('dotenv').config;
const { cf, CreateInvalidationCommand } = require('../utils/aws');

const updateFirmPicture = async (req, res) => {
  const [firmPicture] = req.files;

  if (!firmPicture) return res.status(400).json({ error: 'no picture found' });

  const paramsInvalidation = {
    DistributionId: 'E21OBVDL9ASI5Z',
    InvalidationBatch: {
      CallerReference: `${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: [`/firm_picture/${req.userdata.organizationId}.jpg`],
      },
    },
  };

  const commandInvalidation = new CreateInvalidationCommand(paramsInvalidation);
  const responseInvalidation = await cf.send(commandInvalidation);

  console.log('CloudFront invalidation:', responseInvalidation);

  res.json({
    data: 'updated',
  });
};

module.exports = {
  updateFirmPicture,
};
