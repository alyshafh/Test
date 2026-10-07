// M365 Copilot Workshop App — David James Estate Agents
// Single-page app, vanilla JS, all data stored locally in the browser (localStorage).
// Sections: Dashboard, Agenda, Art of the Possible, Skills & Confidence, Groups, Ideas Board, Live Projects.

/* ============================== Static content ============================== */

const TOPICS = [
  'Copilot in the web',
  'Copilot within M365 apps',
  'Agents built by standard Copilot',
  'Advanced agents & workflows (Copilot Studio)',
  'Application development & reporting (GitHub Copilot)'
];

const AGENDA = [
  { time: '0:00 – 0:05', title: 'Welcome & framing', detail: 'Introduce the day and capture David James\'s business goals live (see Dashboard).' },
  { time: '0:05 – 1:05', title: 'Art of the possible (1 hour, all 5 topics)', detail: 'Live demo-led tour across all five areas — roughly 12 minutes per topic.' },
  { time: '1:05 – 1:15', title: 'Break / form breakout groups', detail: 'Mix departments where possible so ideas cross-pollinate. Set groups up in the Groups section.' },
  { time: '1:15 – 2:15', title: 'Breakout group working session', detail: 'Groups discuss where Copilot could save time or help hit business goals.' },
  { time: '2:15 – 2:30', title: 'Break', detail: 'Facilitator pre-loads the report-back order.' },
  { time: '2:30 – 3:15', title: 'Group report-backs', detail: 'Each group presents 2–3 ideas. Facilitator captures every idea live in the Ideas Board, tagging Idea only or Shortlisted.' },
  { time: '3:15 – 3:30', title: 'Shortlist confirmation', detail: 'Quick group discussion to confirm which shortlisted ideas move into Live Projects for a demo.' },
  { time: '3:30 – 4:15', title: 'Demo scenario build time', detail: 'Groups build a lightweight test/demo for their live project.' },
  { time: '4:15 – 4:45', title: 'Final showcase', detail: 'Each live project is demoed. Use Print Showcase Cards from the Live Projects section as presentation prompts.' },
  { time: '4:45 – 5:00', title: 'Wrap-up & next steps', detail: 'Summarise themes, confirm follow-up owners, export the full workshop report.' }
];

const POSSIBLE = [
  {
    icon: '🌐', title: 'Copilot in the web',
    desc: 'Copilot Chat at copilot.microsoft.com / Bing — research, drafting, and quick answers with no app installed.',
    bullets: ['Drafting property listing descriptions', 'Summarising market research', 'Quick client email drafts']
  },
  {
    icon: '📎', title: 'Copilot within M365 apps',
    desc: 'Copilot embedded in Outlook, Word, Excel, Teams, and PowerPoint — working inside the tools staff already use.',
    bullets: ['Summarising long email threads', 'Drafting board reports in Word', 'Meeting recaps & actions in Teams']
  },
  {
    icon: '🤖', title: 'Agents built by standard Copilot',
    desc: 'Lightweight, no-code agents created directly inside Copilot for a specific repeatable task.',
    bullets: ['A viewing-feedback summariser', 'A tenant FAQ assistant', 'A listing description generator']
  },
  {
    icon: '🧩', title: 'Advanced agents & workflows (Copilot Studio)',
    desc: 'Multi-step agents with triggers, data connections, and approvals built in Copilot Studio.',
    bullets: ['Automated maintenance request triage', 'Lead qualification workflow', 'Compliance document checks']
  },
  {
    icon: '💻', title: 'Application development & reporting (GitHub Copilot)',
    desc: 'Copilot-assisted coding and reporting — building small internal tools, scripts, and dashboards faster.',
    bullets: ['A simple internal reporting dashboard', 'Automating a repetitive data task', 'Prototyping an internal tool']
  }
];

const SKILL_AREAS = [
  'Copilot in the web',
  'Copilot within M365 apps',
  'Agents built by standard Copilot',
  'Advanced agents & workflows',
  'Application development & reporting'
];

