const express = require('express');
const app = express();
const fs = require('fs');
const PostgresAccess = require('./postgres_access');

app.post('/api/UploadImage', (req, res) => {
  let imageData = Buffer.alloc(0);
  req.on('data', (chunk) => {
    imageData = Buffer.concat([imageData, chunk]);
  });

  req.on('end', async () => {
    if (imageData.length > 0) {
      let {result, sha256, error } = await PostgresAccess.insertImage(imageData);
      if(result) {
        res.json({
          sha256: sha256
        });
      } else {
        res.status(400).send('Unable to insert image');
        throw error;
      }
    } else {
      res.status(400).send('No image data received');
    }
  });
});

app.post('/api/RetrieveImage', (req, res) => {
  
});

app.listen(3000, () => {
  console.log('SHA-256 endpoint listening on port 3000!');
});
