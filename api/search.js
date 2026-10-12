// Runs as a Vercel serverless function at /api/search (and locally via dev-server.js).
// The API key is read from an environment variable and never reaches the browser.
module.exports = async (req, res) => {
  const KEY = process.env.SPOONACULAR_API_KEY;
  if (!KEY) return res.status(500).json({ message: 'Server is missing SPOONACULAR_API_KEY.' });

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
};
