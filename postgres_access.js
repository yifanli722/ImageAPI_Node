const crypto = require('crypto');
const { Client } = require('pg');
const fs = require('fs');

const insertStatement = fs.readFileSync('./Postgres_Scripts/Insert_Image.sql', 'utf8');
const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'yfoo',
    password: 'yfoo',
    database: 'yfoo',
});

async function insertImage(imageData) {
    await client.connect((err) => {
        if (err) {
            return {
                result : false,
                error : err
            };
        }
    });

    const hash = crypto.createHash('sha256');
    hash.update(imageData);
    const sha256 = hash.digest('hex');

    const query = {
        text: insertStatement,
        values: [sha256, imageData],
    };
    await client.query(query, (err, res) => {
        if (err) {
            return (false, err);
        }
        console.log(res);
        client.end();
    });

    return {
        result : true,
        sha256 : sha256,
        error : null
    };
}

module.exports = {
    insertImage: insertImage
}