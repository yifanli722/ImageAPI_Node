const crypto = require('crypto');
const { Client } = require('pg');
const fs = require('fs');
const sharp = require('sharp');

const insertStatement = fs.readFileSync('./Postgres_Scripts/Insert_Image.sql', 'utf8');
const retrieveStatement = fs.readFileSync('./Postgres_Scripts/Retrieve_Image.sql', 'utf8');
const connectionObj = {
    host: 'localhost',
    port: 5432,
    user: 'yfoo',
    password: 'yfoo',
    database: 'yfoo',
}

async function insertImage(imageData) {
    try {
        var jpegData = await sharp(imageData).jpeg({mozjpeg: true}).toBuffer();
    } catch (err) {
        return {
            sha256 : null,
            error : err
        };
    }
    
    const client = new Client(connectionObj);
    await client.connect();

    const hash = crypto.createHash('sha256');
    hash.update(jpegData);
    const sha256 = hash.digest('hex');

    const sqlQuery = {
        text: insertStatement,
        values: [sha256, jpegData],
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
        return {
            sha256 : null,
            error : err
        };
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

module.exports = {
    insertImage: insertImage,
    retrieveImage: retrieveImage,
    deleteImage: deleteImage
}