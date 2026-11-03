'use strict';

const atlas = document.getElementById('atlas');
const plateImage = document.getElementById('plate-art');
const plateButtons = [...atlas.querySelectorAll('[data-plate]')];
const inspectPlate = document.getElementById('inspect-plate');
const plateDialog = document.getElementById('plate-dialog');
const plateViewport = document.getElementById('plate-viewport');
const zoomButton = document.getElementById('plate-zoom');
const plates = {
  molecules: {
    number: '01', file: 'molecule', title: 'Signals at the membrane',
    alt: 'Copper-colored protein forms embedded in a fragment of a lipid membrane',
    question: 'What changes when dopamine and glutamate receptors interact?',
    note: 'This plate imagines two receptors in the same membrane. The related study tests how disrupting receptor interactions affects responses to cocaine and natural rewards.',
    landmarks: [
      { x: 27, y: 49, name: 'Membrane receptor', note: 'The copper ribbons stand in for a receptor that spans the cell membrane.' },
      { x: 81, y: 47, name: 'Lipid bilayer', note: 'The two rows of rounded heads mark the two surfaces of the membrane.' }
    ],
    doi: '10.1126/sciadv.abg5970' 
  },
  circuits: {
    number: '02', file: 'circuit', title: 'The Purkinje cell',
    alt: 'A pale, fan-shaped Purkinje cell arbor on a dark background',
    question: 'How does cerebellar activity relate to a learned movement?',
    note: 'The branching outline introduces the cerebellar circuitry behind this question. In LocoReach, we aligned cerebellar activity to individual reaches as mice learned a locomotor task.',
    landmarks: [
      { x: 68, y: 29, name: 'Dendritic arbor', note: 'Fine branches spread out in a fan, giving the cell a broad surface for synaptic inputs.' },
      { x: 50, y: 71, name: 'Cell body', note: 'The dendritic branches converge on the soma. The thin projection below is the axon.' }
    ],
    doi: '10.1038/s41467-026-74823-1' 
  },
  behavior: {
    number: '03', file: 'behavior', title: 'Anatomy of a reach',
    alt: 'A mouse in lavender linework reaches one forepaw toward a rung',
    question: 'Which moment in a reach best predicts cerebellar activity?',
    note: 'The forepaw is poised just before contact. In the LocoReach study, tracking the endpoint of each reach allowed us to relate this moment to activity in the cerebellum.',
    landmarks: [
      { x: 74, y: 49, name: 'Reaching forepaw', note: 'The forepaw extends toward the next support. The faint outlines suggest earlier positions.' },
      { x: 80, y: 55, name: 'Target rung', note: 'The rung gives the movement a spatial endpoint that can be tracked from video.' }
    ],
    doi: '10.1038/s41467-026-74823-1'
  }
};

function selectPlate(key) {
  if (atlas.dataset.palette === key) return;
  const plate = plates[key];
  atlas.dataset.palette = key;
  plateButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.plate === key)));
  document.getElementById('plate-number').textContent = 'PLATE ' + plate.number + ' / 03';
  document.getElementById('plate-name').textContent = plate.title;
  document.getElementById('plate-caption').textContent = plate.question;
  inspectPlate.setAttribute('aria-label', 'Inspect illustration: ' + plate.title);
  plateImage.classList.remove('refocus');
  plateImage.alt = plate.alt;
  plateImage.src = './assets/atlas-' + plate.file + '.webp';
}
plateImage.addEventListener('load', () => plateImage.classList.add('refocus'));
plateButtons.forEach((button, index) => {
  button.addEventListener('click', () => selectPlate(button.dataset.plate));
  button.addEventListener('keydown', event => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = plateButtons[(index + step + plateButtons.length) % plateButtons.length];
    next.focus();
    selectPlate(next.dataset.plate);
  });
});

function markLandmark(button, landmark) {
  document.querySelectorAll('#plate-pins button').forEach(pin => pin.setAttribute('aria-pressed', String(pin === button)));
  const label = document.createElement('strong');
  label.textContent = landmark.name + '. ';
  document.getElementById('landmark-note').replaceChildren(label, document.createTextNode(landmark.note));
}

function placeLandmarks(landmarks) {
  const pins = document.getElementById('plate-pins');
  pins.replaceChildren();
  landmarks.forEach((landmark, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(index + 1);
    button.title = landmark.name;
    button.setAttribute('aria-label', 'Landmark ' + (index + 1) + ': ' + landmark.name);
    button.setAttribute('aria-pressed', 'false');
    button.style.left = landmark.x + '%';
    button.style.top = landmark.y + '%';
    button.addEventListener('click', () => markLandmark(button, landmark));
    pins.append(button);
    if (index === 0) markLandmark(button, landmark);
  });
}