/* ============================== Storage helpers ============================== */

const STORE = {
  groups: 'workshop_groups',
  ideas: 'workshop_ideas',
  skills: 'workshop_skills',
  goals: 'workshop_goals'
};

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
}
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ---- one-time migration from the earlier single-view idea board ---- */
(function migrateLegacyIdeas() {
  const legacy = localStorage.getItem('copilotWorkshopIdeas');
  if (legacy && !localStorage.getItem(STORE.ideas)) {
    try {
      const old = JSON.parse(legacy);
      const migrated = old.map(i => ({
        id: i.id || uid(),
        groupId: null,
        groupName: i.groupName || '',
        topic: i.topic || '',
        title: i.title || '',
        businessGoal: i.businessGoal || '',
        description: i.description || '',
        impact: i.impact || '',
        stage: i.status === 'shortlisted' ? 'shortlisted' : 'idea',
        demoPlan: i.demoPlan || '',
        presenter: i.presenter || '',
        projectOwner: '',
        projectStatus: 'Not started',
        projectNotes: '',
        createdAt: i.createdAt || new Date().toISOString()
      }));
      save(STORE.ideas, migrated);
    } catch { /* ignore malformed legacy data */ }
  }
})();

let groups = load(STORE.groups);
let ideas = load(STORE.ideas);
let skills = load(STORE.skills);
let goals = load(STORE.goals);

/* ============================== Router ============================== */

const VIEWS = ['dashboard', 'agenda', 'possible', 'skills', 'groups', 'ideas', 'projects'];

function navigate() {
  const hash = (location.hash || '#dashboard').slice(1);
  const view = VIEWS.includes(hash) ? hash : 'dashboard';

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(el =>
    el.classList.toggle('active', el.dataset.view === view));

  const renderers = {
    dashboard: renderDashboard, agenda: renderAgenda, possible: renderPossible,
    skills: renderSkills, groups: renderGroups, ideas: renderIdeas, projects: renderProjects
  };
  renderers[view]();
}
window.addEventListener('hashchange', navigate);

/* ============================== Dashboard ============================== */

function renderDashboard() {
  document.getElementById('statGroups').textContent = groups.length;
  document.getElementById('statIdeas').textContent = ideas.length;
  document.getElementById('statShortlisted').textContent = ideas.filter(i => i.stage === 'shortlisted').length;
  document.getElementById('statProjects').textContent = ideas.filter(i => i.stage === 'live').length;

  const allRatings = skills.flatMap(s => Object.values(s.ratings || {}));
  const avg = allRatings.length ? (allRatings.reduce((a, b) => a + Number(b), 0) / allRatings.length) : null;
  document.getElementById('statConfidence').textContent = avg ? avg.toFixed(1) : '—';

  document.getElementById('goalList').innerHTML = goals.length
    ? goals.map(g => `<li class="chip">${escapeHtml(g)} <button data-goal="${escapeHtml(g)}" title="Remove">✕</button></li>`).join('')
    : '<li class="empty-msg">No business goals captured yet.</li>';

  document.querySelectorAll('#goalList button').forEach(btn => {
    btn.addEventListener('click', () => {
      goals = goals.filter(g => g !== btn.dataset.goal);
      save(STORE.goals, goals);
      renderDashboard();
    });
  });

  const events = [
    ...groups.map(g => ({ t: g.createdAt, text: `Group created: <strong>${escapeHtml(g.name)}</strong>` })),
    ...ideas.map(i => ({ t: i.createdAt, text: `Idea captured: <strong>${escapeHtml(i.title)}</strong> (${escapeHtml(i.topic)})` })),
    ...skills.map(s => ({ t: s.createdAt, text: `Skills response from ${escapeHtml(s.name || 'Anonymous')} (${escapeHtml(s.dept || 'No dept')})` }))
  ].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 12);

  document.getElementById('recentActivity').innerHTML = events.length
    ? events.map(e => `<div class="activity-item">${e.text}<span class="time">${new Date(e.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>`).join('')
    : '<p class="empty-msg">Nothing captured yet — activity will appear here as you use the app.</p>';
}

