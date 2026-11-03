'use strict';

const publicationList = document.querySelector('#publication-list');
const publicationSearch = document.querySelector('#publication-search');
const morePublications = document.querySelector('#more-publications');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
let activeFilter = 'all';
let showAllPublications = false;
const publicationYear = document.querySelector('#publication-year');
[...new Set(window.sitePublications.map(paper => paper.year))].sort((a,b) => b-a).forEach(year => {
  const option = document.createElement('option'); option.value = String(year); option.textContent = year; publicationYear.append(option);
});
publicationYear.addEventListener('change', renderPublications);

function renderPublications() {
  const query = publicationSearch.value.trim().toLocaleLowerCase();
  const matches = window.sitePublications.filter(paper => {
    const kindMatches = activeFilter === 'all' || (activeFilter === 'review' ? paper.kind !== 'original' : paper.kind === 'original');
    return kindMatches && (publicationYear.value === 'all' || String(paper.year) === publicationYear.value) && `${paper.title} ${paper.authors} ${paper.journal} ${paper.year}`.toLocaleLowerCase().includes(query);
  });
  const visible = showAllPublications || query || activeFilter !== 'all' ? matches : matches.slice(0, 5);
  publicationList.replaceChildren();
  visible.forEach(paper => {
    const row = document.createElement('article');
    row.className = 'publication';
    const year = document.createElement('span');
    year.className = 'publication-year';
    year.textContent = paper.year;
    const body = document.createElement('div');
    const title = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.className = 'publication-title-link';
    titleLink.href = `https://doi.org/${paper.doi}`;
    titleLink.target = '_blank'; titleLink.rel = 'noopener noreferrer';
    titleLink.textContent = paper.title;
    title.append(titleLink);
    const authors = document.createElement('p');
    authors.className = 'authors';
    const authorParts = paper.authors.split('Andrianarivelo A');
    authorParts.forEach((part, index) => {
      if (index > 0) {
        const emphasis = document.createElement('strong');
        emphasis.textContent = 'Andrianarivelo A';
        authors.append(emphasis);
      }
      authors.append(document.createTextNode(part));
    });
    const metadata = document.createElement('div');
    metadata.className = 'publication-meta';
    metadata.textContent = `${paper.journal} · ${paper.citation}`;
    const kind = document.createElement('span');
    kind.className = 'publication-kind';
    kind.textContent = paper.kind === 'original' ? 'Original research' : paper.kind === 'chapter' ? 'Book chapter' : 'Review';
    metadata.append(kind);
    const actions = document.createElement('div'); actions.className = 'publication-actions';
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'citation-copy'; copy.textContent = 'Copy citation';
    copy.setAttribute('aria-label', `Copy citation: ${paper.title}`);
    copy.addEventListener('click', () => copyCitation(`${paper.authors} (${paper.year}). ${paper.title}. ${paper.journal}, ${paper.citation}. https://doi.org/${paper.doi}`));
    const doiLink = document.createElement('a'); doiLink.href = titleLink.href; doiLink.className = 'publication-doi'; doiLink.target = '_blank'; doiLink.rel = 'noopener noreferrer'; doiLink.textContent = 'DOI ↗'; doiLink.setAttribute('aria-label', `Open DOI: ${paper.title}`);
    actions.append(copy,doiLink);
    body.append(title, authors, metadata,actions);
    const arrow = document.createElement('span');
    arrow.className = 'publication-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    row.append(year, body, arrow);
    publicationList.append(row);
  });
  if (matches.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No publications match your search.';
    publicationList.append(empty);
  }
  morePublications.hidden = showAllPublications || query.length > 0 || activeFilter !== 'all' || matches.length <= 5;
  document.querySelector('#publication-count').textContent = `${visible.length} of ${matches.length} publications shown.`;
}

filterButtons.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filterButtons.forEach(filter => {
    const selected = filter === button;
    filter.classList.toggle('active', selected);
    filter.setAttribute('aria-pressed', String(selected));
  });
  renderPublications();
}));
publicationSearch.addEventListener('input', renderPublications);
morePublications.addEventListener('click', () => {
  showAllPublications = true;
  renderPublications();
});
renderPublications();

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(expanded));
  navigation.classList.toggle('is-open', expanded);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuToggle.focus();
  }
});

const infoDialog = document.querySelector('#info-dialog');
document.querySelector('#site-info').addEventListener('click', () => infoDialog.showModal());
infoDialog.querySelector('.dialog-close').addEventListener('click', () => infoDialog.close());
infoDialog.addEventListener('click', event => { if (event.target === infoDialog) infoDialog.close(); });
document.querySelector('#year').textContent = new Date().getFullYear();

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navigation.querySelectorAll('a').forEach(link => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('current', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-15% 0px -65% 0px', threshold: 0});
  document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
}

let toastTimer;
function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message; toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
}
async function copyCitation(text) {
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    showToast('Citation copied to clipboard.');
  } catch {
    const field = document.createElement('textarea');
    field.value = text; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field); field.select();
    const copied = document.execCommand('copy'); field.remove();
    showToast(copied ? 'Citation copied to clipboard.' : 'Copy is unavailable in this browser. Use the DOI link.');
  }
}

const scaleText = {
  molecules: ['MOLECULES', 'How receptor interactions shape neuronal signaling and plasticity.'],
  circuits: ['CIRCUITS', 'How cerebellar activity relates to learning, reward and motivation.'],
  behavior: ['BEHAVIOR', 'How experience changes movement and motivated behavior.']
};
document.querySelectorAll('[data-scale]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-scale]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  const [label, description] = scaleText[button.dataset.scale];
  const target = document.querySelector('#scale-description');
  const span = document.createElement('span'); span.textContent = label;
  target.replaceChildren(span,document.createTextNode(description));
}));

