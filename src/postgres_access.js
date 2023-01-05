const crypto = require('crypto');
const { Client } = require('pg');
const fs = require('fs');

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
    const client = new Client(connectionObj);
    await client.connect();

    const hash = crypto.createHash('sha256');
    hash.update(imageData);
    const sha256 = hash.digest('hex');

    const sqlQuery = {
        text: insertStatement,
        values: [sha256, imageData],
    };
    try {
        await client.query(sqlQuery);
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

module.exports = {
    insertImage: insertImage,
    retrieveImage: retrieveImage
}