document.getElementById('goalForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('goalInput');
  const val = input.value.trim();
  if (!val) return;
  goals.push(val);
  save(STORE.goals, goals);
  input.value = '';
  renderDashboard();
  populateGoalDatalist();
});

document.getElementById('reportBtn').addEventListener('click', () => {
  const report = {
    exportedAt: new Date().toISOString(),
    businessGoals: goals,
    groups, ideas, skills,
    summary: {
      groups: groups.length,
      ideas: ideas.length,
      shortlisted: ideas.filter(i => i.stage === 'shortlisted').length,
      liveProjects: ideas.filter(i => i.stage === 'live').length,
      skillResponses: skills.length
    }
  };
  downloadFile(JSON.stringify(report, null, 2), 'copilot-workshop-full-report.json', 'application/json');
});

/* ---- Demo data seeding (for rehearsing the workshop / showing the report) ---- */

function buildDemoData() {
  const now = Date.now();
  const iso = mins => new Date(now - mins * 60000).toISOString();

  const demoGoals = [
    'Reduce time-to-respond on new leads',
    'Speed up property listing creation',
    'Improve tenant/landlord communication',
    'Cut admin time on compliance paperwork',
    'Free up agent time for client-facing work'
  ];

  const demoGroups = [
    { id: uid(), name: 'Sales Team', members: 'Priya, Sam, Leo, Mo', topic: 'Copilot within M365 apps', createdAt: iso(180) },
    { id: uid(), name: 'Lettings Team', members: 'Jo, Alex, Dan', topic: 'Advanced agents & workflows (Copilot Studio)', createdAt: iso(175) },
    { id: uid(), name: 'Admin & Compliance', members: 'Fatima, Chris', topic: 'Agents built by standard Copilot', createdAt: iso(170) },
    { id: uid(), name: 'Marketing Team', members: 'Ellie, Noah, Ravi', topic: 'Copilot in the web', createdAt: iso(165) }
  ];

  const g = i => demoGroups[i];

  const demoIdeas = [
    {
      id: uid(), groupId: g(0).id, groupName: g(0).name, topic: 'Copilot within M365 apps',
      title: 'Auto-summarise viewing feedback emails', businessGoal: demoGoals[0],
      description: 'Use Copilot in Outlook to summarise and tag viewing feedback threads so agents can follow up faster.',
      impact: 'High impact, low effort — quick win', stage: 'idea',
      demoPlan: '', presenter: '', projectOwner: '', projectStatus: 'Not started', projectNotes: '',
      createdAt: iso(90)
    },
    {
      id: uid(), groupId: g(3).id, groupName: g(3).name, topic: 'Copilot in the web',
      title: 'Draft social posts from new listings', businessGoal: demoGoals[1],
      description: 'Paste a listing description into Copilot Chat to generate ready-to-post social captions in the brand tone of voice.',
      impact: 'Medium impact, very low effort', stage: 'idea',
      demoPlan: '', presenter: '', projectOwner: '', projectStatus: 'Not started', projectNotes: '',
      createdAt: iso(85)
    },
    {
      id: uid(), groupId: g(2).id, groupName: g(2).name, topic: 'Agents built by standard Copilot',
      title: 'Compliance document checklist agent', businessGoal: demoGoals[3],
      description: 'A Copilot agent that checks a tenancy pack against the required document checklist and flags anything missing.',
      impact: 'High impact, medium effort', stage: 'shortlisted',
      demoPlan: 'Run the agent against a sample tenancy pack with one deliberately missing document.', presenter: 'Fatima',
      projectOwner: '', projectStatus: 'Not started', projectNotes: '', createdAt: iso(80)
    },
    {
      id: uid(), groupId: g(1).id, groupName: g(1).name, topic: 'Advanced agents & workflows (Copilot Studio)',
      title: 'Tenant maintenance request triage agent', businessGoal: demoGoals[2],
      description: 'A Copilot Studio agent that takes incoming maintenance requests, categorises urgency, and routes to the right contractor list.',
      impact: 'High impact, high value — flagship idea', stage: 'live',
      demoPlan: 'Submit 3 sample requests (urgent leak, routine repair, general query) and show correct routing.',
      presenter: 'Jo & Dan', projectOwner: 'Jo', projectStatus: 'In progress',
      projectNotes: 'Connector to the maintenance mailbox is working; still wiring up the contractor routing table.',
      createdAt: iso(75)
    },
    {
      id: uid(), groupId: g(0).id, groupName: g(0).name, topic: 'Application development & reporting (GitHub Copilot)',
      title: 'Weekly lead-conversion dashboard', businessGoal: demoGoals[0],
      description: 'A small internal reporting tool, built with GitHub Copilot assistance, pulling lead and conversion data into one weekly view for managers.',
      impact: 'High impact, frees up manager time', stage: 'live',
      demoPlan: 'Show the working dashboard with sample lead data and the GitHub Copilot-assisted code that built it.',
      presenter: 'Sam', projectOwner: 'Sam', projectStatus: 'Complete',
      projectNotes: 'Demo-ready — using sample/test data only, not live customer data.',
      createdAt: iso(70)
    },
    {
      id: uid(), groupId: g(3).id, groupName: g(3).name, topic: 'Copilot within M365 apps',
      title: 'Monthly market report drafting in Word', businessGoal: demoGoals[4],
      description: 'Use Copilot in Word to produce a first draft of the monthly local market report from raw notes and data.',
      impact: 'Medium impact, low effort', stage: 'idea',
      demoPlan: '', presenter: '', projectOwner: '', projectStatus: 'Not started', projectNotes: '',
      createdAt: iso(65)
    }
  ];

  const demoSkills = [
    { id: uid(), name: 'Priya', dept: 'Sales', ratings: { 'Copilot in the web': 3, 'Copilot within M365 apps': 2, 'Agents built by standard Copilot': 1, 'Advanced agents & workflows': 1, 'Application development & reporting': 1 }, createdAt: iso(170) },
    { id: uid(), name: '', dept: 'Lettings', ratings: { 'Copilot in the web': 2, 'Copilot within M365 apps': 3, 'Agents built by standard Copilot': 1, 'Advanced agents & workflows': 1, 'Application development & reporting': 1 }, createdAt: iso(168) },
    { id: uid(), name: 'Fatima', dept: 'Admin & Compliance', ratings: { 'Copilot in the web': 2, 'Copilot within M365 apps': 2, 'Agents built by standard Copilot': 2, 'Advanced agents & workflows': 1, 'Application development & reporting': 1 }, createdAt: iso(166) },
    { id: uid(), name: '', dept: 'Marketing', ratings: { 'Copilot in the web': 4, 'Copilot within M365 apps': 3, 'Agents built by standard Copilot': 2, 'Advanced agents & workflows': 1, 'Application development & reporting': 1 }, createdAt: iso(164) },
    { id: uid(), name: 'Dan', dept: 'Lettings', ratings: { 'Copilot in the web': 3, 'Copilot within M365 apps': 3, 'Agents built by standard Copilot': 2, 'Advanced agents & workflows': 2, 'Application development & reporting': 1 }, createdAt: iso(162) },
    { id: uid(), name: '', dept: 'Sales', ratings: { 'Copilot in the web': 2, 'Copilot within M365 apps': 2, 'Agents built by standard Copilot': 1, 'Advanced agents & workflows': 1, 'Application development & reporting': 2 }, createdAt: iso(160) }
  ];

  return { demoGoals, demoGroups, demoIdeas, demoSkills };
}

