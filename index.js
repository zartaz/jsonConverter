const express = require('express');
const axios = require('axios');
const { Parser } = require('json2csv');
const js2xmlparser = require('js2xmlparser');
const fs = require('fs').promises;
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

app.post('/convert', async (req, res) => {
    try {
        const config = {};
        if (req.body.bearerToken) {
            config.headers = { Authorization: `Bearer ${req.body.bearerToken}` };
        }

        const jsonData = await axios.get(req.body.jsonUrl, config);
        let output;
        let filename;

        if (req.body.format === 'csv') {
            const parser = new Parser();
            output = parser.parse(jsonData.data);
            filename = 'output.csv';
        } else if (req.body.format === 'xml') {
            output = js2xmlparser.parse("root", jsonData.data);
            filename = 'output.xml';
        }

        await fs.writeFile(filename, output);

        res.download(filename);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred.');
    }
});


app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
