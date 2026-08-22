// Global Search Command Palette (Ctrl + K)
const CommandPalette = {
  isOpen: false,
  results: [],
  selectedIndex: 0,

  init() {
    // Keyboard shortcut listener
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      } else if (this.isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.navigate(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.navigate(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.selectCurrent();
        }
      }
    });

    const input = document.getElementById('cmdPaletteInput');
    if (input) {
      input.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }
  },

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  },

  open() {
    this.isOpen = true;
    const modal = document.getElementById('commandPaletteModal');
    const input = document.getElementById('cmdPaletteInput');
    if (modal) modal.classList.add('active');
    if (input) {
      input.value = '';
      input.focus();
    }
    this.handleSearch('');
  },

  close() {
    this.isOpen = false;
    const modal = document.getElementById('commandPaletteModal');
    if (modal) modal.classList.remove('active');
  },

  async handleSearch(query) {
    const q = query.toLowerCase().trim();
    const resultsContainer = document.getElementById('cmdPaletteResults');
    if (!resultsContainer) return;

    // Quick navigation actions + data search
    const user = TokenService.getUser();
    const isAdmin = user && user.role === 'admin';

    const baseActions = [
      { type: 'action', title: 'Open Dayflow Pulse', sub: 'View daily status & live clock', action: () => window.App.switchTab('pulse') },
      { type: 'action', title: 'View Attendance Records', sub: 'Punch logs & calendar overview', action: () => window.App.switchTab('attendance') },
      { type: 'action', title: 'Apply for Leave', sub: 'Submit new time off request', action: () => { window.App.switchTab('leaves'); LeavesModule.openApplyModal(); } },
      { type: 'action', title: 'View Payroll & Salary Slips', sub: 'Itemized compensation & tax deductions', action: () => window.App.switchTab('payroll') },
      { type: 'action', title: 'Open Notifications', sub: 'Company alerts and approvals', action: () => window.App.switchTab('notifications') },
    ];

    if (isAdmin) {
      baseActions.push(
        { type: 'action', title: 'Employee Directory', sub: 'Manage team and profiles', action: () => window.App.switchTab('directory') },
        { type: 'action', title: 'Dayflow Workforce Insights', sub: 'Automated workforce analytics', action: () => window.App.switchTab('insights') },
        { type: 'action', title: 'Generate Reports', sub: 'Export attendance, payroll and leave CSVs', action: () => window.App.switchTab('reports') },
        { type: 'action', title: 'Broadcast Announcement', sub: 'Send company-wide notice', action: () => { window.App.switchTab('notifications'); NotificationsModule.openBroadcastModal(); } }
      );
    }

    let filtered = baseActions.filter((a) => a.title.toLowerCase().includes(q) || a.sub.toLowerCase().includes(q));

    // Also fetch matching employees if query is entered
    if (q.length >= 2 && isAdmin) {
      try {
        const empRes = await api.getEmployees(`search=${encodeURIComponent(q)}`);
        if (empRes.employees) {
          empRes.employees.forEach((emp) => {
            filtered.push({
              type: 'employee',
              title: emp.fullName,
              sub: `${emp.employeeId} • ${emp.designation} (${emp.department})`,
              action: () => {
                window.App.switchTab('directory');
                DirectoryModule.openProfileModal(emp._id);
              },
            });
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    this.results = filtered;
    this.selectedIndex = 0;
    this.renderResults();
  },

  renderResults() {
    const container = document.getElementById('cmdPaletteResults');
    if (!container) return;

    if (this.results.length === 0) {
      container.innerHTML = `
        <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:0.9rem;">
          No matching commands, pages, or employees found.
        </div>
      `;
      return;
    }

    container.innerHTML = this.results.map((r, i) => {
      const isSelected = i === this.selectedIndex;
      return `
        <div class="cmd-result-item ${isSelected ? 'selected' : ''}" onclick="CommandPalette.execute(${i})" style="padding:10px 14px; border-radius:var(--radius-sm); margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
          <div>
            <div style="font-weight:600; font-size:0.9rem; color:#FFFFFF;">${r.title}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${r.sub}</div>
          </div>
          <span class="badge" style="background:rgba(255,255,255,0.06); font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase;">${r.type}</span>
        </div>
      `;
    }).join('');
  },

  navigate(dir) {
    if (this.results.length === 0) return;
    this.selectedIndex = (this.selectedIndex + dir + this.results.length) % this.results.length;
    this.renderResults();
  },

  selectCurrent() {
    if (this.results.length > 0 && this.results[this.selectedIndex]) {
      this.execute(this.selectedIndex);
    }
  },

  execute(index) {
    const item = this.results[index];
    if (item && item.action) {
      this.close();
      item.action();
    }
  },
};