document.getElementById('loadDemoBtn').addEventListener('click', () => {
  if ((groups.length || ideas.length || skills.length || goals.length) &&
      !confirm('This will ADD sample David James demo data alongside anything already captured. Continue?')) return;

  const demo = buildDemoData();
  goals = [...new Set([...goals, ...demo.demoGoals])];
  groups = [...groups, ...demo.demoGroups];
  ideas = [...ideas, ...demo.demoIdeas];
  skills = [...skills, ...demo.demoSkills];

  save(STORE.goals, goals); save(STORE.groups, groups);
  save(STORE.ideas, ideas); save(STORE.skills, skills);

  renderDashboard(); populateGoalDatalist();
  alert('Demo data loaded — explore the Dashboard, Ideas Board, and Live Projects sections.');
});

document.getElementById('clearDemoBtn').addEventListener('click', () => {
  if (!confirm('This will permanently delete ALL data in this browser (goals, groups, ideas, skills). Continue?')) return;
  goals = []; groups = []; ideas = []; skills = [];
  save(STORE.goals, goals); save(STORE.groups, groups);
  save(STORE.ideas, ideas); save(STORE.skills, skills);
  renderDashboard(); populateGoalDatalist();
});

/* ============================== Agenda ============================== */

function renderAgenda() {
  document.getElementById('agendaTimeline').innerHTML = AGENDA.map(item => `
    <div class="timeline-item">
      <div class="timeline-time">${escapeHtml(item.time)}</div>
      <div class="timeline-title">${escapeHtml(item.title)}</div>
      <div class="timeline-detail">${escapeHtml(item.detail)}</div>
    </div>
  `).join('');
}

