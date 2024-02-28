const express = require('express');
const mongoose = require('mongoose');
const nanoid = require('nanoid');
const validUrl = require('valid-url');
const app = express();

require("dotenv").config()

mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const UrlSchema = new mongoose.Schema({
    originalUrl: String,
    shortCode: String,
});

const UrlModel = mongoose.model('Url', UrlSchema);

app.use(express.json());

app.post('/api/shorten', async (req, res) => {
    try {
        const { originalUrl } = req.body;

        if (!validUrl.isUri(originalUrl)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        const existingUrl = await UrlModel.findOne({ originalUrl });
        if (existingUrl) {
            return res.json({ shortUrl: `${process.env.DOMAIN_NAME}/${existingUrl.shortCode}` });
        }

        let shortCode;
        do {
            shortCode = nanoid(6);
        } while (await UrlModel.findOne({ shortCode }));

        const url = new UrlModel({ originalUrl, shortCode });
        await url.save();
        res.json({ shortUrl: `${process.env.DOMAIN_NAME}/${shortCode}` });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        const url = await UrlModel.findOne({ shortCode });
        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }
        res.redirect(url.originalUrl);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