function setZoom(zoomed) {
  plateViewport.classList.toggle('is-zoomed', zoomed);
  zoomButton.setAttribute('aria-pressed', String(zoomed));
  zoomButton.textContent = zoomed ? 'Fit illustration' : 'Zoom in';
  plateViewport.scrollTo((plateViewport.scrollWidth - plateViewport.clientWidth) / 2, (plateViewport.scrollHeight - plateViewport.clientHeight) / 2);
}
inspectPlate.addEventListener('click', () => {
  const key = atlas.dataset.palette;
  const plate = plates[key];
  const detailImage = document.getElementById('detail-art');
  document.getElementById('detail-kicker').textContent = 'FIELD ATLAS / ' + plate.number + ' / ' + key.toUpperCase();
  document.getElementById('detail-name').textContent = plate.title;
  document.getElementById('detail-note').textContent = plate.note;
  document.getElementById('plate-study').href = 'https://doi.org/' + plate.doi;
  placeLandmarks(plate.landmarks);
  detailImage.src = plateImage.src;
  detailImage.alt = plate.alt;
  plateDialog.showModal();
  setZoom(false);
});
zoomButton.addEventListener('click', () => setZoom(!plateViewport.classList.contains('is-zoomed')));

const finder = document.getElementById('index-dialog');
const queryInput = document.getElementById('index-query');
const resultsList = document.getElementById('index-results');
const entries = [
  { kind: 'Section', name: 'Research questions', url: '#research' },
  { kind: 'Section', name: 'Publications', url: '#publications' },
  { kind: 'Section', name: 'Research software', url: '#software' },
  { kind: 'Section', name: 'About and teaching', url: '#about' },
  { kind: 'Section', name: 'Contact', url: '#contact' },
  { kind: 'File', name: 'Curriculum vitae (PDF)', url: './assets/Andry_Andrianarivelo_CV.pdf' },
  ...Object.entries(softwareDetails).map(([key, tool]) => ({
    kind: 'Software', name: tool.name, keywords: tool.category + ' ' + tool.summary, toolKey: key
  })),
  ...window.sitePublications.map(paper => ({
    kind: 'Paper', name: paper.title, keywords: paper.year + ' ' + paper.journal + ' ' + paper.authors,
    url: 'https://doi.org/' + paper.doi
  }))
];

function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function renderIndex() {
  const tokens = normalizeSearch(queryInput.value.trim()).split(/\s+/).filter(Boolean);
  const matches = tokens.length ? entries.filter(entry => {
    const words = normalizeSearch([entry.name, entry.kind, entry.keywords || ''].join(' '));
    return tokens.every(token => words.includes(token));
  }) : entries.slice(0, 6);
  resultsList.replaceChildren();
  resultsList.scrollTop = 0;
  document.getElementById('index-status').textContent = tokens.length
    ? (matches.length ? matches.length + (matches.length === 1 ? ' result' : ' results') : 'No matches. Try a title, year or tool name.')
    : 'Jump to a section or search the full site';
  matches.forEach(entry => {
    const line = document.createElement('li');
    const action = document.createElement(entry.toolKey ? 'button' : 'a');
    if (entry.toolKey) {
      action.type = 'button';
      action.addEventListener('click', () => {
        finder.close();
        document.querySelector('[data-tool="' + entry.toolKey + '"]').click();
      });
    } else {
      action.href = entry.url;
      if (entry.kind === 'Paper') {
        action.target = '_blank';
        action.rel = 'noopener noreferrer';
      }
      action.addEventListener('click', () => finder.close());
    }
    const kind = document.createElement('small');
    kind.textContent = entry.kind;
    const label = document.createElement('span');
    label.textContent = entry.name;
    action.append(kind, label);
    line.append(action);
    resultsList.append(line);
  });
}
function openIndex() {
  queryInput.value = '';
  renderIndex();
  finder.showModal();
  queryInput.focus();
}
document.querySelector('.index-launch').addEventListener('click', openIndex);
queryInput.addEventListener('input', renderIndex);
finder.addEventListener('keydown', event => {
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  const actions = [...resultsList.querySelectorAll('a, button')];
  if (!actions.length) return;
  event.preventDefault();
  const index = actions.indexOf(document.activeElement);
  const next = event.key === 'ArrowDown' ? (index + 1) % actions.length : (index <= 0 ? actions.length - 1 : index - 1);
  actions[next].focus();
});
document.addEventListener('keydown', event => {
  if (event.key !== '/' || event.ctrlKey || event.altKey || event.metaKey || document.querySelector('dialog[open]')) return;
  if (event.target.closest('input, textarea, select, [contenteditable=true]')) return;
  event.preventDefault();
  openIndex();
});
[plateDialog, finder].forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
});

if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const reveal = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).forEach(entry => {
      entry.target.classList.add('in-view');
      reveal.unobserve(entry.target);
    });
  }, { threshold: .12 });
  document.querySelectorAll('.section-heading, .research-item, .software-card').forEach(item => reveal.observe(item));
}