/* ============================== Art of the possible ============================== */

function renderPossible() {
  document.getElementById('possibleGrid').innerHTML = POSSIBLE.map(p => `
    <div class="possible-card">
      <span class="p-icon">${p.icon}</span>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.desc)}</p>
      <ul>${p.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
    </div>
  `).join('');
}

/* ============================== Skills & Confidence ============================== */

function buildSkillRatingInputs() {
  document.getElementById('skillRatings').innerHTML = SKILL_AREAS.map((area, idx) => `
    <label>${escapeHtml(area)} — confidence (1 = never used it, 5 = very confident)
      <select data-area="${idx}" required>
        <option value="">Select…</option>
        <option value="1">1 — Never used it</option>
        <option value="2">2 — Rarely</option>
        <option value="3">3 — Sometimes</option>
        <option value="4">4 — Often</option>
        <option value="5">5 — Very confident</option>
      </select>
    </label>
  `).join('');
}

document.getElementById('skillForm').addEventListener('submit', e => {
  e.preventDefault();
  const ratings = {};
  let complete = true;
  document.querySelectorAll('#skillRatings select').forEach(sel => {
    const area = SKILL_AREAS[sel.dataset.area];
    if (!sel.value) complete = false;
    ratings[area] = Number(sel.value) || 0;
  });
  if (!complete) { alert('Please rate every area before submitting.'); return; }

  skills.push({
    id: uid(),
    name: document.getElementById('skillName').value.trim(),
    dept: document.getElementById('skillDept').value.trim(),
    ratings,
    createdAt: new Date().toISOString()
  });
  save(STORE.skills, skills);
  e.target.reset();
  buildSkillRatingInputs();
  renderSkills();
});

function renderSkills() {
  buildSkillRatingInputs();
  document.getElementById('skillRespondents').textContent = skills.length;

  document.getElementById('skillChart').innerHTML = SKILL_AREAS.map(area => {
    const values = skills.map(s => Number(s.ratings?.[area] || 0)).filter(v => v > 0);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const pct = (avg / 5) * 100;
    return `
      <div class="chart-row">
        <span class="chart-label">${escapeHtml(area)}</span>
        <div class="chart-track"><div class="chart-fill" style="width:${pct}%"></div></div>
        <span class="chart-value">${values.length ? avg.toFixed(1) : '—'}</span>
      </div>
    `;
  }).join('');
}