const stage = document.querySelector('.neural-stage');
if (window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
  stage.addEventListener('pointermove', event => {
    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty('--art-x', `${(event.clientX - bounds.left - bounds.width / 2) * .012}px`);
    stage.style.setProperty('--art-y', `${(event.clientY - bounds.top - bounds.height / 2) * .025}px`);
  });
  stage.addEventListener('pointerleave', () => { stage.style.setProperty('--art-x','0px'); stage.style.setProperty('--art-y','0px'); });
}

const figureDialog = document.querySelector('#figure-dialog');
document.querySelector('#figure-open').addEventListener('click', () => figureDialog.showModal());
const softwareDetails = {
  neuropyguin: {name:'NeuroPyGuiN',category:'NEUROPIXELS / ELECTROPHYSIOLOGY',summary:'An integrated desktop workflow for turning electrophysiology recordings into curated, anatomically localized units.',features:['Preprocess recordings and run spike sorting.','Review quality metrics and curate units.','Explore activity and align probe locations to brain anatomy.'],status:'Public repository. See its documentation for installation and platform requirements.',url:'https://github.com/BelloneLab/NeuroPyGuiN',action:'Explore repository'},
  pyber: {name:'pyBer',category:'FIBER PHOTOMETRY',summary:'A visual and scriptable pipeline for processing fiber-photometry recordings and relating signals to behavior.',features:['Review artifacts, baseline estimation and reference correction.','Align neural signals to events and behavior.','Explore PSTHs, temporal models and reproducible exports.'],status:'Public repository. GUI and command-line workflows share the same processing backend.',url:'https://github.com/BelloneLab/pyBer',action:'Explore repository'},
  mamir: {name:'MAMIR',category:'MULTI-ANIMAL MASKING, IDENTIFICATION AND REVIEW',summary:'An integrated workflow for reviewing animal masks, identities, pose and behavior in recorded video.',features:['Review multi-animal segmentation and identity.','Work with pose and behavioral annotations.','Move between a desktop studio and automation workflows.'],status:'Private beta. Access to the application and releases requires repository permission.',url:'https://bellonelab.github.io/MAMIR-download/',action:'View access and download information'},
  nemir: {name:'NEMIR',category:'RESEARCH SOFTWARE',summary:'NEMIR is a research software project. Its public project description is being prepared.',features:[],status:'For project information and availability, please get in touch.',url:'mailto:andry.andrianarivelo@u-paris.fr?subject=NEMIR%20project',action:'Ask about NEMIR'}
};
const toolDialog = document.querySelector('#tool-dialog');
document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.tool; const tool = softwareDetails[key];
  const target = document.querySelector('#tool-detail'); target.replaceChildren();
  const heading = document.createElement('div'); heading.className = 'tool-detail-heading';
  const logo = document.createElement('img'); logo.src = `./assets/${key}-logo.png`; logo.alt = `${tool.name} logo`;
  const intro = document.createElement('div'); const category = document.createElement('p'); category.className = 'eyebrow'; category.textContent = tool.category;
  const title = document.createElement('h2'); title.id = 'tool-title'; title.textContent = tool.name; intro.append(category,title); heading.append(logo,intro);
  const summary = document.createElement('p'); summary.className = 'tool-summary'; summary.textContent = tool.summary;
  target.append(heading,summary);
  if (tool.features.length) {
    const list = document.createElement('ul'); list.className = 'tool-features';
    tool.features.forEach(feature => { const item = document.createElement('li'); item.textContent = feature; list.append(item); }); target.append(list);
  }
  const status = document.createElement('p'); status.className = 'tool-status'; status.textContent = tool.status;
  const link = document.createElement('a'); link.className = 'button primary'; link.href = tool.url; link.textContent = `${tool.action} ↗`;
  if (tool.url.startsWith('https:')) {link.target = '_blank';link.rel = 'noopener noreferrer';}
  target.append(status,link); toolDialog.showModal();
}));
[figureDialog,toolDialog].forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {if (event.target === dialog) dialog.close();});
});

const researchDetails = [
  {text:'Combining quantitative paw kinematics with cerebellar recordings to study locomotor learning.',query:'cerebellar'},
  {text:'Investigating how cerebellar pathways connect with reward circuitry and motivated behavior.',query:'reward'},
  {text:'Using molecular and behavioral approaches to study interactions between dopamine and glutamate signaling.',query:'cocaine'}
];
document.querySelectorAll('.research-item').forEach((item,index) => {
  const detail = researchDetails[index];
  const disclosure = document.createElement('details');
  const summary = document.createElement('summary'); summary.textContent = 'Explore the approach';
  const paragraph = document.createElement('p'); paragraph.textContent = detail.text;
  const link = document.createElement('a'); link.href = '#publications'; link.textContent = 'Explore related publications →';
  link.addEventListener('click', () => {
    activeFilter = 'all'; publicationYear.value = 'all'; publicationSearch.value = detail.query;
    filterButtons.forEach(button => {button.classList.toggle('active',button.dataset.filter === 'all');button.setAttribute('aria-pressed',String(button.dataset.filter === 'all'));});
    renderPublications();
  });
  disclosure.append(summary,paragraph,link); item.append(disclosure);
});
const progress = document.querySelector('.reading-progress');
const topButton = document.querySelector('.back-to-top');
function updateReadingProgress() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
  topButton.hidden = window.scrollY < 600;
}
window.addEventListener('scroll',updateReadingProgress,{passive:true});
window.addEventListener('resize',updateReadingProgress);
topButton.addEventListener('click', () => window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
updateReadingProgress();
