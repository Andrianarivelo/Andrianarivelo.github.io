'use strict';

(() => {
  const get = id => document.getElementById(id);
  const bench = get('methods-bench');
  const tabs = [...bench.querySelectorAll('[role=tab]')];
  const slider = get('reach-progress');
  const play = get('reach-play');
  const jumps = [...bench.querySelectorAll('[data-frame]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let reachFrame = 0;

  function showReach(value) {
    const t = value / 100;
    const x = 101 + 398 * t;
    const y = 180 - 500 * t * (1 - t);
    const phase = value === 0 ? 'Lift-off' : value === 100 ? 'Contact' : value === 50 ? 'Peak height' : value < 50 ? 'Rising' : 'Descending';
    slider.value = value;
    slider.setAttribute('aria-valuetext', value + ' percent, ' + phase);
    get('reach-readout').textContent = value + '% · ' + phase;
    get('reach-point').setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    // The first segment of the same quadratic ends exactly at the moving marker.
    get('reach-trail').setAttribute('d', 'M101 180 Q' + (101 + 199 * t) + ' ' + (180 - 250 * t) + ' ' + x + ' ' + y);
    jumps.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.frame) === value)));
    play.textContent = reachFrame ? 'Pause' : value === 100 ? 'Replay' : value === 0 ? 'Play reach' : 'Resume';
  }
  function stopReach() {
    cancelAnimationFrame(reachFrame);
    reachFrame = 0;
    showReach(slider.valueAsNumber);
  }
  play.addEventListener('click', () => {
    if (reachFrame) { stopReach(); return; }
    const initial = slider.valueAsNumber === 100 ? 0 : slider.valueAsNumber;
    const start = performance.now();
    function tick(now) {
      const value = Math.min(100, initial + Math.floor((now - start) / 34));
      if (value === 100) reachFrame = 0;
      showReach(value);
      if (value < 100) reachFrame = requestAnimationFrame(tick);
    }
    reachFrame = requestAnimationFrame(tick);
    showReach(initial);
  });
  slider.addEventListener('input', stopReach);
  jumps.forEach(button => button.addEventListener('click', () => {
    stopReach();
    showReach(Number(button.dataset.frame));
  }));
  get('reach-trail').removeAttribute('stroke-dasharray');
  showReach(0);

  const svgNS = 'http://www.w3.org/2000/svg';
  function svgItem(parent, name, attributes) {
    const element = document.createElementNS(svgNS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    parent.append(element);
    return element;
  }
  const onsets = [.78, 1.08, 1.45, 1.84, 2.16, 2.52];
  const traces = onsets.map(() => svgItem(get('signal-traces'), 'path', {class: 'trial-trace'}));
  const marks = onsets.map(() => svgItem(get('signal-events'), 'line', {class: 'event-mark', y1: 165, y2: 176}));
  const mean = svgItem(get('signal-traces'), 'path', {class: 'mean-trace'});
  const axisLabels = Array.from({length: 5}, (unused, i) =>
    svgItem(get('signal-axis'), 'text', {x: 48 + i * 129.5, y: 198, 'text-anchor': 'middle'}));
  const axisTitle = svgItem(get('signal-axis'), 'text', {x: 307, y: 225, 'text-anchor': 'middle'});
  const referenceButtons = [...bench.querySelectorAll('[data-reference]')];
  let alignment = 0;
  let alignmentFrame = 0;
  let targetAlignment = 0;

  function fluorescence(time, trial) {
    const delay = time - onsets[trial];
    const peakTime = .29 + .025 * Math.sin(trial);
    const response = delay > 0 ? delay / peakTime * Math.exp(1 - delay / peakTime) : 0;
    const baseline = .035 * Math.sin(time * 8 + trial) + .017 * Math.cos(time * 19 - trial);
    return baseline + (.83 + .09 * Math.cos(trial)) * response;
  }
  function drawSignals(fraction) {
    alignment = fraction;
    const samples = 140;
    const paths = onsets.map(() => []);
    const average = [];
    for (let i = 0; i <= samples; i++) {
      const x = (48 + 518 * i / samples).toFixed(1);
      const prefix = (i ? 'L' : 'M') + x + ' ';
      let sum = 0;
      onsets.forEach((onset, trial) => {
        const time = 4 * i / samples + fraction * (onset - 2);
        const value = fluorescence(time, trial);
        sum += value;
        paths[trial].push(prefix + (150 - 108 * value).toFixed(1));
      });
      average.push(prefix + (150 - 108 * sum / onsets.length).toFixed(1));
    }
    traces.forEach((line, trial) => {
      line.setAttribute('d', paths[trial].join(''));
      const eventX = 48 + 518 * ((1 - fraction) * onsets[trial] + fraction * 2) / 4;
      marks[trial].setAttribute('x1', eventX);
      marks[trial].setAttribute('x2', eventX);
    });
    mean.setAttribute('d', average.join(''));
  }
  function setReference(aligned, animate) {
    cancelAnimationFrame(alignmentFrame);
    alignmentFrame = 0;
    targetAlignment = Number(aligned);
    referenceButtons.forEach(button => button.setAttribute('aria-pressed', String((button.dataset.reference === 'reach') === aligned)));
    axisLabels.forEach((label, i) => { label.textContent = i - 2 * targetAlignment; });
    axisTitle.textContent = aligned ? 'Time from reach onset (s)' : 'Time from trial start (s)';
    get('signal-plot-title').textContent = 'Six simulated fluorescence traces. ' + axisTitle.textContent;
    get('signal-note').textContent = aligned
      ? 'All six reach markers now coincide at zero. The mean preserves the transient that follows each reach.'
      : 'The six reaches occur at different times after trial start. The ticks mark each reach.';
    if (!animate || reducedMotion.matches || alignment === targetAlignment) {
      drawSignals(targetAlignment);
      return;
    }
    const initial = alignment;
    const start = performance.now();
    function tick(now) {
      const elapsed = Math.min(1, (now - start) / 460);
      const eased = elapsed * elapsed * (3 - 2 * elapsed);
      drawSignals(initial + (targetAlignment - initial) * eased);
      alignmentFrame = elapsed < 1 ? requestAnimationFrame(tick) : 0;
    }
    alignmentFrame = requestAnimationFrame(tick);
  }
  referenceButtons.forEach(button => button.addEventListener('click', () => setReference(button.dataset.reference === 'reach', true)));
  get('mean-toggle').addEventListener('click', event => {
    const visible = event.currentTarget.getAttribute('aria-pressed') !== 'true';
    event.currentTarget.setAttribute('aria-pressed', String(visible));
    mean.style.display = visible ? '' : 'none';
  });
  setReference(false, false);

  function showPanel(tab) {
    const activePanel = tab.getAttribute('aria-controls');
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      get(item.getAttribute('aria-controls')).hidden = !selected;
    });
    if (activePanel !== 'reach-replay') stopReach();
    if (activePanel !== 'signal-alignment' && alignmentFrame) setReference(Boolean(targetAlignment), false);
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => showPanel(tab));
    tab.addEventListener('keydown', event => {
      const keys = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!Object.hasOwn(keys, event.key)) return;
      event.preventDefault();
      const next = tabs[keys[event.key]];
      showPanel(next);
      next.focus();
    });
  });
  bench.hidden = false;
  function openLinkedPanel() {
    const tab = tabs.find(item => '#' + item.getAttribute('aria-controls') === location.hash);
    if (!tab) return;
    showPanel(tab);
    get('playground').scrollIntoView({behavior: 'instant'});
  }
  window.addEventListener('hashchange', openLinkedPanel);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash === location.hash) openLinkedPanel();
  });
  openLinkedPanel();

  const tour = get('atlas-tour');
  const tourOrder = ['molecules', 'circuits', 'behavior'];
  let tourTimer = 0;
  function stopTour() {
    clearTimeout(tourTimer);
    tourTimer = 0;
    tour.textContent = 'Play tour';
    tour.setAttribute('aria-pressed', 'false');
    atlas.classList.remove('tour-running');
  }
  function visitPlate(index) {
    selectPlate(tourOrder[index]);
    tourTimer = setTimeout(() => {
      if (index + 1 === tourOrder.length) stopTour();
      else visitPlate(index + 1);
    }, 4200);
  }
  tour.hidden = false;
  stopTour();
  tour.addEventListener('click', () => {
    if (tourTimer) { stopTour(); return; }
    tour.textContent = 'Stop tour';
    tour.setAttribute('aria-pressed', 'true');
    atlas.classList.add('tour-running');
    visitPlate(0);
  });
  atlas.querySelector('.atlas-tabs').addEventListener('click', stopTour);
  atlas.querySelector('.atlas-tabs').addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') stopTour();
  });
  inspectPlate.addEventListener('click', stopTour);
  function suspendMotion() {
    stopReach();
    stopTour();
    if (alignmentFrame) setReference(Boolean(targetAlignment), false);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) suspendMotion(); });
  reducedMotion.addEventListener('change', suspendMotion);
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(items => items.forEach(item => {
      if (item.isIntersecting) return;
      if (item.target === atlas) stopTour();
      else stopReach();
    }));
    visibility.observe(atlas);
    visibility.observe(bench);
  }
})();