/* ============================== Groups ============================== */

function populateTopicSelect(selectEl, includeBlank, blankLabel) {
  selectEl.innerHTML =
    (includeBlank ? `<option value="">${blankLabel}</option>` : '') +
    TOPICS.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
}

document.getElementById('groupForm').addEventListener('submit', e => {
  e.preventDefault();
  groups.push({
    id: uid(),
    name: document.getElementById('groupNameInput').value.trim(),
    members: document.getElementById('groupMembers').value.trim(),
    topic: document.getElementById('groupTopic').value,
    createdAt: new Date().toISOString()
  });
  save(STORE.groups, groups);
  e.target.reset();
  renderGroups();
  populateIdeaGroupSelect();
});

function renderGroups() {
  populateTopicSelect(document.getElementById('groupTopic'), true, 'No specific topic');

  document.getElementById('groupCountBadge').textContent = groups.length;
  document.getElementById('groupList').innerHTML = groups.length ? groups.map(g => `
    <div class="entity-card">
      <h4>${escapeHtml(g.name)}</h4>
      ${g.topic ? `<div class="meta">Focus: ${escapeHtml(g.topic)}</div>` : ''}
      ${g.members ? `<div class="desc">👥 ${escapeHtml(g.members)}</div>` : ''}
      <div class="actions">
        <button data-action="delete-group" data-id="${g.id}" class="danger">Delete</button>
      </div>
    </div>
  `).join('') : '<p class="empty-msg">No groups yet — add your breakout groups here.</p>';

  document.querySelectorAll('[data-action="delete-group"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Delete this group? Ideas already linked to it will keep its name but lose the link.')) return;
      groups = groups.filter(g => g.id !== btn.dataset.id);
      save(STORE.groups, groups);
      renderGroups();
      populateIdeaGroupSelect();
    });
  });
}

/* ============================== Ideas Board ============================== */

function populateIdeaGroupSelect() {
  const sel = document.getElementById('ideaGroup');
  sel.innerHTML = '<option value="">No group / General</option>' +
    groups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');
}

function populateGoalDatalist() {
  document.getElementById('goalDatalist').innerHTML =
    goals.map(g => `<option value="${escapeHtml(g)}">`).join('');
}

document.getElementById('ideaForm').addEventListener('submit', e => {
  e.preventDefault();
  const groupId = document.getElementById('ideaGroup').value;
  const group = groups.find(g => g.id === groupId);
  ideas.push({
    id: uid(),
    groupId: groupId || null,
    groupName: group ? group.name : 'General',
    topic: document.getElementById('topic').value,
    title: document.getElementById('title').value.trim(),
    businessGoal: document.getElementById('businessGoal').value.trim(),
    description: document.getElementById('description').value.trim(),
    impact: document.getElementById('impact').value.trim(),
    stage: 'idea',
    demoPlan: '', presenter: '',
    projectOwner: '', projectStatus: 'Not started', projectNotes: '',
    createdAt: new Date().toISOString()
  });
  save(STORE.ideas, ideas);
  e.target.reset();
  renderIdeas();
});

document.getElementById('filterTopic').addEventListener('change', renderIdeas);

