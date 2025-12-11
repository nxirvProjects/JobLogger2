# Job Application Tracker

A Chrome extension for tracking job applications with gamification features to keep you motivated during your job search.

## Features

### 📝 Application Management
- **Quick Logging**: Log applications with company name, role, and URL
- **Floating Button**: Toggle-enabled floating button on all web pages for instant logging
- **Auto-Extraction**: Automatically extracts company and role from job boards:
  - LinkedIn
  - Indeed
  - Greenhouse
  - Lever
  - Workday
- **Search & Filter**: Search applications by company or role
- **Edit & Delete**: Manage your application history
- **CSV Import/Export**: Back up and restore your data
- **Clear All Data**: Reset all applications and stats with a confirmation prompt (in Danger Zone)

### 🎮 Gamification Features

#### 🏆 Daily Badge System
- Earn badges based on applications submitted today (resets daily)
- Badge tiers: Bronze (1+), Silver (3+), Gold (5+), Platinum (8+), Diamond (10+), Legendary (15+)
- Displayed in header with glowing effects
- Motivates consistent daily application efforts

#### 📊 Level & XP System
- Earn 10 XP per application
- Level up every 100 XP (10 applications)
- Progress bar shows current level advancement
- Level titles:
  - Beginner Job Hunter (1-4)
  - Active Applicant (5-9)
  - Job Search Pro (10-19)
  - Application Master (20-29)
  - Career Seeker Elite (30-49)
  - Legendary Job Hunter (50)

#### ⭐ Prestige System
- Prestige every 500 applications (50 levels)
- Level resets but you earn prestige stars
- Infinite progression system
- Stars displayed next to level title with golden glow

#### 🔥 Streak Counter
- Tracks consecutive days of applying
- Breaks if you skip more than 1 day
- Fire icon grows and glows based on streak length:
  - 7+ days: Enhanced glow
  - 14+ days: Stronger glow
  - 30+ days: Maximum glow effect

#### 📈 Application Stats
- **This Week**: Applications in the current week
- **This Month**: Applications in the current month
- **Weekly Average**: Average applications per week since you started
- **Total**: Total applications logged

### 🔗 My Links
- Save frequently used links (job boards, company pages, etc.)
- Quick access to important URLs
- Copy links to clipboard with one click

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the Job_Logger folder

## Usage

### Logging Applications

**Method 1: Manual Log**
1. Click the extension icon
2. Click "+ Log Current"
3. Enter company name and role
4. Application is saved with current URL

**Method 2: Floating Button**
1. Enable "Quick Log Button" toggle in the extension
2. Navigate to a job posting page
3. Click the floating 📝 button on the page
4. If on a supported job board, details auto-fill
5. Otherwise, manually enter company and role

### Viewing Stats
1. Click the extension icon
2. Navigate to the "Stats" tab
3. View your level, XP, streak, daily badge, and statistics

### Managing Links
1. Click the extension icon
2. Navigate to the "My Links" tab
3. Click "+ Add New Link" to save a link
4. Use the copy button to copy links to clipboard

### Import/Export Data
- **Export**: Click "Export CSV" to download your application data
- **Import**: Click "Import CSV" and select a previously exported file
- Stats automatically update to accommodate imported applications

### Clearing Data
- Navigate to the "Stats" tab
- Scroll to the "Danger Zone" section
- Click "Clear All Data" to permanently delete all applications and reset stats
- Your saved links will be preserved
- A confirmation modal will appear before deletion

## Data Storage

All data is stored locally using Chrome's sync storage API:
- Applications list
- Saved links
- Gamification progress (level, XP, prestige, streak)

Data syncs across your Chrome browsers when signed in to the same Google account.

## Privacy

- No data is sent to external servers
- All data stays in your Chrome sync storage
- URLs are only stored locally for your reference

## Technical Details

- **Manifest Version**: 3
- **Permissions**: storage, activeTab, scripting
- **Content Scripts**: Injected on all URLs for floating button functionality
- **Browser**: Chrome (Chromium-based browsers)
- **UI/UX**: Custom modal system replaces native browser alerts for better styling and user experience

## Development

### File Structure
```
Job_Logger/
├── manifest.json       # Extension configuration
├── popup.html          # Main UI
├── popup.js            # Core logic and gamification
├── styles.css          # Styling
├── content.js          # Floating button & auto-extraction
├── content.css         # Floating button styling
├── icons/              # Extension icons (16px, 48px, 128px)
└── README.md           # Documentation
```

### Key Functions
- `loadData()`: Loads applications, links, and gamification state
- `saveApplications()`: Saves applications to storage
- `updateLevelAndXP()`: Calculates level, XP, and prestige
- `updateStreak()`: Calculates consecutive day streak with proper date handling
- `calculateDailyBadge()`: Determines today's badge tier
- `extractJobDetails()`: Auto-extracts job info from supported sites
- `clearAllData()`: Resets all applications and gamification stats
- `showCustomModal()`: Custom modal system for alerts, prompts, and confirmations

## Recent Updates

- ✅ **Custom Modal System**: Replaced native browser alerts with styled custom modals
- ✅ **Clear All Data**: Added ability to reset applications and stats (Danger Zone)
- ✅ **Extension Icons**: Added proper Chrome extension icons (16px, 48px, 128px)
- ✅ **Streak Bug Fixes**: Improved streak calculation for accurate consecutive day tracking
- ✅ **CSV Import Improvements**: Stats now properly recalculate when importing applications

## Future Enhancements

- Application status tracking (applied, interviewing, rejected, offer)
- Interview date reminders
- Application notes and follow-up tracking
- More job board integrations
- Data visualization and analytics

## Credits

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

## License

MIT License - Feel free to use and modify as needed.
