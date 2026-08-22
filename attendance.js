// Attendance Module - Personal History, Calendar Matrix, and Admin Attendance Hub
const AttendanceModule = {
  async init() {
    const user = TokenService.getUser();
    if (user.role === 'admin') {
      await this.loadAdminAttendance();
    } else {
      await this.loadEmployeeAttendance();
    }
  },

  async loadEmployeeAttendance() {
    try {
      const statsRes = await api.getMyAttendanceStats();
      const histRes = await api.getMyAttendanceHistory();

      // Render employee stats
      const s = statsRes.stats;
      const rateEl = document.getElementById('empAttendanceRate');
      const presentEl = document.getElementById('empPresentDays');
      const lateEl = document.getElementById('empLateDays');
      const hoursEl = document.getElementById('empTotalHours');

      if (rateEl) rateEl.innerText = `${s.attendancePercentage}%`;
      if (presentEl) presentEl.innerText = `${s.presentDays} Days`;
      if (lateEl) lateEl.innerText = `${s.lateDays} Days`;
      if (hoursEl) hoursEl.innerText = `${s.totalHoursLogged} hrs`;

      // Render History Table
      const tbody = document.getElementById('empAttendanceTableBody');
      if (tbody) {
        if (!histRes.history || histRes.history.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="text-center" style="padding:30px; color:var(--text-muted);">
                No attendance logs found for this period.
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = histRes.history.map((record) => {
          const inTime = record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
          const outTime = record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (record.checkIn ? 'Working' : '--:--');
          const workHrs = record.totalWorkMinutes ? `${Math.floor(record.totalWorkMinutes / 60)}h ${record.totalWorkMinutes % 60}m` : '--';
          const breakMins = record.totalBreakMinutes ? `${record.totalBreakMinutes}m` : '0m';

          let badgeClass = 'badge-present';
          if (record.status === 'Late') badgeClass = 'badge-late';
          else if (record.status === 'Half-day') badgeClass = 'badge-half-day';
          else if (record.status === 'On Leave') badgeClass = 'badge-on-leave';
          else if (record.status === 'Absent') badgeClass = 'badge-absent';

          return `
            <tr>
              <td style="font-weight:600;">${new Date(record.dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td>${inTime}</td>
              <td>${outTime}</td>
              <td>${workHrs}</td>
              <td>${breakMins}</td>
              <td><span class="badge ${badgeClass}">${record.status}</span></td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Failed to load employee attendance:', err);
    }
  },

  async loadAdminAttendance() {
    try {
      const dateVal = document.getElementById('filterAttDate')?.value || '';
      const deptVal = document.getElementById('filterAttDept')?.value || 'All';
      const statusVal = document.getElementById('filterAttStatus')?.value || 'All';
      const searchVal = document.getElementById('filterAttSearch')?.value || '';

      const params = new URLSearchParams();
      if (dateVal) params.append('date', dateVal);
      if (deptVal !== 'All') params.append('department', deptVal);
      if (statusVal !== 'All') params.append('status', statusVal);
      if (searchVal) params.append('search', searchVal);

      const res = await api.getAllAttendance(params.toString());

      // Update Summary Cards
      const sum = res.summary;
      if (sum) {
        const totalEmpEl = document.getElementById('adminTotalEmployees');
        const presentEl = document.getElementById('adminPresentToday');
        const lateEl = document.getElementById('adminLateToday');
        const absentEl = document.getElementById('adminAbsentToday');
        const rateEl = document.getElementById('adminAttendanceRate');

        if (totalEmpEl) totalEmpEl.innerText = sum.totalEmployees;
        if (presentEl) presentEl.innerText = sum.presentToday;
        if (lateEl) lateEl.innerText = sum.lateToday;
        if (absentEl) absentEl.innerText = sum.absentToday;
        if (rateEl) rateEl.innerText = `${sum.attendanceRate}%`;
      }

      // Render Admin Table
      const tbody = document.getElementById('adminAttendanceTableBody');
      if (tbody) {
        if (!res.records || res.records.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="text-center" style="padding:36px; color:var(--text-muted);">
                No attendance logs found matching filters.
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = res.records.map((r) => {
          const emp = r.user || { fullName: 'Unknown Staff', employeeId: 'DF-000', department: 'General' };
          const inTime = r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
          const outTime = r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (r.checkIn ? 'In Progress' : '--:--');
          const workHrs = r.totalWorkMinutes ? `${Math.floor(r.totalWorkMinutes / 60)}h ${r.totalWorkMinutes % 60}m` : '--';

          let badgeClass = 'badge-present';
          if (r.status === 'Late') badgeClass = 'badge-late';
          else if (r.status === 'Half-day') badgeClass = 'badge-half-day';
          else if (r.status === 'On Leave') badgeClass = 'badge-on-leave';
          else if (r.status === 'Absent') badgeClass = 'badge-absent';

          return `
            <tr>
              <td>
                <div class="user-cell">
                  <img class="user-cell-avatar" src="${emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" alt="${emp.fullName}">
                  <div class="user-cell-meta">
                    <span class="user-cell-name">${emp.fullName}</span>
                    <span class="user-cell-sub">${emp.employeeId} • ${emp.department}</span>
                  </div>
                </div>
              </td>
              <td>${r.dateString}</td>
              <td>${inTime}</td>
              <td>${outTime}</td>
              <td>${workHrs}</td>
              <td><span class="badge ${badgeClass}">${r.status}</span></td>
              <td><span style="font-size:0.8rem; color:var(--text-secondary);">${r.workType || 'Office'}</span></td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Failed to load admin attendance:', err);
    }
  },
};
