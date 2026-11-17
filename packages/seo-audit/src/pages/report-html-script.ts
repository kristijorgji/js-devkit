export const REPORT_CSS = `
:root {
  color-scheme: light dark;
  --bg: #f9fafb;
  --fg: #111827;
  --muted: #6b7280;
  --card: #ffffff;
  --border: #e5e7eb;
  --accent: #2563eb;
  --row-hover: #f3f4f6;
  --error: #ef4444;
  --error-bg: #fee2e2;
  --error-fg: #991b1b;
  --warn: #f59e0b;
  --warn-bg: #fef3c7;
  --warn-fg: #92400e;
  --info: #3b82f6;
  --info-bg: #dbeafe;
  --info-fg: #1e40af;
  --ok-bg: #d1fae5;
  --ok-fg: #065f46;
  --heat-mid: #fecaca;
  --heat-high: #ef4444;
  --heat-high-fg: #fff;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111827;
    --fg: #f3f4f6;
    --muted: #9ca3af;
    --card: #1f2937;
    --border: #374151;
    --accent: #60a5fa;
    --row-hover: #374151;
    --error-bg: #7f1d1d;
    --error-fg: #fecaca;
    --warn-bg: #78350f;
    --warn-fg: #fde68a;
    --info-bg: #1e3a8a;
    --info-fg: #bfdbfe;
    --ok-bg: #14532d;
    --ok-fg: #bbf7d0;
    --heat-mid: #7f1d1d;
    --heat-high: #b91c1c;
    --heat-high-fg: #fee2e2;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0 auto;
  padding: 24px;
  max-width: 1280px;
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.45;
}
.chrome {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bg);
  padding: 8px 0 12px;
  border-bottom: 1px solid var(--border);
  margin: 0 -8px 20px;
  padding-left: 8px;
  padding-right: 8px;
}
h1 { font-size: 1.4rem; margin: 0 0 4px; }
h2 { font-size: 1rem; margin: 0 0 10px; }
.meta { color: var(--muted); font-size: 0.85rem; margin: 2px 0; }
.meta a { color: var(--accent); }
.cards, .filters, .chips { display: flex; flex-wrap: wrap; gap: 8px; }
.cards { margin: 12px 0 8px; }
.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 104px;
  cursor: default;
  color: inherit;
}
.card[data-severity] { cursor: pointer; border-left-width: 4px; }
.card[data-severity="error"] { border-left-color: var(--error); }
.card[data-severity="warn"] { border-left-color: var(--warn); }
.card[data-severity="info"] { border-left-color: var(--info); }
.card.active { outline: 2px solid var(--accent); }
.card-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
.card-value { font-size: 1.25rem; font-weight: 650; }
.filters { margin: 8px 0 0; }
.filters label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--muted);
}
button, select, input { font: inherit; color: inherit; }
select, input[type="search"] {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  min-width: 8rem;
}
input[type="search"] { min-width: 12rem; }
button {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
}
button:disabled { opacity: 0.5; cursor: default; }
.btn-quiet { border: 0; background: transparent; color: var(--accent); padding: 4px 6px; }
.disclosure { margin-bottom: 10px; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; }
.error { background: var(--error-bg); color: var(--error-fg); }
.warn { background: var(--warn-bg); color: var(--warn-fg); }
.info { background: var(--info-bg); color: var(--info-fg); }
.ok { background: var(--ok-bg); color: var(--ok-fg); }
.chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 12px;
}
.table-wrap {
  overflow: auto;
  max-height: min(70vh, 44rem);
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  container-type: inline-size;
}
table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
th, td { border-bottom: 1px solid var(--border); padding: 8px 10px; text-align: left; vertical-align: top; }
thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--card);
  cursor: pointer;
  white-space: nowrap;
}
tbody tr:hover td { background: var(--row-hover); }
.url-cell { max-width: 22rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.url-cell a { color: var(--accent); text-decoration: none; }
.matrix { width: auto; font-size: 0.8rem; }
.matrix td, .matrix th { white-space: nowrap; }
.matrix td { cursor: pointer; text-align: center; border: 1px solid var(--border); }
.heat-0 { background: var(--card); }
.heat-1 { background: var(--heat-mid); }
.heat-2 { background: var(--heat-high); color: var(--heat-high-fg); }
.details td { background: transparent; padding: 8px 0 16px; }
.panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 12px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  position: sticky;
  left: 8px;
  width: min(72rem, calc(100cqi - 16px));
}
.panel h3 { margin: 0 0 6px; font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
.panel p, .panel ul { margin: 0; padding: 0; }
.panel ul { list-style: none; }
.panel li { margin: 4px 0; overflow-wrap: anywhere; }
.span-2 { grid-column: 1 / -1; }
.pager { display: flex; gap: 8px; align-items: center; margin: 12px 0; color: var(--muted); }
`;

