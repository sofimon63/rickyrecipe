require('dotenv').config();
const path = require('path');
const express = require('express');

const KEY = process.env.SPOONACULAR_API_KEY;
if (!KEY) {
  console.error('Missing SPOONACULAR_API_KEY. Copy .env.example to .env and add your key.');
  process.exit(1);
}

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// The browser calls /api/search; only this server ever sees the key.
app.get('/api/search', async (req, res) => {
  const { query = '', diet = '', intolerances = '', offset = '0' } = req.query;
  const params = new URLSearchParams({
    apiKey: KEY,
    query: String(query).slice(0, 100),
    number: 9,
    offset: Math.max(0, Number(offset) || 0),
    addRecipeInformation: true,
    addRecipeNutrition: true,
    instructionsRequired: true,
  });
  if (diet) params.set('diet', String(diet));
  if (intolerances) params.set('intolerances', String(intolerances));

  try {
    const r = await fetch('https://api.spoonacular.com/recipes/complexSearch?' + params);
    res.status(r.status).json(await r.json());
  } catch {
    res.status(502).json({ message: 'Could not reach Spoonacular.' });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`RickyRecipe running at http://localhost:${process.env.PORT || 3000}`)
);
