const crypto = require('crypto');
const { Client } = require('pg');
const fs = require('fs');
const sharp = require('sharp');

const initilizePostgresStatement = fs.readFileSync('./Postgres_Scripts/Create_Table.sql', 'utf-8')
const insertStatement = fs.readFileSync('./Postgres_Scripts/Insert_Image.sql', 'utf8');
const retrieveStatement = fs.readFileSync('./Postgres_Scripts/Retrieve_Image.sql', 'utf8');

require('dotenv').config();
const connectionObj = {
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || "yfoo",
    password: process.env.POSTGRES_PASSWORD || "yfoo",
    database: process.env.POSTGRES_DATABASE || "yfoo",
}

async function InitilizePostgres() {
    const client = new Client(connectionObj);
    await client.connect();
    const sqlQuery = {
        text: initilizePostgresStatement
    }
    const result = await client.query(sqlQuery);
    console.log("init postgres")
}

async function insertMedia(mediaData) {
    if(GetWebMediaType(mediaData) === "video/webm") {
        var dataToInsert = mediaData;
    } else {
        try {
            var dataToInsert = await sharp(mediaData).webp().toBuffer();
        } catch (err) {
            return {
                sha256 : null,
                error : err
            };
        }
    }
    const client = new Client(connectionObj);
    await client.connect();

    const hasher = crypto.createHash('sha256');
    hasher.update(dataToInsert);
    const sha256 = hasher.digest('hex');

    const sqlQuery = {
        text: insertStatement,
        values: [sha256, dataToInsert],
    };
    try {
        const result = await client.query(sqlQuery);
        if (result.rowCount > 0) {
            console.log(`Inserted: ${sha256}`);
        } else {
            console.log(`${sha256} already exists`);
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

async function retrieveMedia(sha256) {
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
                error: `media file of sha256: ${sha256} was not found`,
                returnCode: 404
            }; 
        }

        let mediaData = result.rows[0].img_data
        if(mediaData.length > 0) {
            return {
                success: true,
                mediaData: mediaData,
                type: GetWebMediaType(mediaData)
            };
        } else {
            return {
                success: false,
                error: `media file of sha256: ${sha256} is empty`,
                returnCode: 500
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

function GetWebMediaType(mediaData) {
    const webmHeader = new Uint8Array([26, 69, 223, 163])
    let isWebm = true;
    for(let i = 0; i < 4; i++) {
        if(mediaData[i] !== webmHeader[i]){
            isWebm = false;
            break;
        }
    }
    if(isWebm) {
        return "video/webm";
    }

    const webpHeader = new Uint8Array([82, 73, 70, 70, null, null, null, null, 87, 69, 66, 80]);
    let isWebp = true;
    for(let i = 0; i < 12; i++) {
        if(i > 3 && i < 8) {
            continue
        } else if(mediaData[i] !== webpHeader[i]){
            isWebp = false;
            break;
        }
        
    }
    return isWebp ? "image/webp" : "Unknown";
}

module.exports = {
    insertMedia: insertMedia,
    retrieveMedia: retrieveMedia,
    deleteImage: deleteImage,
    InitilizePostgres: InitilizePostgres
}