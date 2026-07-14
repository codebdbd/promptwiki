const LEVEL_CLASS = {
  'Базовый': 'difficulty-basic',
  'Средний': 'difficulty-medium',
  'Продвинутый': 'difficulty-advanced',
  'Новое': 'difficulty-new',
};

const TYPE_LABEL = {
  term: 'Термин',
  acronym: 'Акроним',
  tool: 'Инструмент',
  framework: 'Фреймворк',
  metric: 'Метрика',
  benchmark: 'Бенчмарк',
  technique: 'Техника',
  platform: 'Платформа',
  runtime: 'Runtime',
  practice: 'Практика',
  faq: 'FAQ',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderInlineMarkdown(value) {
  const source = String(value ?? '');
  const pattern = /(`[^`\n]+`)|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    result += escapeHtml(source.slice(lastIndex, match.index));

    if (match[1]) {
      result += `<code>${escapeHtml(match[1].slice(1, -1))}</code>`;
    } else {
      const href = match[3];
      try {
        const url = new URL(href);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          result += `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(match[2])}</a>`;
        } else {
          result += escapeHtml(match[0]);
        }
      } catch {
        result += escapeHtml(match[0]);
      }
    }

    lastIndex = pattern.lastIndex;
  }

  return result + escapeHtml(source.slice(lastIndex));
}

function renderMarkdown(value) {
  const lines = String(value ?? '').replace(/\r\n?/g, '\n').split('\n');
  return lines
    .map(line => {
      if (!line.trim()) return '';
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${renderInlineMarkdown(heading[2].trim())}</h${level}>`;
      }
      return `<p>${renderInlineMarkdown(line)}</p>`;
    })
    .filter(Boolean)
    .join('');
}

function getTerms() {
  return window.DICTIONARY_DATA.sections.flatMap(section =>
    section.terms.map(term => ({ ...term, sectionId: section.id, sectionTitle: section.title }))
  );
}

function renderSidebar() {
  const menu = document.getElementById('sidebar-menu');
  menu.innerHTML = window.DICTIONARY_DATA.sections.map((section, index) => `
    <li class="sidebar-item" data-sec="${escapeHtml(section.id)}">
      <a href="#${escapeHtml(section.id)}">
        <span class="sidebar-sec-num">Раздел ${index + 1}</span><br>
        <span class="sidebar-sec-title">${escapeHtml(section.title.replace(/^Раздел\s+\d+:\s*/, ''))}</span>
      </a>
    </li>
  `).join('');
}

function renderTermCard(term) {
  const levelClass = LEVEL_CLASS[term.level] || 'difficulty-medium';
  const related = (term.related || []).map(item => `<span class="related-link">${escapeHtml(item)}</span>`).join('');
  const english = term.english ? `<span class="term-english">(${escapeHtml(term.english)})</span>` : '';
  const typeLabel = TYPE_LABEL[term.type] || TYPE_LABEL.term;
  const typeBadge = `<span class="type-badge type-${escapeHtml(term.type || 'term')}">${escapeHtml(typeLabel)}</span>`;
  if (term.type === 'acronym') {
    const target = term.target ? `
      <div class="acronym-target">
        Полная статья: <span class="related-link">${escapeHtml(term.target)}</span>
      </div>
    ` : '';

    return `
      <div class="term-card acronym-card" data-title="${escapeHtml(term.title)} ${escapeHtml(term.acronym || '')}" data-eng="${escapeHtml(term.expansion || '')}" data-type="${escapeHtml(term.type)}">
        <div class="term-header">
          <div class="term-title-wrapper">
            <span class="term-title">${escapeHtml(term.acronym || term.title)}</span>
            <span class="term-english">${escapeHtml(term.expansion || '')}</span>
          </div>
          <div class="badge-row">
            ${typeBadge}
            <span class="difficulty-badge ${levelClass}">${escapeHtml(term.level)}</span>
          </div>
        </div>
        <div class="term-definition md-content">${renderMarkdown(term.definition)}</div>
        ${target}
      </div>
    `;
  }
  const importanceBlock = term.importance ? `<div class="term-importance md-content">${renderMarkdown(term.importance)}</div>` : '';
  const exampleBlock = term.example ? `
      <div class="example-box">
        <div class="example-title">
          <span>Пример:</span>
          <button class="copy-btn" type="button" onclick="copyText(this, this.closest('.example-box').querySelector('code').innerText)">📋 Копировать</button>
        </div>
        <pre class="example-content"><code>${escapeHtml(term.example)}</code></pre>
      </div>
  ` : '';
  const extraBlock = term.extra ? `
      <div class="extra-context">
        <div class="extra-label">💡 ${escapeHtml(term.extra_label || 'Заметка')}:</div>
        <div class="md-content">${renderMarkdown(term.extra)}</div>
      </div>
  ` : '';

  return `
    <div class="term-card" data-title="${escapeHtml(term.title)}" data-eng="${escapeHtml(term.english || '')}" data-type="${escapeHtml(term.type || 'term')}">
      <div class="term-header">
        <div class="term-title-wrapper">
          <span class="term-title">${escapeHtml(term.title)}</span>
          ${english}
        </div>
        <div class="badge-row">
          ${typeBadge}
          <span class="difficulty-badge ${levelClass}">${escapeHtml(term.level)}</span>
        </div>
      </div>
      <div class="term-definition md-content">${renderMarkdown(term.definition)}</div>
      ${importanceBlock}
      ${exampleBlock}
      ${extraBlock}
      <div class="related-terms">${related}</div>
    </div>
  `;
}

