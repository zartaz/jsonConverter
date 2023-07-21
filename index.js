const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Transform } = require('json2csv');
const js2xmlparser = require('js2xmlparser');
const JSONStream = require('JSONStream');
const nanoid = require('nanoid').nanoid;
const PORT = 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
        <h1>JSON to CSV/XML Converter by Zartas </h1>
        <p>Enter a JSON URL, bearer token (if required), and select a format to convert the JSON to.</p>
        <p style="color: red;">Αυτο το εργαλειο μπορει να χρησιμοποιηθει μονο απο ενα χρηστη την φορα , θα πρεπει να ρυθμιστει ο web server επισης να περιμενει to processing</p>
        <form action="/convert" method="POST">
            <label for="jsonUrl">JSON URL:</label><br>
            <input type="text" id="jsonUrl" name="jsonUrl" style="width: 100%;"><br>
            <label for="bearerToken">Bearer Token (optional):</label><br>
            <input type="text" id="bearerToken" name="bearerToken" style="width: 100%;"><br>
            <input type="radio" id="csv" name="format" value="csv">
            <label for="csv">CSV</label><br>
            <input type="radio" id="xml" name="format" value="xml">
            <label for="xml">XML</label><br>
            <input type="submit" value="Submit">
        </form>
    `);
});

app.post('/convert', (req, res) => {
    try {
        const config = {};
        if (req.body.bearerToken) {
            config.headers = { Authorization: `Bearer ${req.body.bearerToken}` };
        }

        let output;
        let filename;
        let parser;

        if (req.body.format === 'csv') {
            parser = new Transform();
            filename = 'output.csv';
        } else if (req.body.format === 'xml') {
            parser = JSONStream.parse('*');
            output = new Transform({
                transform: (data) => js2xmlparser.parse("item", data)
            });
            filename = 'output.xml';
        }

        // Create a unique directory for this request
        const dir = path.join('.', nanoid());
        fs.mkdirSync(dir);

        // Create a write stream for the file in the new directory
        const writeStream = fs.createWriteStream(path.join(dir, filename));

        // Create the request 
        let requester = req.body.jsonUrl.startsWith('https') ? https : http;
        requester.get(req.body.jsonUrl, config, (response) => {
            response
            .pipe(parser)
            .pipe(output)
            .pipe(writeStream)
            .on('finish', () => res.download(path.join(dir, filename)));
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred.');
    }
});


app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
