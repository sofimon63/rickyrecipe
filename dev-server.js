// Local testing only: npm start, then open http://localhost:3000
require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/search', require('./api/search'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`RickyRecipe running at http://localhost:${port}`));
