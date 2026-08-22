// Notifications Manager & Announcement Broadcaster
const NotificationsModule = {
  notifications: [],

  async init() {
    await this.fetchNotifications();
  },

  async fetchNotifications() {
    try {
      const res = await api.getNotifications();
      this.notifications = res.notifications || [];

      // Update badge
      const badgeEl = document.getElementById('notifUnreadBadge');
      if (badgeEl) {
        if (res.unreadCount > 0) {
          badgeEl.innerText = res.unreadCount;
          badgeEl.style.display = 'flex';
        } else {
          badgeEl.style.display = 'none';
        }
      }

      this.renderDropdown();
      this.renderFullList();
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  },

  renderDropdown() {
    const listEl = document.getElementById('notifDropdownList');
    if (!listEl) return;

    if (this.notifications.length === 0) {
      listEl.innerHTML = `
        <div style="padding:20px; text-align:center; color:var(--text-muted); font-size:0.85rem;">
          No notifications yet. You're all caught up!
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.notifications.slice(0, 5).map((n) => {
      return `
        <div class="notification-item ${n.isRead ? 'read' : 'unread'}" style="padding:10px 14px; border-bottom:1px solid var(--border-subtle); display:flex; gap:10px; cursor:pointer;" onclick="NotificationsModule.markRead('${n._id}')">
          <div style="flex:1;">
            <div style="font-weight:600; font-size:0.85rem; color:#FFFFFF; margin-bottom:2px;">${n.title}</div>
            <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4;">${n.message}</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">${new Date(n.createdAt).toLocaleDateString()}</div>
          </div>
          ${!n.isRead ? '<span class="live-dot" style="background:var(--accent-primary); margin-top:4px;"></span>' : ''}
        </div>
      `;
    }).join('');
  },

  renderFullList() {
    const fullListEl = document.getElementById('fullNotificationsList');
    if (!fullListEl) return;

    if (this.notifications.length === 0) {
      fullListEl.innerHTML = `
        <div class="empty-state card">
          <h4 class="empty-title">No notifications</h4>
          <p class="empty-desc">All caught up! You will be alerted when leaves are approved, payslips are published, or announcements are shared.</p>
        </div>
      `;
      return;
    }

    fullListEl.innerHTML = this.notifications.map((n) => {
      return `
        <div class="card" style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:flex-start; ${!n.isRead ? 'border-color:var(--accent-primary);' : ''}">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span style="font-weight:700; color:#FFFFFF;">${n.title}</span>
              ${!n.isRead ? '<span class="badge badge-purple">New</span>' : ''}
            </div>
            <div style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:6px;">${n.message}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(n.createdAt).toLocaleString()}</div>
          </div>
          ${!n.isRead ? `
            <button class="btn btn-ghost btn-sm" onclick="NotificationsModule.markRead('${n._id}')">Mark as read</button>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  toggleDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  },

  async markRead(id) {
    try {
      await api.markNotificationRead(id);
      await this.fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  },

  async markAllRead() {
    try {
      await api.markAllNotificationsRead();
      Toast.success('All notifications marked as read');
      await this.fetchNotifications();
    } catch (err) {
      Toast.error('Failed to mark all as read');
    }
  },

  openBroadcastModal() {
    const modal = document.getElementById('broadcastAnnouncementModal');
    if (modal) modal.classList.add('active');
  },

  closeBroadcastModal() {
    const modal = document.getElementById('broadcastAnnouncementModal');
    if (modal) modal.classList.remove('active');
  },

  async handleBroadcastSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('broadcastTitle').value.trim();
    const department = document.getElementById('broadcastDept').value;
    const message = document.getElementById('broadcastMessage').value.trim();

    if (!title || !message) {
      Toast.error('Title and message are required.');
      return;
    }

    try {
      const res = await api.broadcastAnnouncement({ title, department, message });
      Toast.success(res.message || 'Announcement broadcasted successfully!');
      this.closeBroadcastModal();
      document.getElementById('broadcastAnnouncementForm')?.reset();
      await this.fetchNotifications();
    } catch (err) {
      Toast.error(err.message || 'Failed to broadcast announcement.');
    }
  },
};
