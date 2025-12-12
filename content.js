// Job Logger Floating Button Content Script

let floatingButton = null;
let isEnabled = false;

// Helper functions for XP system
function getStreakMultiplier(streak) {
  if (streak >= 30) return 3.0;
  if (streak >= 14) return 2.0;
  if (streak >= 7) return 1.5;
  return 1.0;
}

function addActivityLog(gamification, type, message, xpChange) {
  if (!gamification.activityLog) {
    gamification.activityLog = [];
  }

  gamification.activityLog.unshift({
    timestamp: new Date().toISOString(),
    type: type,
    message: message,
    xpChange: xpChange
  });

  // Keep only last 50 entries
  if (gamification.activityLog.length > 50) {
    gamification.activityLog = gamification.activityLog.slice(0, 50);
  }
}

function updateLevelAndXP(gamification) {
  const totalXP = gamification.totalXPEarned || 0;

  // Calculate prestige (every 5000 XP = 1 prestige)
  const prestige = Math.floor(totalXP / 5000);
  const xpAfterPrestige = totalXP % 5000;

  // Calculate level (100 XP per level)
  const level = Math.floor(xpAfterPrestige / 100) + 1;
  const currentLevelXP = xpAfterPrestige % 100;

  const oldLevel = gamification.level;
  gamification.prestige = prestige;
  gamification.level = level;
  gamification.xp = currentLevelXP;

  // Check for level up and log it
  if (oldLevel && level > oldLevel) {
    const levelTitle = getLevelTitle(level);
    addActivityLog(gamification, 'level_up', `Level up! Now Level ${level} - ${levelTitle}`, 0);
  }
}

function getLevelTitle(level) {
  if (level >= 50) return "Legendary Job Hunter";
  if (level >= 30) return "Career Seeker Elite";
  if (level >= 20) return "Application Master";
  if (level >= 10) return "Job Search Pro";
  if (level >= 5) return "Active Applicant";
  return "Beginner Job Hunter";
}

function awardXP(gamification, baseXP, reason = 'application') {
  const multiplier = getStreakMultiplier(gamification.streak || 0);
  const xpEarned = Math.floor(baseXP * multiplier);

  gamification.totalXPEarned = (gamification.totalXPEarned || 0) + xpEarned;

  // Create log message
  let message = `Gained ${xpEarned} XP for ${reason}`;
  if (multiplier > 1.0) {
    message += ` (${multiplier}x streak bonus)`;
  }

  addActivityLog(gamification, 'xp_gain', message, xpEarned);
  updateLevelAndXP(gamification);
}

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

// Get daily badge based on today's application count
async function getDailyBadge() {
  const result = await chrome.storage.local.get(['applications']);
  const applications = result.applications || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Count applications from today
  const todayApps = applications.filter(app => {
    const appDate = new Date(app.date);
    if (isNaN(appDate.getTime())) return false;
    appDate.setHours(0, 0, 0, 0);
    return appDate.toISOString().split('T')[0] === todayStr;
  }).length;

  // Determine badge based on count
  let badge = {
    name: 'No Badge Yet',
    icon: '📝',
    color: '#9ca3af'
  };

  if (todayApps >= 15) {
    badge = { name: 'Legendary', icon: '⚡', color: '#8b5cf6' };
  } else if (todayApps >= 10) {
    badge = { name: 'Diamond', icon: '💠', color: '#06b6d4' };
  } else if (todayApps >= 8) {
    badge = { name: 'Platinum', icon: '💎', color: '#a855f7' };
  } else if (todayApps >= 5) {
    badge = { name: 'Gold', icon: '🥇', color: '#eab308' };
  } else if (todayApps >= 3) {
    badge = { name: 'Silver', icon: '🥈', color: '#94a3b8' };
  } else if (todayApps >= 1) {
    badge = { name: 'Bronze', icon: '🥉', color: '#c2410c' };
  }

  return { ...badge, count: todayApps };
}

// Update floating button appearance based on daily badge
async function updateFloatingButtonAppearance() {
  if (!floatingButton) return;

  const badge = await getDailyBadge();
  floatingButton.innerHTML = badge.icon;
  floatingButton.title = `Quick Log Job Application - ${badge.name} (${badge.count} today)`;
  floatingButton.style.backgroundColor = badge.color;

  // Add glow effect for higher badges
  if (badge.count >= 10) {
    floatingButton.style.boxShadow = `0 4px 20px ${badge.color}80, 0 0 40px ${badge.color}40`;
  } else if (badge.count >= 5) {
    floatingButton.style.boxShadow = `0 4px 15px ${badge.color}60, 0 0 30px ${badge.color}30`;
  } else if (badge.count >= 3) {
    floatingButton.style.boxShadow = `0 4px 10px ${badge.color}40`;
  } else {
    floatingButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  }
}

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

  // Update appearance based on daily badge
  updateFloatingButtonAppearance();
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
  const gamification = result.gamification || {
    streak: 0,
    lastApplicationDate: null,
    level: 1,
    xp: 0,
    prestige: 0,
    longestStreak: 0,
    totalXPEarned: 0,
    weeklyStats: [],
    lastWeeklyCheck: null,
    activityLog: []
  };

  // Add new application
  applications.unshift(application);

  // Update streak
  const today = new Date();
  // Get local date string in YYYY-MM-DD format without timezone conversion
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (!gamification.lastApplicationDate) {
    gamification.streak = 1;
    gamification.lastApplicationDate = todayStr;
    // Update longest streak if current streak is higher
    if (gamification.streak > (gamification.longestStreak || 0)) {
      gamification.longestStreak = gamification.streak;
    }
  } else {
    // Parse the last application date and get local date string
    const lastDate = new Date(gamification.lastApplicationDate);
    const lastYear = lastDate.getFullYear();
    const lastMonth = String(lastDate.getMonth() + 1).padStart(2, '0');
    const lastDay = String(lastDate.getDate()).padStart(2, '0');
    const lastDateStr = `${lastYear}-${lastMonth}-${lastDay}`;

    if (lastDateStr === todayStr) {
      // Already applied today, streak stays the same
      // DO NOT update longestStreak here - no change to current streak
      // This prevents the bug where filling in missing fields increments longestStreak
    } else {
      // Calculate day difference using local dates
      const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastDateLocal = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      const daysDiff = Math.floor((todayLocal - lastDateLocal) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        gamification.streak++;
      } else if (daysDiff > 1) {
        // Streak broken, restart
        gamification.streak = 1;
      }
      gamification.lastApplicationDate = todayStr;

      // Update longest streak if current streak is higher
      if (gamification.streak > (gamification.longestStreak || 0)) {
        gamification.longestStreak = gamification.streak;
      }
    }
  }

  // Award XP with streak multiplier
  awardXP(gamification, 10, '1 application');

  // Save to storage
  await chrome.storage.local.set({ applications, gamification });

  // Update floating button appearance
  await updateFloatingButtonAppearance();

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
