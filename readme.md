# ImageAPI #
NodeJS API for handing image upload and retrieval. Demoing nodejs/express.

## Endpoints ##
By Default, api is accessible on port 3000.

`/api/UploadImage`
<br>Upload an image, returns the images sha256 for later retrieval

`/api/RetrieveImage/{image_hash}`
<br>Retrieves a previously uploaded image

`/api/DeleteImage/{image_hash}`
<br>Deletes a previously uploaded image

## Run Locally ##
Navigate into ImageApi folder, Start Postgres, Start API
```shell
docker-compose up
npm start
```

 