const e = require('express');
const express = require('express');
const app = express();
const PostgresAccess = require('./postgres_access');

app.post('/api/UploadImage', (req, res) => {
  let imageData = Buffer.alloc(0);
  req.on('data', (chunk) => {
    imageData = Buffer.concat([imageData, chunk]);
  });

  req.on('end', async () => {
    if (imageData.length > 0) {
      let { sha256, err } = await PostgresAccess.insertImage(imageData);
      if(err !== null) {
        res.json({
          sha256: sha256
        });
      } else {
        res.status(500).json({
          Error: 'Unable to insert image',
          Trace: err.Trace
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
    res.status(400).json({
      Error: 'Implement error'
    });
  }
});


app.listen(3000, () => {
  console.log('SHA-256 endpoint listening on port 3000!');
});
