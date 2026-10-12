const $ = s => document.querySelector(s);
const state = { offset: 0, recipes: new Map() };

// ---- filters -------------------------------------------------------------
const pills = [...document.querySelectorAll('.pill[data-diet], .pill[data-intol]')];
const checks = [...document.querySelectorAll('#panel input')];

function activeFilters() {
  const on = pills.filter(p => p.getAttribute('aria-pressed') === 'true');
  const diet = on.map(p => p.dataset.diet).filter(Boolean);
  const intol = on.map(p => p.dataset.intol).filter(Boolean)
    .concat(checks.filter(c => c.checked).map(c => c.value));
  return { diet: diet.join(','), intolerances: intol.join(',') };
}

pills.forEach(p => p.addEventListener('click', () => {
  p.setAttribute('aria-pressed', p.getAttribute('aria-pressed') !== 'true');
  if (!document.body.classList.contains('home')) search();
}));
checks.forEach(c => c.addEventListener('change', () => {
  if (!document.body.classList.contains('home')) search();
}));

const moreBtn = $('#moreBtn'), panel = $('#panel');
moreBtn.addEventListener('click', e => {
  e.stopPropagation();
  panel.hidden = !panel.hidden;
  moreBtn.setAttribute('aria-expanded', !panel.hidden);
});
document.addEventListener('click', e => {
  if (!panel.hidden && !panel.contains(e.target)) { panel.hidden = true; moreBtn.setAttribute('aria-expanded', false); }
});

// ---- search --------------------------------------------------------------
$('#search').addEventListener('submit', e => { e.preventDefault(); search(); });
$('#loadMore').addEventListener('click', () => search(true));

async function search(append = false) {
  if (!append) { state.offset = 0; $('#grid').replaceChildren(); }
  document.body.classList.remove('home');
  $('#results').hidden = false;
  $('#msg').textContent = 'Loading recipes…';
  $('#loadMore').hidden = true;

  const { diet, intolerances } = activeFilters();
  const params = new URLSearchParams({ query: $('#q').value.trim(), diet, intolerances, offset: state.offset });
  try {
    const res = await fetch('/api/search?' + params);
    const data = await res.json().catch(() => {
      throw new Error('Unable to read API');
    });
    if (!res.ok) throw new Error(res.status === 402 ? 'Daily Spoonacular limit reached. Try again tomorrow.' : data.message || 'Search failed.');
    data.results.forEach(r => { state.recipes.set(r.id, r); $('#grid').append(card(r)); });
    state.offset += data.results.length;
    $('#count').textContent = `Results: ${data.totalResults}`;
    $('#msg').textContent = data.totalResults ? '' : 'No recipes match. Try a different search or fewer filters.';
    $('#loadMore').hidden = state.offset >= data.totalResults;
  } catch (err) {
    $('#msg').textContent = err.message;
  }
}

const calories = r => Math.round(r.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount ?? 0);
const meta = r => `${r.readyInMinutes} min | Serves ${r.servings} | ${calories(r)} calories`;

function card(r) {
  const b = document.createElement('button');
  b.className = 'card';
  b.innerHTML = '<img alt=""><div><h2></h2><p></p></div>';
  b.querySelector('img').src = r.image;
  b.querySelector('h2').textContent = r.title;
  b.querySelector('p').textContent = meta(r);
  b.addEventListener('click', () => openModal(r.id));
  return b;
}

// ---- recipe preview ------------------------------------------------------
const modal = $('#modal');
let lastFocus;

function fill(list, items) {
  list.replaceChildren(...items.map(t => Object.assign(document.createElement('li'), { textContent: t })));
}

function openModal(id) {
  const r = state.recipes.get(id);
  lastFocus = document.activeElement;
  $('#mImg').src = r.image;
  $('#mTitle').textContent = r.title;
  $('#mMeta').textContent = meta(r);

  const ing = r.extendedIngredients?.map(i => i.original)
    ?? r.nutrition?.ingredients?.map(i => `${i.amount} ${i.unit} ${i.name}`) ?? [];
  fill($('#mIng'), ing);

  const steps = r.analyzedInstructions?.flatMap(g => g.steps.map(s => s.step)) ?? [];
  fill($('#mSteps'), steps.length ? steps : ['No instructions available for this recipe.']);

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#mClose').focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
  lastFocus?.focus();
}
$('#mClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
