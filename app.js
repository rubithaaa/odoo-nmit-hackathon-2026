// DAYFLOW MAIN APPLICATION CONTROLLER
window.App = {
  activeTab: 'pulse',
  user: null,

  async init() {
    // 1. Check Authentication
    if (!TokenService.isAuthenticated()) {
      window.location.href = '/login.html';
      return;
    }

    this.user = TokenService.getUser();

    // Verify session with server
    try {
      const meRes = await api.getMe();
      this.user = meRes.user;
      TokenService.setUser(this.user);
    } catch (err) {
      console.warn('Session check warning:', err.message);
    }

    this.renderUserInterface();
    this.startHeaderClock();

    // Initialize submodules
    Pulse.init();
    AttendanceModule.init();
    LeavesModule.init();
    PayrollModule.init();
    NotificationsModule.init();
    CommandPalette.init();

    if (this.user.role === 'admin') {
      DirectoryModule.init();
      InsightsModule.init();
      ReportsModule.init();
      this.loadAdminCommandCenterSummary();
    }

    // Set initial view from hash or default to 'pulse'
    const hashTab = window.location.hash.replace('#', '');
    if (hashTab && document.getElementById(`view-${hashTab}`)) {
      this.switchTab(hashTab);
    } else {
      this.switchTab('pulse');
    }
  },

  renderUserInterface() {
    const u = this.user;
    if (!u) return;

    // Sidebar User Pill
    const sidebarAvatar = document.getElementById('sidebarUserAvatar');
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarRole = document.getElementById('sidebarUserRole');

    if (sidebarAvatar) sidebarAvatar.src = u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
    if (sidebarName) sidebarName.innerText = u.fullName;
    if (sidebarRole) sidebarRole.innerText = u.role === 'admin' ? 'HR / Administrator' : `${u.department} • Staff`;

    // Role-based visibility toggling
    const adminNavs = document.querySelectorAll('.admin-only-nav');
    const adminViews = document.querySelectorAll('.admin-only-view');
    const employeeViews = document.querySelectorAll('.employee-only-view');

    if (u.role === 'admin') {
      adminNavs.forEach((el) => el.style.display = 'flex');
      adminViews.forEach((el) => el.style.display = 'block');
      employeeViews.forEach((el) => el.style.display = 'none');
    } else {
      adminNavs.forEach((el) => el.style.display = 'none');
      adminViews.forEach((el) => el.style.display = 'none');
      employeeViews.forEach((el) => el.style.display = 'block');
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    window.location.hash = tabName;

    // Update active nav styling
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Update view visibility
    document.querySelectorAll('.view-section').forEach((sec) => {
      sec.style.display = sec.id === `view-${tabName}` ? 'block' : 'none';
    });

    // Update header title
    const titles = {
      pulse: 'Dayflow Pulse',
      attendance: 'Attendance Hub',
      leaves: 'Leave Management',
      payroll: 'Payroll & Compensation',
      directory: 'Employee Directory',
      insights: 'Dayflow Insights',
      reports: 'Analytics & Reports',
      notifications: 'Notification Center',
    };

    const headerTitle = document.getElementById('headerPageTitle');
    if (headerTitle) headerTitle.innerText = titles[tabName] || 'Workspace';

    // Refresh view-specific content
    if (tabName === 'pulse') Pulse.init();
    else if (tabName === 'attendance') AttendanceModule.init();
    else if (tabName === 'leaves') LeavesModule.init();
    else if (tabName === 'payroll') PayrollModule.init();
    else if (tabName === 'directory' && this.user.role === 'admin') DirectoryModule.init();
    else if (tabName === 'insights' && this.user.role === 'admin') InsightsModule.init();
    else if (tabName === 'reports' && this.user.role === 'admin') ReportsModule.init();
    else if (tabName === 'notifications') NotificationsModule.init();

    // Close mobile sidebar if open
    document.getElementById('appSidebar')?.classList.remove('open');
  },

  async loadAdminCommandCenterSummary() {
    try {
      const attRes = await api.getAllAttendance();
      const leavesRes = await api.getAllLeaves('status=Pending');

      const sum = attRes.summary;
      if (sum) {
        const kpiPresent = document.getElementById('kpiAdminPresent');
        const kpiAbsent = document.getElementById('kpiAdminAbsent');
        const kpiLeave = document.getElementById('kpiAdminOnLeave');
        const kpiPendingLeaves = document.getElementById('kpiAdminPendingLeaves');

        if (kpiPresent) kpiPresent.innerText = sum.presentToday;
        if (kpiAbsent) kpiAbsent.innerText = sum.absentToday;
        if (kpiLeave) kpiLeave.innerText = sum.onLeaveToday;
        if (kpiPendingLeaves) kpiPendingLeaves.innerText = leavesRes.summary?.pending || 0;
      }

      // Needs attention alert generation
      const attentionList = document.getElementById('needsAttentionList');
      if (attentionList) {
        const items = [];
        if (leavesRes.summary?.pending > 0) {
          items.push(`
            <div class="attention-item">
              <span style="color:#FBBF24;">⚡ ${leavesRes.summary.pending} leave request(s) awaiting your review</span>
              <button class="btn btn-secondary btn-sm" onclick="App.switchTab('leaves')">Review Now</button>
            </div>
          `);
        }
        if (sum && sum.lateToday > 0) {
          items.push(`
            <div class="attention-item">
              <span style="color:#FB7185;">⏱️ ${sum.lateToday} staff member(s) clocked in late today</span>
              <button class="btn btn-secondary btn-sm" onclick="App.switchTab('attendance')">View Logs</button>
            </div>
          `);
        }
        if (items.length === 0) {
          items.push(`
            <div class="attention-item" style="color:#34D399;">
              ✓ All systems operating smoothly. No urgent alerts.
            </div>
          `);
        }
        attentionList.innerHTML = items.join('');
      }
    } catch (err) {
      console.error(err);
    }
  },

  async refreshOverviewStats() {
    if (this.user && this.user.role === 'admin') {
      await this.loadAdminCommandCenterSummary();
    }
  },

  startHeaderClock() {
    const clockEl = document.getElementById('liveHeaderClock');
    const update = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    };
    update();
    setInterval(update, 1000);
  },

  toggleMobileSidebar() {
    document.getElementById('appSidebar')?.classList.toggle('open');
  },

  logout() {
    if (confirm('Are you sure you want to sign out?')) {
      TokenService.removeToken();
      Toast.info('Signed out successfully.');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 400);
    }
  },
};

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('app.html') || window.location.pathname === '/app') {
    App.init();
  }
});
