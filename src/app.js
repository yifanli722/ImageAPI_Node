const express = require('express');
const cors = require('cors')
const PostgresAccess = require('./postgres_access');
const app = express();
app.use(cors())

app.post('/api/UploadImage', (req, res) => {
  let imageData = Buffer.alloc(0);
  req.on('data', (chunk) => {
    imageData = Buffer.concat([imageData, chunk]);
  });

  req.on('end', async () => {
    if (imageData.length > 0) {
      let { sha256, error } = await PostgresAccess.insertImage(imageData);
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
  let { success, imgData } = await PostgresAccess.retrieveImage(imageHash);
  if(success) {
    res.set('Content-Type', 'image/jpeg').send(imgData);
  } else {
    res.status(404).json({
      Error: `${imageHash} Does not exist`
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

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});