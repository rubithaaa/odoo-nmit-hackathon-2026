// Leaves Module - Application Workflow, Balance Trackers & Admin Command Center
let activeReviewLeaveId = null;

const LeavesModule = {
  async init() {
    const user = TokenService.getUser();
    if (user.role === 'admin') {
      await this.loadAdminLeaves();
    } else {
      await this.loadEmployeeLeaves();
    }
  },

  async loadEmployeeLeaves() {
    try {
      const res = await api.getMyLeaves();

      // Render Balances
      const b = res.balances;
      if (b) {
        const paidRemEl = document.getElementById('leavePaidRemaining');
        const sickRemEl = document.getElementById('leaveSickRemaining');
        const casualRemEl = document.getElementById('leaveCasualRemaining');
        const unpaidUsedEl = document.getElementById('leaveUnpaidUsed');

        if (paidRemEl) paidRemEl.innerText = `${b.paid.remaining} / ${b.paid.total} Days`;
        if (sickRemEl) sickRemEl.innerText = `${b.sick.remaining} / ${b.sick.total} Days`;
        if (casualRemEl) casualRemEl.innerText = `${b.casual.remaining} / ${b.casual.total} Days`;
        if (unpaidUsedEl) unpaidUsedEl.innerText = `${b.unpaid.used} Days Taken`;
      }

      // Render Requests Container (Cards / Timeline)
      const container = document.getElementById('empLeaveCardsContainer');
      if (container) {
        if (!res.leaves || res.leaves.length === 0) {
          container.innerHTML = `
            <div class="empty-state card">
              <div class="empty-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
              </div>
              <h4 class="empty-title">No leave requests found</h4>
              <p class="empty-desc">You're all caught up. Need time off? Apply for paid or sick leave above.</p>
              <button class="btn btn-primary btn-sm" onclick="LeavesModule.openApplyModal()">Apply for Leave</button>
            </div>
          `;
          return;
        }

        container.innerHTML = res.leaves.map((leave) => {
          let badgeClass = 'badge-pending';
          if (leave.status === 'Approved') badgeClass = 'badge-approved';
          else if (leave.status === 'Rejected') badgeClass = 'badge-rejected';

          const sDate = new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const eDate = new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

          return `
            <div class="card" style="margin-bottom:14px; position:relative;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                <div>
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <span style="font-weight:700; font-size:1.05rem; color:#FFFFFF;">${leave.leaveType} Leave</span>
                    <span class="badge ${badgeClass}">${leave.status}</span>
                  </div>
                  <div style="font-size:0.85rem; color:var(--text-secondary);">
                    📅 ${sDate} – ${eDate} (${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''})
                  </div>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted);">
                  Applied on ${new Date(leave.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style="background:rgba(0,0,0,0.2); padding:10px 14px; border-radius:var(--radius-sm); font-size:0.88rem; color:var(--text-main); margin-bottom:8px;">
                "${leave.reason}"
              </div>
              ${leave.reviewedBy ? `
                <div style="font-size:0.78rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                  <span>Reviewed by <strong>${leave.reviewedBy.fullName || 'HR Administrator'}</strong></span>
                  ${leave.reviewComment ? `• <em>"${leave.reviewComment}"</em>` : ''}
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Failed to load employee leaves:', err);
    }
  },

  async loadAdminLeaves() {
    try {
      const statusVal = document.getElementById('filterLeaveStatus')?.value || 'All';
      const typeVal = document.getElementById('filterLeaveType')?.value || 'All';
      const searchVal = document.getElementById('filterLeaveSearch')?.value || '';

      const params = new URLSearchParams();
      if (statusVal !== 'All') params.append('status', statusVal);
      if (typeVal !== 'All') params.append('leaveType', typeVal);
      if (searchVal) params.append('search', searchVal);

      const res = await api.getAllLeaves(params.toString());

      // Update Summary Cards
      const sum = res.summary;
      if (sum) {
        const pEl = document.getElementById('adminPendingLeavesCount');
        const aEl = document.getElementById('adminApprovedLeavesCount');
        const rEl = document.getElementById('adminRejectedLeavesCount');
        const tEl = document.getElementById('adminTotalLeavesCount');

        if (pEl) pEl.innerText = sum.pending;
        if (aEl) aEl.innerText = sum.approved;
        if (rEl) rEl.innerText = sum.rejected;
        if (tEl) tEl.innerText = sum.total;
      }

      // Render Admin Table / Queue
      const tbody = document.getElementById('adminLeavesTableBody');
      if (tbody) {
        if (!res.leaves || res.leaves.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="text-center" style="padding:36px; color:var(--text-muted);">
                No leave requests found matching selected criteria.
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = res.leaves.map((leave) => {
          const emp = leave.user || { fullName: 'Staff Member', employeeId: 'DF-000', department: 'General' };
          let badgeClass = 'badge-pending';
          if (leave.status === 'Approved') badgeClass = 'badge-approved';
          else if (leave.status === 'Rejected') badgeClass = 'badge-rejected';

          const sDate = new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const eDate = new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

          const isPending = leave.status === 'Pending';

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
              <td><strong>${leave.leaveType}</strong></td>
              <td>${sDate} – ${eDate}</td>
              <td><strong>${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''}</strong></td>
              <td style="max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${leave.reason}">
                ${leave.reason}
              </td>
              <td><span class="badge ${badgeClass}">${leave.status}</span></td>
              <td>
                ${isPending ? `
                  <button class="btn btn-primary btn-sm" onclick="LeavesModule.openReviewModal('${leave._id}', '${emp.fullName}', '${leave.leaveType}', ${leave.totalDays})">
                    Review Request
                  </button>
                ` : `
                  <span style="font-size:0.78rem; color:var(--text-muted);">
                    ${leave.reviewedBy ? `Reviewed by ${leave.reviewedBy.fullName || 'Admin'}` : 'Processed'}
                  </span>
                `}
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Failed to load admin leaves:', err);
    }
  },

  openApplyModal() {
    const modal = document.getElementById('applyLeaveModal');
    if (modal) modal.classList.add('active');
  },

  closeApplyModal() {
    const modal = document.getElementById('applyLeaveModal');
    if (modal) modal.classList.remove('active');
  },

  async handleApplySubmit(e) {
    e.preventDefault();
    const leaveType = document.getElementById('applyLeaveType').value;
    const startDate = document.getElementById('applyStartDate').value;
    const endDate = document.getElementById('applyEndDate').value;
    const reason = document.getElementById('applyReason').value.trim();

    if (!leaveType || !startDate || !endDate || !reason) {
      Toast.error('Please complete all fields.');
      return;
    }

    try {
      const res = await api.applyLeave({ leaveType, startDate, endDate, reason });
      Toast.success(res.message || 'Leave request submitted successfully!');
      this.closeApplyModal();
      document.getElementById('applyLeaveForm')?.reset();
      await this.loadEmployeeLeaves();
    } catch (err) {
      Toast.error(err.message || 'Failed to submit leave request.');
    }
  },

  openReviewModal(leaveId, empName, type, days) {
    activeReviewLeaveId = leaveId;
    const titleEl = document.getElementById('reviewModalTitle');
    const detailsEl = document.getElementById('reviewModalDetails');
    if (titleEl) titleEl.innerText = `Review Leave: ${empName}`;
    if (detailsEl) detailsEl.innerText = `Requested: ${days} day(s) of ${type} leave.`;

    const modal = document.getElementById('reviewLeaveModal');
    if (modal) modal.classList.add('active');
  },

  closeReviewModal() {
    activeReviewLeaveId = null;
    const modal = document.getElementById('reviewLeaveModal');
    if (modal) modal.classList.remove('active');
  },

  async handleReviewAction(status) {
    if (!activeReviewLeaveId) return;
    const comment = document.getElementById('reviewCommentInput')?.value.trim() || '';

    try {
      const res = await api.reviewLeave(activeReviewLeaveId, { status, reviewComment: comment });
      Toast.success(res.message || `Leave request ${status.toLowerCase()} successfully!`);
      this.closeReviewModal();
      document.getElementById('reviewCommentInput').value = '';
      await this.loadAdminLeaves();
      if (window.App && window.App.refreshOverviewStats) {
        window.App.refreshOverviewStats();
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to review leave.');
    }
  },
};