export const REPORT_SCRIPT = `
(function () {
  var data = JSON.parse(document.getElementById('seo-audit-data').textContent);
  var state = readHash();
  var coverageOpen = false;
  function setText(node, value) { node.textContent = value == null ? '' : String(value); }
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) setText(node, text);
    return node;
  }
  function readHash() {
    var params = new URLSearchParams(location.hash.replace(/^#/, ''));
    return {
      locale: params.get('locale') || '',
      route: params.get('route') || '',
      indexable: params.get('indexable') || '',
      severity: params.get('severity') || '',
      rule: params.get('rule') || '',
      sitemap: params.get('sitemap') || '',
      q: params.get('q') || '',
      sort: params.get('sort') || 'url',
      dir: params.get('dir') || 'asc',
      page: Number(params.get('page') || '1') || 1
    };
  }
  function writeHash() {
    var params = new URLSearchParams();
    Object.keys(state).forEach(function (key) {
      var value = state[key];
      if (value === '' || value == null) return;
      if (key === 'page' && value === 1) return;
      if (key === 'sort' && value === 'url') return;
      if (key === 'dir' && value === 'asc') return;
      params.set(key, String(value));
    });
    history.replaceState(null, '', '#' + params.toString());
  }
  function locales() {
    var seen = {};
    data.pages.forEach(function (page) { seen[page.locale] = true; });
    return Object.keys(seen).sort();
  }
  function routes() {
    var seen = {};
    data.pages.forEach(function (page) { seen[page.routeName] = true; });
    return Object.keys(seen).sort();
  }
  function rules() {
    var seen = {};
    data.pages.forEach(function (page) {
      page.issues.forEach(function (item) { seen[item.ruleId] = true; });
    });
    return Object.keys(seen).sort();
  }
  function issueCount(page, severity) {
    return page.issues.filter(function (item) { return item.severity === severity; }).length;
  }
  function matches(page) {
    if (state.locale && page.locale !== state.locale) return false;
    if (state.route && page.routeName !== state.route) return false;
    if (state.indexable === 'yes' && !page.indexable) return false;
    if (state.indexable === 'no' && page.indexable) return false;
    if (state.sitemap === 'none' && page.inSitemap) return false;
    if (state.sitemap && state.sitemap !== 'none' && page.inSitemap !== state.sitemap) return false;
    if (state.severity && !page.issues.some(function (item) { return item.severity === state.severity; })) return false;
    if (state.rule && !page.issues.some(function (item) { return item.ruleId === state.rule; })) return false;
    if (state.q && page.url.toLowerCase().indexOf(state.q.toLowerCase()) === -1) return false;
    return true;
  }
  function titleLen(page) { return page.parsed && page.parsed.titles[0] ? page.parsed.titles[0].length : 0; }
  function descLen(page) { return page.parsed && page.parsed.metaDescription ? page.parsed.metaDescription.length : 0; }
  function sortValue(page, key) {
    if (key === 'errors') return issueCount(page, 'error');
    if (key === 'warns') return issueCount(page, 'warn');
    if (key === 'title') return titleLen(page);
    if (key === 'description') return descLen(page);
    if (key === 'seo') return page.lighthouse ? page.lighthouse.seo : -1;
    if (key === 'perf') return page.lighthouse ? page.lighthouse.performance : -1;
    if (key === 'status') return page.status;
    return String(page[key] == null ? '' : page[key]);
  }
  function shortPrefix(value) {
    if (!value) return 'unknown';
    return value.length > 56 ? value.slice(0, 28) + '\\u2026' + value.slice(-20) : value;
  }
  function displayUrl(url) {
    try {
      var parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch (error) {
      return url;
    }
  }
  function field(title, body, wide) {
    var wrap = el('div', wide ? 'span-2' : '');
    wrap.append(el('h3', '', title), body);
    return wrap;
  }
  function renderHeader() {
    var origin = el('a', 'meta');
    origin.href = data.baseUrl;
    setText(origin, data.baseUrl);
    var prefix = el('p', 'meta', 'build prefix: ' + shortPrefix(data.buildPrefix));
    prefix.title = data.buildPrefix || 'unknown';
    document.getElementById('header').replaceChildren(
      el('h1', '', 'SEO audit'),
      origin,
      el('p', 'meta', data.generatedAt),
      prefix
    );
  }
  function renderSummary() {
    var root = document.getElementById('summary');
    root.replaceChildren();
    var cards = el('div', 'cards');
    [
      ['urls', data.summary.urls, ''],
      ['indexable', data.summary.indexable, ''],
      ['noindex', data.summary.noindex, ''],
      ['errors', data.summary.errors, 'error'],
      ['warns', data.summary.warns, 'warn'],
      ['infos', data.summary.infos, 'info']
    ].forEach(function (card) {
      var button = el('button', 'card');
      button.type = 'button';
      button.append(el('span', 'card-label', card[0]), el('span', 'card-value', String(card[1])));
      if (card[2]) {
        button.dataset.severity = card[2];
        if (state.severity === card[2]) button.classList.add('active');
      }
      button.addEventListener('click', function () {
        if (!card[2]) return;
        state.severity = state.severity === card[2] ? '' : card[2];
        state.page = 1;
        writeHash();
        render();
      });
      cards.append(button);
    });
    root.append(cards);
  }
  function heatClass(errors) {
    if (!errors) return 'heat-0';
    return errors >= 5 ? 'heat-2' : 'heat-1';
  }
  function renderCoverage() {
    var root = document.getElementById('coverage');
    var toggle = el('button', 'disclosure', coverageOpen ? 'Hide coverage' : 'Show coverage');
    toggle.type = 'button';
    toggle.id = 'coverage-toggle';
    toggle.setAttribute('aria-expanded', coverageOpen ? 'true' : 'false');
    toggle.setAttribute('aria-controls', 'coverage-panel');
    toggle.addEventListener('click', function () {
      coverageOpen = !coverageOpen;
      renderCoverage();
    });
    var panel = el('div');
    panel.id = 'coverage-panel';
    panel.hidden = !coverageOpen;
    var cols = locales();
    var table = el('table', 'matrix');
    var head = el('tr');
    head.append(el('th', '', 'route'));
    cols.forEach(function (locale) { head.append(el('th', '', locale)); });
    table.append(head);
    var names = Object.keys(data.coverage).sort(function (left, right) {
      return routeErrors(right) - routeErrors(left) || left.localeCompare(right);
    });
    names.forEach(function (routeName) {
      var row = el('tr');
      row.append(el('td', '', routeName));
      cols.forEach(function (locale) {
        var cell = data.coverage[routeName] && data.coverage[routeName][locale];
        var errors = cell ? cell.errors : 0;
        var label = cell ? cell.indexable + '/' + cell.noindex : '\\u2013';
        var td = el('td', heatClass(errors), label);
        td.title = routeName + ' ' + locale + ': ' + (cell ? cell.indexable + ' indexable, ' + cell.noindex + ' noindex, ' + errors + ' errors' : 'no sample');
        td.setAttribute('aria-label', td.title);
        td.addEventListener('click', function () {
          state.route = routeName;
          state.locale = locale;
          state.page = 1;
          writeHash();
          render();
        });
        row.append(td);
      });
      table.append(row);
    });
    panel.append(table);
    var chips = el('div', 'chips');
    var uncovered = data.uncoveredRoutes || [];
    if (uncovered.length === 0) chips.append(el('span', 'chip', 'all indexable routes sampled'));
    uncovered.forEach(function (routeName) { chips.append(el('span', 'chip', routeName)); });
    panel.append(el('p', 'meta', 'Uncovered indexable routes'), chips);
    root.replaceChildren(toggle, panel);
  }
  function routeErrors(routeName) {
    var cells = data.coverage[routeName] || {};
    return Object.keys(cells).reduce(function (sum, locale) { return sum + cells[locale].errors; }, 0);
  }
  function addSelect(bar, id, label, values) {
    var wrap = el('label');
    setText(wrap, label);
    var select = el('select');
    select.id = id;
    var current = state[id.replace('filter-', '')] || '';
    if (id === 'filter-indexable') current = state.indexable;
    [['', 'All']].concat(values.map(function (value) { return [value, value]; })).forEach(function (pair) {
      var option = el('option', '', pair[1]);
      option.value = pair[0];
      if (option.value === current) option.selected = true;
      select.append(option);
    });
    select.addEventListener('change', function () {
      var key = id === 'filter-locale' ? 'locale'
        : id === 'filter-route' ? 'route'
        : id === 'filter-indexable' ? 'indexable'
        : id === 'filter-severity' ? 'severity'
        : id === 'filter-rule' ? 'rule'
        : 'sitemap';
      state[key] = select.value;
      state.page = 1;
      writeHash();
      render();
    });
    wrap.append(select);
    bar.append(wrap);
  }
  function renderFilters() {
    var root = document.getElementById('filters');
    var bar = el('div', 'filters');
    bar.setAttribute('aria-label', 'Filters');
    addSelect(bar, 'filter-locale', 'Locale', locales());
    addSelect(bar, 'filter-route', 'Route', routes());
    addSelect(bar, 'filter-indexable', 'Indexable', ['yes', 'no']);
    addSelect(bar, 'filter-severity', 'Severity', ['error', 'warn', 'info']);
    addSelect(bar, 'filter-rule', 'Rule', rules());
    addSelect(bar, 'filter-sitemap', 'In sitemap', ['public', 'secret', 'none']);
    var search = el('label');
    setText(search, 'URL');
    var input = el('input');
    input.id = 'filter-q';
    input.type = 'search';
    input.value = state.q;
    input.addEventListener('input', function () {
      state.q = input.value;
      state.page = 1;
      writeHash();
      renderTable();
    });
    search.append(input);
    bar.append(search);
    root.replaceChildren(bar);
  }
  function countBadge(count, severity) {
    if (!count) return document.createTextNode('0');
    return el('span', 'badge ' + severity, String(count));
  }
  function renderTable() {
    var root = document.getElementById('table');
    var rows = data.pages.filter(matches);
    var dir = state.dir === 'desc' ? -1 : 1;
    rows.sort(function (left, right) {
      var a = sortValue(left, state.sort);
      var b = sortValue(right, state.sort);
      if (typeof a === 'number' && typeof b === 'number') return (a - b) * dir;
      return String(a).localeCompare(String(b)) * dir;
    });
    var pageSize = 200;
    var pages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (state.page > pages) state.page = pages;
    var slice = rows.slice((state.page - 1) * pageSize, state.page * pageSize);
    var showLh = data.pages.some(function (page) { return page.lighthouse; });
    var columns = [
      ['url', 'URL'], ['routeName', 'route'], ['locale', 'locale'], ['status', 'status'],
      ['indexable', 'indexable'], ['title', 'title length'], ['description', 'description length'],
      ['errors', 'errors'], ['warns', 'warns']
    ];
    if (showLh) columns.push(['seo', 'LH SEO'], ['perf', 'LH perf']);
    var table = el('table');
    table.id = 'pages';
    var head = el('tr');
    columns.forEach(function (column) {
      var th = el('th', '', column[1]);
      th.addEventListener('click', function () {
        state.dir = state.sort === column[0] && state.dir === 'asc' ? 'desc' : 'asc';
        state.sort = column[0];
        writeHash();
        render();
      });
      head.append(th);
    });
    head.append(el('th', '', ''));
    var thead = el('thead');
    thead.append(head);
    table.append(thead);
    var tbody = el('tbody');
    slice.forEach(function (page) { tbody.append(pageRow(page, showLh, columns.length + 1)); });
    table.append(tbody);
    var wrap = el('div', 'table-wrap');
    wrap.append(table);
    var pager = el('div', 'pager');
    var prev = el('button', '', 'Previous');
    var next = el('button', '', 'Next');
    prev.id = 'page-prev';
    next.id = 'page-next';
    prev.type = 'button';
    next.type = 'button';
    prev.disabled = state.page <= 1;
    next.disabled = state.page >= pages;
    prev.addEventListener('click', function () { state.page -= 1; writeHash(); render(); });
    next.addEventListener('click', function () { state.page += 1; writeHash(); render(); });
    pager.append(prev, el('span', '', 'page ' + state.page + ' / ' + pages + ' · ' + rows.length + ' pages'), next);
    root.replaceChildren(el('h2', '', 'Pages'), wrap, pager);
  }
  function pageRow(page, showLh, colCount) {
    var row = el('tr');
    var linkCell = el('td', 'url-cell');
    var link = el('a');
    link.href = page.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = page.url;
    setText(link, displayUrl(page.url));
    linkCell.append(link);
    row.append(linkCell);
    row.append(el('td', '', page.routeName), el('td', '', page.locale), el('td', '', String(page.status)));
    row.append(el('td', '', page.indexable ? 'yes' : 'no'));
    row.append(el('td', '', String(titleLen(page))), el('td', '', String(descLen(page))));
    var errCell = el('td');
    errCell.append(countBadge(issueCount(page, 'error'), 'error'));
    var warnCell = el('td');
    warnCell.append(countBadge(issueCount(page, 'warn'), 'warn'));
    row.append(errCell, warnCell);
    if (showLh) {
      row.append(el('td', '', page.lighthouse ? String(page.lighthouse.seo) : ''));
      row.append(el('td', '', page.lighthouse ? String(page.lighthouse.performance) : ''));
    }
    var action = el('td');
    var button = el('button', 'btn-quiet', 'Details');
    button.type = 'button';
    button.addEventListener('click', function () { toggleDetails(row, page, colCount); });
    action.append(button);
    row.append(action);
    return row;
  }
  function toggleDetails(row, page, colCount) {
    var next = row.nextElementSibling;
    if (next && next.classList.contains('details')) { next.remove(); return; }
    var detail = el('tr', 'details');
    var cell = el('td');
    cell.colSpan = colCount;
    var parsed = page.parsed || {};
    var panel = el('div', 'panel');
    panel.append(field('Title', el('p', '', (parsed.titles && parsed.titles[0]) || ''), true));
    panel.append(field('Description', el('p', '', parsed.metaDescription || ''), true));
    panel.append(field('Canonical', el('p', '', parsed.canonical || '')));
    panel.append(field('Robots', el('p', '', (parsed.metaRobots || 'none') + ' (' + page.robotsSource + ')')));
    var hreflang = el('ul');
    (parsed.hreflang || []).forEach(function (entry) {
      hreflang.append(el('li', '', entry.lang + ' \\u2192 ' + entry.href));
    });
    panel.append(field('hreflang', hreflang, true));
    panel.append(kvList('Open Graph', parsed.og || {}));
    panel.append(kvList('Twitter', parsed.twitter || {}));
    panel.append(field('JSON-LD types', el('p', '', jsonLdTypes(parsed.jsonLd || []).join(', '))));
    panel.append(field('Static prefixes', el('p', '', (parsed.nextStaticPrefixes || []).join(', '))));
    if (page.lighthouse) {
      panel.append(field(
        'Lighthouse',
        el('p', '', 'SEO ' + page.lighthouse.seo + ' · perf ' + page.lighthouse.performance + ' · a11y ' + page.lighthouse.accessibility + ' · best ' + page.lighthouse.bestPractices)
      ));
    }
    var issues = el('ul');
    page.issues.forEach(function (item) {
      var li = el('li');
      li.append(el('span', 'badge ' + item.severity, item.severity), document.createTextNode(' ' + item.ruleId + ' ' + item.message));
      issues.append(li);
    });
    if (!page.issues.length) issues.append(el('li', '', 'none'));
    panel.append(field('Issues', issues, true));
    cell.append(panel);
    detail.append(cell);
    row.after(detail);
  }
  function kvList(title, record) {
    var list = el('ul');
    Object.keys(record).forEach(function (key) { list.append(el('li', '', key + ': ' + record[key])); });
    return field(title, list);
  }
  function jsonLdTypes(blocks) {
    var types = [];
    blocks.forEach(function (raw) {
      try { collectTypes(JSON.parse(raw), types); }
      catch (error) { types.push('invalid'); }
    });
    return types;
  }
  function collectTypes(value, types) {
    if (Array.isArray(value)) { value.forEach(function (item) { collectTypes(item, types); }); return; }
    if (!value || typeof value !== 'object') return;
    if (value['@type']) types.push(Array.isArray(value['@type']) ? value['@type'].join(',') : String(value['@type']));
    if (Array.isArray(value['@graph'])) value['@graph'].forEach(function (item) { collectTypes(item, types); });
  }
  function render() {
    renderHeader();
    renderSummary();
    renderCoverage();
    renderFilters();
    renderTable();
  }
  window.addEventListener('hashchange', function () { state = readHash(); render(); });
  render();
})();
`;