function renderIdeas() {
  populateIdeaGroupSelect();
  populateGoalDatalist();
  populateTopicSelect(document.getElementById('topic'), true, 'Select a topic…');

  const filterSel = document.getElementById('filterTopic');
  const current = filterSel.value;
  filterSel.innerHTML = '<option value="">All topics</option>' +
    TOPICS.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  filterSel.value = current;

  const topicFilter = filterSel.value;
  const visible = ideas.filter(i => i.stage !== 'live' && (!topicFilter || i.topic === topicFilter));
  const ideaOnly = visible.filter(i => i.stage === 'idea');
  const shortlisted = visible.filter(i => i.stage === 'shortlisted');

  document.getElementById('ideaCount').textContent = ideaOnly.length;
  document.getElementById('shortlistCount').textContent = shortlisted.length;
  document.getElementById('countSummary').textContent = `${visible.length} shown of ${ideas.length} total`;

  document.getElementById('ideaColumn').innerHTML = ideaOnly.length
    ? ideaOnly.map(renderIdeaCard).join('') : '<p class="empty-msg">No ideas yet.</p>';
  document.getElementById('shortlistColumn').innerHTML = shortlisted.length
    ? shortlisted.map(renderIdeaCard).join('') : '<p class="empty-msg">No shortlisted ideas yet.</p>';

  document.querySelectorAll('[data-idea-action]').forEach(btn => btn.addEventListener('click', onIdeaAction));
}

function renderIdeaCard(i) {
  return `
    <div class="entity-card idea-card ${i.stage}">
      <h4>${escapeHtml(i.title)}</h4>
      <div class="meta">${escapeHtml(i.groupName)} &middot; ${escapeHtml(i.topic)}</div>
      ${i.businessGoal ? `<div class="desc"><strong>Goal:</strong> ${escapeHtml(i.businessGoal)}</div>` : ''}
      ${i.description ? `<div class="desc">${escapeHtml(i.description)}</div>` : ''}
      ${i.impact ? `<div class="desc"><strong>Impact:</strong> ${escapeHtml(i.impact)}</div>` : ''}
      <div class="actions">
        ${i.stage === 'idea'
          ? `<button data-idea-action="shortlist" data-id="${i.id}">⭐ Shortlist</button>`
          : `<button data-idea-action="unshortlist" data-id="${i.id}">↩ Move back</button>
             <button data-idea-action="promote" data-id="${i.id}" class="primary">🚀 Move to Live Projects</button>`}
        <button data-idea-action="delete" data-id="${i.id}" class="danger">Delete</button>
      </div>
    </div>
  `;
}

function onIdeaAction(e) {
  const { ideaAction, id } = e.target.dataset;
  const idea = ideas.find(i => i.id === id);
  if (!idea) return;
  if (ideaAction === 'shortlist') idea.stage = 'shortlisted';
  if (ideaAction === 'unshortlist') idea.stage = 'idea';
  if (ideaAction === 'promote') { idea.stage = 'live'; idea.projectStatus = 'Not started'; }
  if (ideaAction === 'delete') {
    if (!confirm(`Delete "${idea.title}"?`)) return;
    ideas = ideas.filter(i => i.id !== id);
  }
  save(STORE.ideas, ideas);
  renderIdeas();
  renderProjects();
  renderDashboard();
}

/* ============================== Live Projects ============================== */

function renderProjects() {
  const live = ideas.filter(i => i.stage === 'live');
  const cols = { 'Not started': [], 'In progress': [], 'Complete': [] };
  live.forEach(i => (cols[i.projectStatus] || cols['Not started']).push(i));

  document.getElementById('countNotStarted').textContent = cols['Not started'].length;
  document.getElementById('countInProgress').textContent = cols['In progress'].length;
  document.getElementById('countComplete').textContent = cols['Complete'].length;

  document.getElementById('colNotStarted').innerHTML = renderProjectCards(cols['Not started']);
  document.getElementById('colInProgress').innerHTML = renderProjectCards(cols['In progress']);
  document.getElementById('colComplete').innerHTML = renderProjectCards(cols['Complete']);

  document.querySelectorAll('[data-project-action]').forEach(btn => btn.addEventListener('click', onProjectAction));
}