function renderContent() {
  const container = document.getElementById('content-container');
  container.innerHTML = window.DICTIONARY_DATA.sections.map(section => `
    <div class="section-wrapper" id="${escapeHtml(section.id)}">
      <div class="section-header"><h2>${escapeHtml(section.title)}</h2></div>
      <div class="terms-grid">
        ${section.terms.map(renderTermCard).join('')}
      </div>
    </div>
  `).join('') + renderStatsSection();
}

function renderStatsSection() {
  return `
    <div class="section-wrapper" id="sec-stats">
      <div class="section-header"><h2>📊 Статистика словаря и обновления</h2></div>
      <div class="term-card stats-summary-card">
        <div class="term-definition">
          Словарь приведен к релизной структуре: 21 тематический раздел, явные типы карточек, компактный указатель акронимов, развернутые определения, практическая важность, примеры, дополнительный контекст и связанные термины для полноценных статей.
        </div>
        <div class="term-importance">
          Версия ${escapeHtml(window.DICTIONARY_DATA.meta.version)} — ${escapeHtml(window.DICTIONARY_DATA.meta.updated)}. Автор: AI Expert & Prompt Engineering Specialist. Лицензия: образовательное использование.
        </div>
      </div>
    </div>
  `;
}

function updateStats() {
  const terms = getTerms();
  document.getElementById('stat-total').textContent = terms.length;
  document.getElementById('stat-basic').textContent = terms.filter(term => term.level === 'Базовый').length;
  document.getElementById('stat-medium').textContent = terms.filter(term => term.level === 'Средний').length;
  document.getElementById('stat-advanced').textContent = terms.filter(term => term.level === 'Продвинутый').length;
  document.getElementById('stat-new').textContent = terms.filter(term => term.level === 'Новое').length;
}

function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme');
  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');

  if (currentTheme === 'dark') {
    body.removeAttribute('data-theme');
    themeIcon.textContent = '🌙';
    themeText.textContent = 'Темная тема';
    localStorage.setItem('theme', 'light');
  } else {
    body.setAttribute('data-theme', 'dark');
    themeIcon.textContent = '☀️';
    themeText.textContent = 'Светлая тема';
    localStorage.setItem('theme', 'dark');
  }
}

function loadSavedTheme() {
  if (window.Telegram?.WebApp) return;
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.removeAttribute('data-theme');
    document.getElementById('theme-icon').textContent = '🌙';
    document.getElementById('theme-text').textContent = 'Тёмная тема';
  } else {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById('theme-icon').textContent = '☀️';
    document.getElementById('theme-text').textContent = 'Светлая тема';
  }
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-backdrop').classList.add('visible');
  document.body.classList.add('sidebar-open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('visible');
  document.body.classList.remove('sidebar-open');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

function copyText(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '✅ Скопировано!';
    setTimeout(() => {
      btn.innerHTML = originalText;
    }, 1500);
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('Service Worker зарегистрирован.'))
      .catch(error => console.warn('Ошибка регистрации Service Worker:', error));
  }
}

function initTelegramWebApp() {
  if (!window.Telegram?.WebApp) return;
  const tg = window.Telegram.WebApp;
  if (tg.colorScheme === 'dark' || tg.isDarkMode) {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById('theme-icon').textContent = '☀️';
    document.getElementById('theme-text').textContent = 'Светлая тема';
  }
  if (typeof tg.onEvent === 'function') {
    tg.onEvent('themeChanged', () => {
      const nextTheme = tg.colorScheme === 'dark' || tg.isDarkMode ? 'dark' : 'light';
      if (nextTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('theme-icon').textContent = '☀️';
        document.getElementById('theme-text').textContent = 'Светлая тема';
      } else {
        document.body.removeAttribute('data-theme');
        document.getElementById('theme-icon').textContent = '🌙';
        document.getElementById('theme-text').textContent = 'Темная тема';
      }
    });
  }
}


function handleSearch() {
  const query = document.getElementById('search').value.toLowerCase().trim();
  const sections = document.querySelectorAll('.section-wrapper');
  let visibleTerms = 0;
  const totalTerms = document.querySelectorAll('.term-card').length;

  sections.forEach(section => {
    const cards = section.querySelectorAll('.term-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const title = card.getAttribute('data-title').toLowerCase();
      const eng = card.getAttribute('data-eng').toLowerCase();
      const visible = !query || title.includes(query) || eng.includes(query);
      card.style.display = visible ? 'flex' : 'none';
      if (visible) {
        visibleCount += 1;
        visibleTerms += 1;
      }
    });

    section.style.display = visibleCount > 0 ? 'block' : 'none';
  });
}

function observeSections() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-sec') === id);
      });
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.section-wrapper').forEach(section => observer.observe(section));
}

function initDictionary() {
  document.getElementById('dictionary-title').textContent = window.DICTIONARY_DATA.meta.title;
  document.getElementById('dictionary-subtitle').textContent = window.DICTIONARY_DATA.meta.subtitle;
  loadSavedTheme();
  renderSidebar();
  renderContent();
  updateStats();
  observeSections();
  initTelegramWebApp();
  registerServiceWorker();

  const backdrop = document.getElementById('sidebar-backdrop');
  backdrop.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('sidebar').classList.contains('open')) {
      closeSidebar();
    }
  });
}

document.addEventListener('DOMContentLoaded', initDictionary);
