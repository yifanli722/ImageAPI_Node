const express = require('express');
const cors = require('cors')
const PostgresAccess = require('./postgres_access');
const postgres_access = require('./postgres_access');
const app = express();

require('dotenv').config();
app.use(cors())

app.post('/api/UploadImage', (req, res) => {
  let imageData = Buffer.alloc(0);
  req.on('data', (chunk) => {
    imageData = Buffer.concat([imageData, chunk]);
  });

  req.on('end', async () => {
    if (imageData.length > 0) {
      let { sha256, error } = await PostgresAccess.insertMedia(imageData);
      if(error === null) {
        res.json({
          insertedSha256: sha256
        });
      } else {
        res.status(500).json({
          Error: error.stack
        });
      }
    } else {
      res.status(400).json({
        Error: 'No image data received'
      });
    } 
  });
});

app.get('/api/RetrieveImage/:hash', async (req, res) => {
  var imageHash = req.params['hash'];
  if(imageHash.length < 1) {
    res.status(500).json({
      Error: 'Unable to insert image',
      Trace: err.Trace
    });
  }
  let { success, mediaData, type, error, returnCode } = await PostgresAccess.retrieveMedia(imageHash);
  if(success) {
    res.set('Content-Type', type).send(mediaData);
  } else {
    res.status(returnCode).json({
      Error: error
    });
  }
});

app.delete('/api/DeleteImage/:hash', async (req, res) => {
  var imageHash = req.params['hash'];

  const success = await PostgresAccess.deleteImage(imageHash);

  if (success) {
    res.json({
      deletedSha256: imageHash
    });
  } else {
    res.sendStatus(500);
  }
});

postgres_access.InitilizePostgres();

if(process.env.APP_PORT !== null) {
  app.listen(process.env.APP_PORT, () => {
    console.log(`Server listening on port ${process.env.APP_PORT}`);
  });
} else {
  app.listen(3000, () => {
    console.log('WARNING: Did not find APP_PORT in .env, using default port of 3000');
  });
}
