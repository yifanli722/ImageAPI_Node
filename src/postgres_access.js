const crypto = require('crypto');
const { Client } = require('pg');
const fs = require('fs');
const jpeg = require('jpeg-js');
const png = require('pngjs').PNG;

const insertStatement = fs.readFileSync('./Postgres_Scripts/Insert_Image.sql', 'utf8');
const retrieveStatement = fs.readFileSync('./Postgres_Scripts/Retrieve_Image.sql', 'utf8');
const connectionObj = {
    host: 'localhost',
    port: 5432,
    user: 'yfoo',
    password: 'yfoo',
    database: 'yfoo',
}

async function insertImage(imageBytesData) {
    const client = new Client(connectionObj);
    await client.connect();

    const hash = crypto.createHash('sha256');
    hash.update(imageBytesData);
    const sha256 = hash.digest('hex');

    const sqlQuery = {
        text: insertStatement,
        values: [sha256, imageBytesData],
    };
    try {
        const result = await client.query(sqlQuery);
        if (result.rowCount > 0) {
            console.log('Image inserted');
        } else {
            console.log('Image already exists');
        }
        return {
            sha256 : sha256,
            error : null
        };
    }
    catch (err) {
        console.error(err);
        throw err;
    } finally {
        await client.end();
    }
}

async function retrieveImage(sha256) {
    const client = new Client(connectionObj);
    await client.connect();

    const sqlQuery = {
        text: retrieveStatement,
        values: [sha256],
    };

    try {
        let result = await client.query(sqlQuery);
        if(result.rows.length < 1) {
            return {
                success: false,
                imgData: ''
            }; 
        }

        let imageData = result.rows[0].img_data
        if(imageData.length > 0) {
            return {
                success: true,
                imgData: imageData
            };
        } else {
            return {
                success: false,
                imgData: ''
            }
        }
    }
    catch (err) {
        console.error(err);
        throw err;
    } finally {
        await client.end();
    }
}

async function deleteImage(imgHashFull) {
    const sql = fs.readFileSync('./Postgres_Scripts/Delete_Image.sql', 'utf-8');
    const client = new Client(connectionObj);

    try {
        await client.connect();
        const res = await client.query(sql, [imgHashFull]);
        console.log(res.rowCount + ' rows deleted');
        return res.rowCount === 0 || res.rowCount === 1;
    } catch (err) {
        console.error(err);
        return false;
    } finally {
        client.end();
    }
}

async function convertToJpeg(imageData) {
  try {
    let rawImage;
    // Check the first 8 bytes of the image data to determine the image format
    if (imageData.slice(0, 8).toString('hex') === 'ffd8ffe0') {
      // The image data is a JPEG image
      rawImage = jpeg.decode(imageData);
    } else if (imageData.slice(0, 8).toString('hex') === '89504e47') {
      // The image data is a PNG image
      const pngImage = new png();
      pngImage.parse(imageData, (error, data) => {
        if (error) throw error;
        rawImage = data;
      });
    } else {
      // The image data is not a JPEG or PNG image
      throw new Error('Unsupported image format');
    }

    // Encode the raw image into a JPEG image
    const jpegImage = jpeg.encode(rawImage, { quality: 90 });

    return jpegImage.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}


module.exports = {
    insertImage: insertImage,
    retrieveImage: retrieveImage,
    deleteImage: deleteImage
}