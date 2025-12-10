// Job Logger Floating Button Content Script

let floatingButton = null;
let isEnabled = false;

// Initialize on page load
(async function init() {
  console.log('Job Logger content script loaded');

  // Check if floating button is enabled
  const result = await chrome.storage.local.get(['floatingButtonEnabled']);
  isEnabled = result.floatingButtonEnabled || false;

  console.log('Floating button enabled:', isEnabled);

  if (isEnabled) {
    createFloatingButton();
  }
})();

// Listen for toggle changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.floatingButtonEnabled) {
    isEnabled = changes.floatingButtonEnabled.newValue;
    if (isEnabled) {
      createFloatingButton();
    } else {
      removeFloatingButton();
    }
  }
});

// Create the floating button
function createFloatingButton() {
  // Don't create if already exists
  if (floatingButton) return;

  floatingButton = document.createElement('button');
  floatingButton.id = 'job-logger-float-btn';
  floatingButton.innerHTML = '📝';
  floatingButton.title = 'Quick Log Job Application';
  floatingButton.addEventListener('click', handleQuickLog);

  document.body.appendChild(floatingButton);
}

// Remove the floating button
function removeFloatingButton() {
  if (floatingButton) {
    floatingButton.remove();
    floatingButton = null;
  }
}

// Handle quick log click
async function handleQuickLog() {
  // Extract job details from page
  const jobDetails = extractJobDetails();

  // If we successfully extracted both company and role, save directly
  if (jobDetails.company && jobDetails.role) {
    await saveApplicationDirect(jobDetails.company, jobDetails.role, jobDetails.url);
  } else {
    // Otherwise show modal for manual input
    showModal(jobDetails);
  }
}

// Extract job details from the current page
function extractJobDetails() {
  const url = window.location.href;
  let company = '';
  let role = '';

  // LinkedIn
  if (url.includes('linkedin.com')) {
    company = document.querySelector('.job-details-jobs-unified-top-card__company-name a, .topcard__org-name-link')?.textContent?.trim() || '';
    role = document.querySelector('.job-details-jobs-unified-top-card__job-title, .topcard__title')?.textContent?.trim() || '';
  }

  // Indeed
  else if (url.includes('indeed.com')) {
    company = document.querySelector('[data-testid="inlineHeader-companyName"], .icl-u-lg-mr--sm')?.textContent?.trim() || '';
    role = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"], .jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
  }

  // Greenhouse
  else if (url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) {
    company = document.querySelector('.company-name')?.textContent?.trim() || '';
    role = document.querySelector('.app-title')?.textContent?.trim() || '';
  }

  // Lever
  else if (url.includes('lever.co')) {
    company = document.querySelector('.main-header-text a')?.textContent?.trim() || '';
    role = document.querySelector('.posting-headline h2')?.textContent?.trim() || '';
  }

  // Workday
  else if (url.includes('myworkdayjobs.com')) {
    company = document.querySelector('[data-automation-id="company"]')?.textContent?.trim() || '';
    role = document.querySelector('[data-automation-id="jobPostingHeader"]')?.textContent?.trim() || '';
  }

  // Generic fallback - try common patterns
  if (!company || !role) {
    // Try to find company in title or meta tags
    if (!company) {
      company = document.querySelector('meta[property="og:site_name"]')?.content ||
                document.querySelector('h1')?.textContent?.trim() || '';
    }

    // Try to find role in title or h1
    if (!role) {
      const title = document.title;
      role = title.split('|')[0]?.split('-')[0]?.trim() ||
             document.querySelector('h1')?.textContent?.trim() || '';
    }
  }

  return { company, role, url };
}

// Show modal for editing details
function showModal(jobDetails) {
  // Create modal if doesn't exist
  let modal = document.getElementById('job-logger-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'job-logger-modal';
    modal.innerHTML = `
      <div id="job-logger-modal-content">
        <h2>📝 Log Job Application</h2>
        <div>
          <label for="job-logger-company">Company</label>
          <input type="text" id="job-logger-company" placeholder="Company name">
        </div>
        <div>
          <label for="job-logger-role">Role</label>
          <input type="text" id="job-logger-role" placeholder="Job title/role">
        </div>
        <div id="job-logger-modal-buttons">
          <button id="job-logger-cancel-btn">Cancel</button>
          <button id="job-logger-save-btn">Save Application</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('job-logger-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('job-logger-save-btn').addEventListener('click', saveApplication);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Populate fields
  document.getElementById('job-logger-company').value = jobDetails.company;
  document.getElementById('job-logger-role').value = jobDetails.role;

  // Store URL for later
  modal.dataset.url = jobDetails.url;

  // Show modal
  modal.classList.add('show');

  // Focus on first empty field
  if (!jobDetails.company) {
    document.getElementById('job-logger-company').focus();
  } else if (!jobDetails.role) {
    document.getElementById('job-logger-role').focus();
  } else {
    document.getElementById('job-logger-company').focus();
  }
}

// Close modal
function closeModal() {
  const modal = document.getElementById('job-logger-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// Save application directly without modal
async function saveApplicationDirect(company, role, url) {
  // Create application object
  const application = {
    id: Date.now(),
    company,
    role,
    url,
    date: new Date().toISOString()
  };

  // Get existing applications
  const result = await chrome.storage.local.get(['applications', 'gamification']);
  const applications = result.applications || [];
  const gamification = result.gamification || { streak: 0, lastApplicationDate: null };

  // Add new application
  applications.unshift(application);

  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  if (!gamification.lastApplicationDate) {
    gamification.streak = 1;
    gamification.lastApplicationDate = todayStr;
  } else {
    const lastDate = new Date(gamification.lastApplicationDate);
    lastDate.setHours(0, 0, 0, 0);
    const lastDateStr = lastDate.toISOString().split('T')[0];

    if (lastDateStr !== todayStr) {
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        gamification.streak++;
      } else if (daysDiff > 1) {
        gamification.streak = 1;
      }
      gamification.lastApplicationDate = todayStr;
    }
  }

  // Save to storage
  await chrome.storage.local.set({ applications, gamification });

  // Show success notification
  showNotification(company, role);
}

// Save application from modal
async function saveApplication() {
  const company = document.getElementById('job-logger-company').value.trim();
  const role = document.getElementById('job-logger-role').value.trim();
  const modal = document.getElementById('job-logger-modal');
  const url = modal.dataset.url;

  if (!company || !role) {
    alert('Please fill in both company and role!');
    return;
  }

  // Close modal
  closeModal();

  // Use the direct save function
  await saveApplicationDirect(company, role, url);
}

// Show success notification
function showNotification(company, role) {
  // Create notification if doesn't exist
  let notification = document.getElementById('job-logger-notification');

  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'job-logger-notification';
    document.body.appendChild(notification);
  }

  // Update notification content
  if (company && role) {
    notification.innerHTML = `<span class="icon">✅</span> Logged: ${role} at ${company}`;
  } else {
    notification.innerHTML = '<span class="icon">✅</span> Application logged successfully!';
  }

  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}