function renderProjectCards(list) {
  if (!list.length) return '<p class="empty-msg">Nothing here yet.</p>';
  return list.map(i => `
    <div class="entity-card project-card">
      <h4>${escapeHtml(i.title)}</h4>
      <div class="meta">${escapeHtml(i.groupName)} &middot; ${escapeHtml(i.topic)}</div>
      ${i.businessGoal ? `<div class="desc"><strong>Goal:</strong> ${escapeHtml(i.businessGoal)}</div>` : ''}
      <div class="desc"><strong>Owner:</strong> ${escapeHtml(i.projectOwner || '—')}</div>
      <div class="desc"><strong>Demo plan:</strong> ${escapeHtml(i.demoPlan || '—')}</div>
      <div class="desc"><strong>Presenter:</strong> ${escapeHtml(i.presenter || '—')}</div>
      ${i.projectNotes ? `<div class="desc"><strong>Notes:</strong> ${escapeHtml(i.projectNotes)}</div>` : ''}
      <div class="actions">
        <button data-project-action="edit-owner" data-id="${i.id}">Edit owner</button>
        <button data-project-action="edit-demo" data-id="${i.id}">Edit demo plan</button>
        <button data-project-action="edit-presenter" data-id="${i.id}">Edit presenter</button>
        <button data-project-action="edit-notes" data-id="${i.id}">Edit notes</button>
        ${i.projectStatus !== 'In progress' ? `<button data-project-action="set-in-progress" data-id="${i.id}" class="primary">Mark in progress</button>` : ''}
        ${i.projectStatus !== 'Complete' ? `<button data-project-action="set-complete" data-id="${i.id}" class="primary">Mark complete</button>` : ''}
        ${i.projectStatus !== 'Not started' ? `<button data-project-action="set-not-started" data-id="${i.id}">Reset status</button>` : ''}
        <button data-project-action="demote" data-id="${i.id}">↩ Back to shortlist</button>
      </div>
    </div>
  `).join('');
}

function onProjectAction(e) {
  const { projectAction, id } = e.target.dataset;
  const idea = ideas.find(i => i.id === id);
  if (!idea) return;

  const prompts = {
    'edit-owner': ['Project owner / presenter lead:', 'projectOwner'],
    'edit-demo': ['Demo scenario / test plan:', 'demoPlan'],
    'edit-presenter': ['Presenter(s) for the showcase:', 'presenter'],
    'edit-notes': ['Notes:', 'projectNotes']
  };
  if (prompts[projectAction]) {
    const [label, field] = prompts[projectAction];
    const val = prompt(label, idea[field] || '');
    if (val !== null) idea[field] = val.trim();
  }
  if (projectAction === 'set-in-progress') idea.projectStatus = 'In progress';
  if (projectAction === 'set-complete') idea.projectStatus = 'Complete';
  if (projectAction === 'set-not-started') idea.projectStatus = 'Not started';
  if (projectAction === 'demote') idea.stage = 'shortlisted';

  save(STORE.ideas, ideas);
  renderProjects();
  renderIdeas();
  renderDashboard();
}

document.getElementById('printBtn').addEventListener('click', () => {
  const live = ideas.filter(i => i.stage === 'live');
  if (!live.length) { alert('No live projects to print yet.'); return; }
  document.getElementById('printArea').innerHTML = live.map(i => `
    <div class="print-card">
      <div class="print-meta">${escapeHtml(i.groupName)} &middot; ${escapeHtml(i.topic)}</div>
      <h2>${escapeHtml(i.title)}</h2>
      <div class="print-section"><h4>Business goal</h4><p>${escapeHtml(i.businessGoal || '—')}</p></div>
      <div class="print-section"><h4>Description</h4><p>${escapeHtml(i.description || '—')}</p></div>
      <div class="print-section"><h4>Demo scenario</h4><p>${escapeHtml(i.demoPlan || '—')}</p></div>
      <div class="print-section"><h4>Owner</h4><p>${escapeHtml(i.projectOwner || '—')}</p></div>
      <div class="print-section"><h4>Presenter(s)</h4><p>${escapeHtml(i.presenter || '—')}</p></div>
    </div>
  `).join('');
  window.print();
});

/* ============================== Init ============================== */

navigate();
