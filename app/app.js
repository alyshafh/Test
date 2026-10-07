// Copilot Workshop Idea Board
// All data is stored locally in the browser (localStorage) — no backend required.
// Use Export/Import JSON to merge ideas captured on different facilitator devices.

const STORAGE_KEY = 'copilotWorkshopIdeas';
const TOPICS = [
  'Copilot in the web',
  'Copilot within M365 apps',
  'Agents built by standard Copilot',
  'Advanced agents & workflows (Copilot Studio)',
  'Application development & reporting (GitHub Copilot)'
];

let ideas = loadIdeas();

const form = document.getElementById('ideaForm');
const statusSelect = document.getElementById('status');
const demoFields = document.getElementById('demoFields');
const filterTopic = document.getElementById('filterTopic');
const filterStatus = document.getElementById('filterStatus');

TOPICS.forEach(t => {
  const opt = document.createElement('option');
  opt.value = t;
  opt.textContent = t;
  filterTopic.appendChild(opt);
});

statusSelect.addEventListener('change', () => {
  demoFields.classList.toggle('hidden', statusSelect.value !== 'shortlisted');
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const idea = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    groupName: document.getElementById('groupName').value.trim(),
    topic: document.getElementById('topic').value,
    title: document.getElementById('title').value.trim(),
    businessGoal: document.getElementById('businessGoal').value.trim(),
    description: document.getElementById('description').value.trim(),
    impact: document.getElementById('impact').value.trim(),
    status: statusSelect.value,
    demoPlan: document.getElementById('demoPlan').value.trim(),
    presenter: document.getElementById('presenter').value.trim(),
    createdAt: new Date().toISOString()
  };
  ideas.push(idea);
  saveIdeas();
  render();
  form.reset();
  demoFields.classList.add('hidden');
});

filterTopic.addEventListener('change', render);
filterStatus.addEventListener('change', render);

document.getElementById('exportBtn').addEventListener('click', () => {
  downloadFile(JSON.stringify(ideas, null, 2), 'copilot-workshop-ideas.json', 'application/json');
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  downloadFile(toCsv(ideas), 'copilot-workshop-ideas.csv', 'text/csv');
});

document.getElementById('importInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error('Expected an array of ideas');
      const existingIds = new Set(ideas.map(i => i.id));
      const merged = imported.filter(i => !existingIds.has(i.id));
      ideas = ideas.concat(merged);
      saveIdeas();
      render();
      alert(`Imported ${merged.length} new idea(s). ${imported.length - merged.length} duplicate(s) skipped.`);
    } catch (err) {
      alert('Could not import file: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('printBtn').addEventListener('click', () => {
  const shortlisted = ideas.filter(i => i.status === 'shortlisted');
  if (shortlisted.length === 0) {
    alert('No shortlisted ideas to print yet.');
    return;
  }
  const printArea = document.getElementById('printArea');
  printArea.innerHTML = shortlisted.map(i => `
    <div class="print-card">
      <div class="print-meta">${escapeHtml(i.groupName)} &middot; ${escapeHtml(i.topic)}</div>
      <h2>${escapeHtml(i.title)}</h2>
      <div class="print-section">
        <h4>Business goal</h4>
        <p>${escapeHtml(i.businessGoal || '—')}</p>
      </div>
      <div class="print-section">
        <h4>Description</h4>
        <p>${escapeHtml(i.description || '—')}</p>
      </div>
      <div class="print-section">
        <h4>Impact / effort</h4>
        <p>${escapeHtml(i.impact || '—')}</p>
      </div>
      <div class="print-section">
        <h4>Demo scenario</h4>
        <p>${escapeHtml(i.demoPlan || '—')}</p>
      </div>
      <div class="print-section">
        <h4>Presenter(s)</h4>
        <p>${escapeHtml(i.presenter || '—')}</p>
      </div>
    </div>
  `).join('');
  window.print();
});

function render() {
  const topicFilter = filterTopic.value;
  const statusFilter = filterStatus.value;

  const filtered = ideas.filter(i =>
    (!topicFilter || i.topic === topicFilter) &&
    (!statusFilter || i.status === statusFilter)
  );

  const ideaOnly = filtered.filter(i => i.status === 'idea');
  const shortlisted = filtered.filter(i => i.status === 'shortlisted');

  document.getElementById('ideaCount').textContent = ideaOnly.length;
  document.getElementById('shortlistCount').textContent = shortlisted.length;
  document.getElementById('countSummary').textContent =
    `${filtered.length} idea(s) shown of ${ideas.length} total`;

  document.getElementById('ideaColumn').innerHTML = ideaOnly.length
    ? ideaOnly.map(renderCard).join('')
    : '<p class="empty-msg">No ideas yet.</p>';

  document.getElementById('shortlistColumn').innerHTML = shortlisted.length
    ? shortlisted.map(renderCard).join('')
    : '<p class="empty-msg">No shortlisted ideas yet.</p>';

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', onCardAction);
  });
}

function renderCard(i) {
  return `
    <div class="idea-card ${i.status}">
      <h4>${escapeHtml(i.title)}</h4>
      <div class="meta">${escapeHtml(i.groupName)} &middot; ${escapeHtml(i.topic)}</div>
      ${i.businessGoal ? `<div class="desc"><strong>Goal:</strong> ${escapeHtml(i.businessGoal)}</div>` : ''}
      ${i.description ? `<div class="desc">${escapeHtml(i.description)}</div>` : ''}
      ${i.status === 'shortlisted' && i.demoPlan ? `<div class="desc"><strong>Demo:</strong> ${escapeHtml(i.demoPlan)}</div>` : ''}
      ${i.status === 'shortlisted' && i.presenter ? `<div class="desc"><strong>Presenter:</strong> ${escapeHtml(i.presenter)}</div>` : ''}
      <div class="actions">
        ${i.status === 'idea'
          ? `<button data-action="shortlist" data-id="${i.id}">⭐ Shortlist</button>`
          : `<button data-action="unshortlist" data-id="${i.id}">↩ Move back</button>`}
        <button data-action="delete" data-id="${i.id}" class="danger">Delete</button>
      </div>
    </div>
  `;
}

function onCardAction(e) {
  const { action, id } = e.target.dataset;
  const idea = ideas.find(i => i.id === id);
  if (!idea) return;
  if (action === 'shortlist') idea.status = 'shortlisted';
  if (action === 'unshortlist') idea.status = 'idea';
  if (action === 'delete') {
    if (!confirm(`Delete idea "${idea.title}"?`)) return;
    ideas = ideas.filter(i => i.id !== id);
  }
  saveIdeas();
  render();
}

function loadIdeas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveIdeas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(items) {
  const headers = ['groupName', 'topic', 'title', 'businessGoal', 'description', 'impact', 'status', 'demoPlan', 'presenter', 'createdAt'];
  const rows = items.map(i => headers.map(h => csvEscape(i[h] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function csvEscape(val) {
  const str = String(val).replace(/"/g, '""');
  return /[",\n]/.test(str) ? `"${str}"` : str;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

render();
