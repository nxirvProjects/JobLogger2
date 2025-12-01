// State management
let applications = [];
let links = [];
let currentView = 'applications';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
});

// Load data from chrome storage
async function loadData() {
  const result = await chrome.storage.sync.get(['applications', 'links']);
  applications = result.applications || [];
  links = result.links || [];
  renderApplications();
  renderLinks();
  updateStats();
}

// Save data to chrome storage
async function saveApplications() {
  await chrome.storage.sync.set({ applications });
  renderApplications();
  updateStats();
}

async function saveLinks() {
  await chrome.storage.sync.set({ links });
  renderLinks();
}

// Event Listeners
function setupEventListeners() {
  // Tab switching
  document.getElementById('tabApplications').addEventListener('click', () => switchTab('applications'));
  document.getElementById('tabLinks').addEventListener('click', () => switchTab('links'));

  // Applications actions
  document.getElementById('logCurrentBtn').addEventListener('click', logCurrentJob);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('csvFileInput').click());
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);
  document.getElementById('csvFileInput').addEventListener('change', importFromCSV);
  document.getElementById('searchInput').addEventListener('input', filterApplications);

  // Links actions
  document.getElementById('addLinkBtn').addEventListener('click', addNewLink);
}

// Tab switching
function switchTab(tab) {
  currentView = tab;
  const appTab = document.getElementById('tabApplications');
  const linksTab = document.getElementById('tabLinks');
  const appView = document.getElementById('applicationsView');
  const linksView = document.getElementById('linksView');

  if (tab === 'applications') {
    appTab.classList.add('active');
    linksTab.classList.remove('active');
    appView.classList.remove('hidden');
    linksView.classList.add('hidden');
  } else {
    linksTab.classList.add('active');
    appTab.classList.remove('active');
    linksView.classList.remove('hidden');
    appView.classList.add('hidden');
  }
}

// Log current job
async function logCurrentJob() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const company = prompt('Company name:');
  if (!company) return;
  
  const role = prompt('Role/Job title:');
  if (!role) return;

  const application = {
    id: Date.now(),
    company,
    role,
    url: tab.url,
    date: new Date().toISOString()
  };

  applications.unshift(application);
  await saveApplications();
}

// Render applications
function renderApplications(filter = '') {
  const container = document.getElementById('applicationsList');
  const filteredApps = applications.filter(app => 
    app.company.toLowerCase().includes(filter.toLowerCase()) ||
    app.role.toLowerCase().includes(filter.toLowerCase())
  );

  if (filteredApps.length === 0) {
    container.innerHTML = '<p class="empty-state">No applications yet. Click "Log Current" to add one!</p>';
    return;
  }

  container.innerHTML = filteredApps.map(app => createApplicationCard(app)).join('');

  // Add event listeners for edit and delete
  filteredApps.forEach(app => {
    document.getElementById(`edit-${app.id}`).addEventListener('click', () => editApplication(app.id));
    document.getElementById(`delete-${app.id}`).addEventListener('click', () => deleteApplication(app.id));
  });
}

// Create application card HTML
function createApplicationCard(app) {
  const date = new Date(app.date);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const colors = ['color-blue', 'color-purple', 'color-green', 'color-pink', 'color-amber'];
  const color = colors[app.id % colors.length];

  return `
    <div class="app-card">
      <div class="app-card-header">
        <div class="app-card-title">
          <div class="color-dot ${color}"></div>
          <h3>${app.company}</h3>
        </div>
        <div class="app-card-actions">
          <button id="edit-${app.id}" class="icon-btn edit">✏️ Edit</button>
          <button id="delete-${app.id}" class="icon-btn delete">🗑</button>
        </div>
      </div>
      <p class="app-card-role">${app.role}</p>
      <p class="app-card-date">📅 ${formattedDate} at ${formattedTime}</p>
      <a href="${app.url}" target="_blank" class="app-card-url">🔗 ${app.url}</a>
    </div>
  `;
}

// Edit application
function editApplication(id) {
  const app = applications.find(a => a.id === id);
  if (!app) return;

  const company = prompt('Company name:', app.company);
  if (company === null) return;

  const role = prompt('Role/Job title:', app.role);
  if (role === null) return;

  const url = prompt('Job URL:', app.url);
  if (url === null) return;

  app.company = company;
  app.role = role;
  app.url = url;

  saveApplications();
}

// Delete application
function deleteApplication(id) {
  if (!confirm('Are you sure you want to delete this application?')) return;
  applications = applications.filter(a => a.id !== id);
  saveApplications();
}

// Filter applications
function filterApplications(e) {
  renderApplications(e.target.value);
}

// Update stats
function updateStats() {
  document.getElementById('totalCount').textContent = applications.length;
}

// CSV Import
function importFromCSV(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const csv = event.target.result;
    const lines = csv.split('\n').filter(line => line.trim());
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 3) {
        applications.push({
          id: Date.now() + i,
          company: parts[0],
          role: parts[1],
          date: parts[2] || new Date().toISOString(),
          url: parts[3] || ''
        });
      }
    }
    
    saveApplications();
    alert('CSV imported successfully!');
  };
  
  reader.readAsText(file);
  e.target.value = ''; // Reset input
}

// CSV Export
function exportToCSV() {
  if (applications.length === 0) {
    alert('No applications to export!');
    return;
  }

  const headers = ['Company', 'Role', 'Date', 'URL'];
  const rows = applications.map(app => [
    `"${app.company}"`,
    `"${app.role}"`,
    `"${app.date}"`,
    `"${app.url}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Links functionality
function addNewLink() {
  const label = prompt('Link label (e.g., "LinkedIn Profile"):');
  if (!label) return;

  const url = prompt('URL:');
  if (!url) return;

  links.push({
    id: Date.now(),
    label,
    url
  });

  saveLinks();
}

function renderLinks() {
  const container = document.getElementById('linksList');
  
  if (links.length === 0) {
    container.innerHTML = '<p class="empty-state">No links saved yet. Click "Add New Link" to get started!</p>';
    return;
  }

  container.innerHTML = links.map(link => createLinkCard(link)).join('');

  // Add event listeners
  links.forEach(link => {
    document.getElementById(`copy-${link.id}`).addEventListener('click', () => copyToClipboard(link.url));
    document.getElementById(`edit-link-${link.id}`).addEventListener('click', () => editLink(link.id));
    document.getElementById(`delete-link-${link.id}`).addEventListener('click', () => deleteLink(link.id));
  });
}

function createLinkCard(link) {
  return `
    <div class="link-card">
      <div class="link-card-header">
        <h3>${link.label}</h3>
        <div class="link-card-actions">
          <button id="edit-link-${link.id}" class="icon-btn edit">✏️</button>
          <button id="delete-link-${link.id}" class="icon-btn delete">🗑</button>
        </div>
      </div>
      <p class="link-card-url">${link.url}</p>
      <button id="copy-${link.id}" class="copy-btn">
        📋 Copy
      </button>
    </div>
  `;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  });
}

function editLink(id) {
  const link = links.find(l => l.id === id);
  if (!link) return;

  const label = prompt('Link label:', link.label);
  if (label === null) return;

  const url = prompt('URL:', link.url);
  if (url === null) return;

  link.label = label;
  link.url = url;

  saveLinks();
}

function deleteLink(id) {
  if (!confirm('Are you sure you want to delete this link?')) return;
  links = links.filter(l => l.id !== id);
  saveLinks();
}