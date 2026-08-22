// Reports Generation and CSV Exporter Module
const ReportsModule = {
  activeTab: 'attendance',

  async init() {
    await this.generateReport();
  },

  switchReportTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.report-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    this.generateReport();
  },

  async generateReport() {
    const dept = document.getElementById('reportFilterDept')?.value || 'All';
    const sDate = document.getElementById('reportStartDate')?.value || '';
    const eDate = document.getElementById('reportEndDate')?.value || '';

    const tbody = document.getElementById('reportTableBody');
    const thead = document.getElementById('reportTableHead');
    if (!tbody || !thead) return;

    try {
      if (this.activeTab === 'attendance') {
        const params = new URLSearchParams();
        if (dept !== 'All') params.append('department', dept);
        if (sDate) params.append('startDate', sDate);
        if (eDate) params.append('endDate', eDate);

        const res = await api.getAttendanceReport(params.toString());
        
        thead.innerHTML = `
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Work Duration</th>
            <th>Status</th>
          </tr>
        `;

        if (!res.records || res.records.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:24px; color:var(--text-muted);">No records found.</td></tr>`;
          return;
        }

        tbody.innerHTML = res.records.map((r) => `
          <tr>
            <td><strong>${r.user?.fullName || 'Staff'}</strong> (${r.user?.employeeId || '--'})</td>
            <td>${r.dateString}</td>
            <td>${r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
            <td>${r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
            <td>${r.totalWorkMinutes ? Math.floor(r.totalWorkMinutes / 60) + 'h ' + (r.totalWorkMinutes % 60) + 'm' : '--'}</td>
            <td><span class="badge ${r.status === 'Present' ? 'badge-present' : 'badge-late'}">${r.status}</span></td>
          </tr>
        `).join('');

      } else if (this.activeTab === 'leaves') {
        const params = new URLSearchParams();
        if (dept !== 'All') params.append('department', dept);

        const res = await api.getLeaveReport(params.toString());

        thead.innerHTML = `
          <tr>
            <th>Employee</th>
            <th>Leave Type</th>
            <th>Duration</th>
            <th>Total Days</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>
        `;

        if (!res.leaves || res.leaves.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:24px; color:var(--text-muted);">No records found.</td></tr>`;
          return;
        }

        tbody.innerHTML = res.leaves.map((l) => `
          <tr>
            <td><strong>${l.user?.fullName || 'Staff'}</strong> (${l.user?.department || '--'})</td>
            <td>${l.leaveType}</td>
            <td>${new Date(l.startDate).toLocaleDateString()} – ${new Date(l.endDate).toLocaleDateString()}</td>
            <td><strong>${l.totalDays} Days</strong></td>
            <td><span class="badge ${l.status === 'Approved' ? 'badge-approved' : (l.status === 'Rejected' ? 'badge-rejected' : 'badge-pending')}">${l.status}</span></td>
            <td>${l.reason}</td>
          </tr>
        `).join('');

      } else if (this.activeTab === 'payroll') {
        const params = new URLSearchParams();
        if (dept !== 'All') params.append('department', dept);

        const res = await api.getPayrollReport(params.toString());

        thead.innerHTML = `
          <tr>
            <th>Employee</th>
            <th>Period</th>
            <th>Gross Salary</th>
            <th>Total Deductions</th>
            <th>Net Take-Home</th>
            <th>Status</th>
          </tr>
        `;

        if (!res.records || res.records.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:24px; color:var(--text-muted);">No records found.</td></tr>`;
          return;
        }

        tbody.innerHTML = res.records.map((p) => `
          <tr>
            <td><strong>${p.user?.fullName || 'Staff'}</strong> (${p.user?.employeeId || '--'})</td>
            <td>${p.periodName}</td>
            <td>$${p.grossEarnings.toLocaleString()}</td>
            <td style="color:#FB7185;">-$${p.totalDeductions.toLocaleString()}</td>
            <td style="font-weight:700; color:#34D399;">$${p.netSalary.toLocaleString()}</td>
            <td><span class="badge ${p.status === 'Paid' ? 'badge-paid' : 'badge-processed'}">${p.status}</span></td>
          </tr>
        `).join('');

      } else if (this.activeTab === 'employees') {
        const params = new URLSearchParams();
        if (dept !== 'All') params.append('department', dept);

        const res = await api.getEmployeeMasterReport(params.toString());

        thead.innerHTML = `
          <tr>
            <th>Employee ID</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        `;

        if (!res.employees || res.employees.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:24px; color:var(--text-muted);">No records found.</td></tr>`;
          return;
        }

        tbody.innerHTML = res.employees.map((e) => `
          <tr>
            <td><span class="kbd-shortcut">${e.employeeId}</span></td>
            <td><strong>${e.fullName}</strong></td>
            <td>${e.email}</td>
            <td>${e.department}</td>
            <td>${e.designation}</td>
            <td>${e.employmentType}</td>
            <td><span class="badge badge-active">${e.status}</span></td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  },

  exportCSV() {
    const table = document.querySelector('#reportTableContainer table');
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');

    for (const row of rows) {
      const cols = row.querySelectorAll('td, th');
      const rowData = [];
      for (const col of cols) {
        let text = col.innerText.replace(/"/g, '""').trim();
        rowData.push(`"${text}"`);
      }
      csv.push(rowData.join(','));
    }

    const csvString = csv.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dayflow_${this.activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Toast.success('Report exported to CSV successfully.');
  },
};
