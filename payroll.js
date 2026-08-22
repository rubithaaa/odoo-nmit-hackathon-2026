// Payroll & Salary Slip Generator Module
let activePayslipData = null;

const PayrollModule = {
  async init() {
    const user = TokenService.getUser();
    if (user.role === 'admin') {
      await this.loadAdminPayroll();
    } else {
      await this.loadEmployeePayroll();
    }
  },

  async loadEmployeePayroll() {
    try {
      const res = await api.getMyPayroll();

      const latest = res.latestSummary;
      if (latest) {
        const grossEl = document.getElementById('empPayrollGross');
        const dedEl = document.getElementById('empPayrollDeductions');
        const netEl = document.getElementById('empPayrollNet');
        const periodEl = document.getElementById('empPayrollPeriod');

        if (grossEl) grossEl.innerText = `$${latest.gross.toLocaleString()}`;
        if (dedEl) dedEl.innerText = `-$${latest.deductions.toLocaleString()}`;
        if (netEl) netEl.innerText = `$${latest.net.toLocaleString()}`;
        if (periodEl) periodEl.innerText = latest.period;
      }

      // Render Payslips History Table
      const tbody = document.getElementById('empPayrollTableBody');
      if (tbody) {
        if (!res.payslips || res.payslips.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="text-center" style="padding:30px; color:var(--text-muted);">
                No processed salary slips found yet.
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = res.payslips.map((slip) => {
          let badgeClass = slip.status === 'Paid' ? 'badge-paid' : 'badge-processed';

          return `
            <tr>
              <td><strong>${slip.periodName}</strong></td>
              <td>$${slip.grossEarnings.toLocaleString()}</td>
              <td style="color:#FB7185;">-$${slip.totalDeductions.toLocaleString()}</td>
              <td style="font-weight:700; color:#34D399;">$${slip.netSalary.toLocaleString()}</td>
              <td><span class="badge ${badgeClass}">${slip.status}</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="PayrollModule.viewPayslipModal('${slip._id}')">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> View Slip
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Failed to load employee payroll:', err);
    }
  },

  async loadAdminPayroll() {
    try {
      const monthVal = document.getElementById('filterPayrollMonth')?.value || 'All';
      const yearVal = document.getElementById('filterPayrollYear')?.value || 'All';
      const searchVal = document.getElementById('filterPayrollSearch')?.value || '';

      const params = new URLSearchParams();
      if (monthVal !== 'All') params.append('month', monthVal);
      if (yearVal !== 'All') params.append('year', yearVal);
      if (searchVal) params.append('search', searchVal);

      const res = await api.getAllPayroll(params.toString());

      // Update Summary Cards
      const sum = res.summary;
      if (sum) {
        const totalGrossEl = document.getElementById('adminTotalPayrollGross');
        const totalNetEl = document.getElementById('adminTotalPayrollNet');
        const totalDedEl = document.getElementById('adminTotalPayrollDeductions');
        const processedCountEl = document.getElementById('adminProcessedPayrollCount');

        if (totalGrossEl) totalGrossEl.innerText = `$${sum.totalGross.toLocaleString()}`;
        if (totalNetEl) totalNetEl.innerText = `$${sum.totalNet.toLocaleString()}`;
        if (totalDedEl) totalDedEl.innerText = `$${sum.totalDeductions.toLocaleString()}`;
        if (processedCountEl) processedCountEl.innerText = sum.processedCount;
      }

      // Render Admin Table
      const tbody = document.getElementById('adminPayrollTableBody');
      if (tbody) {
        if (!res.records || res.records.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="text-center" style="padding:36px; color:var(--text-muted);">
                No payroll records found for this period.
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = res.records.map((r) => {
          const emp = r.user || { fullName: 'Staff Member', employeeId: 'DF-000', department: 'General' };
          let badgeClass = r.status === 'Paid' ? 'badge-paid' : 'badge-processed';

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
              <td>${r.periodName}</td>
              <td>$${r.grossEarnings.toLocaleString()}</td>
              <td style="color:#FB7185;">-$${r.totalDeductions.toLocaleString()}</td>
              <td style="font-weight:700; color:#34D399;">$${r.netSalary.toLocaleString()}</td>
              <td><span class="badge ${badgeClass}">${r.status}</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="PayrollModule.viewPayslipModal('${r._id}')">
                  View Slip
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Failed to load admin payroll:', err);
    }
  },

  async viewPayslipModal(slipId) {
    try {
      const res = await api.getPayslipById(slipId);
      const p = res.payslip;
      activePayslipData = p;

      const user = p.user || {};
      const s = p.salaryStructure || {};

      const modalBody = document.getElementById('payslipModalBody');
      if (modalBody) {
        modalBody.innerHTML = `
          <div class="payslip-container" id="printablePayslipArea">
            <div class="payslip-header">
              <div>
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                  <span class="payslip-company-title">DAYFLOW INC.</span>
                  <span style="font-size:0.75rem; background:#EEF2FF; color:#4F46E5; padding:2px 8px; border-radius:4px; font-weight:700;">OFFICIAL PAYSLIP</span>
                </div>
                <div style="font-size:0.8rem; color:#64748B;">450 Mission St, Suite 800, San Francisco, CA 94105</div>
                <div style="font-size:0.8rem; color:#64748B;">EIN: 84-9120482 • payroll@dayflow.io</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:800; font-size:1.15rem; color:#1E293B;">${p.periodName.toUpperCase()}</div>
                <div style="font-size:0.8rem; color:#64748B;">Disbursement Ref: ${p.transactionRef}</div>
                <div style="font-size:0.8rem; color:#64748B;">Status: <strong>${p.status}</strong></div>
              </div>
            </div>

            <div class="payslip-meta-grid">
              <div class="payslip-meta-item">
                <span class="payslip-meta-label">Employee Name:</span>
                <span class="payslip-meta-val">${user.fullName || 'Employee'}</span>
              </div>
              <div class="payslip-meta-item">
                <span class="payslip-meta-label">Employee ID:</span>
                <span class="payslip-meta-val">${user.employeeId || '--'}</span>
              </div>
              <div class="payslip-meta-item">
                <span class="payslip-meta-label">Designation:</span>
                <span class="payslip-meta-val">${user.designation || 'Staff'}</span>
              </div>
              <div class="payslip-meta-item">
                <span class="payslip-meta-label">Department:</span>
                <span class="payslip-meta-val">${user.department || 'Operations'}</span>
              </div>
              <div class="payslip-meta-item">
                <span class="payslip-meta-label">Payment Method:</span>
                <span class="payslip-meta-val">${p.paymentMethod || 'Direct Deposit'}</span>
              </div>
              <div class="payslip-meta-item">
                <span class="payslip-meta-label">Paid / Working Days:</span>
                <span class="payslip-meta-val">${p.paidDays} / ${p.workingDays} Days</span>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
              <div>
                <h4 style="color:#0F172A; font-size:0.9rem; margin-bottom:8px; border-bottom:2px solid #E2E8F0; padding-bottom:4px;">EARNINGS (USD)</h4>
                <table class="payslip-table">
                  <tbody>
                    <tr><td>Basic Salary</td><td style="text-align:right; font-weight:600;">$${(s.basicSalary || 0).toLocaleString()}</td></tr>
                    <tr><td>House Rent Allowance (HRA)</td><td style="text-align:right; font-weight:600;">$${(s.hra || 0).toLocaleString()}</td></tr>
                    <tr><td>Conveyance Allowance</td><td style="text-align:right; font-weight:600;">$${(s.conveyanceAllowance || 0).toLocaleString()}</td></tr>
                    <tr><td>Medical Allowance</td><td style="text-align:right; font-weight:600;">$${(s.medicalAllowance || 0).toLocaleString()}</td></tr>
                    <tr><td>Special Allowance</td><td style="text-align:right; font-weight:600;">$${(s.specialAllowance || 0).toLocaleString()}</td></tr>
                    <tr><td>Performance Bonus</td><td style="text-align:right; font-weight:600;">$${(s.performanceBonus || 0).toLocaleString()}</td></tr>
                    <tr style="background:#F8FAFC; font-weight:700;"><td>Total Gross Earnings</td><td style="text-align:right; color:#10B981;">$${p.grossEarnings.toLocaleString()}</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style="color:#0F172A; font-size:0.9rem; margin-bottom:8px; border-bottom:2px solid #E2E8F0; padding-bottom:4px;">DEDUCTIONS & TAXES (USD)</h4>
                <table class="payslip-table">
                  <tbody>
                    <tr><td>Provident Fund (PF)</td><td style="text-align:right; font-weight:600;">$${(s.providentFund || 0).toLocaleString()}</td></tr>
                    <tr><td>Tax Deducted at Source (TDS)</td><td style="text-align:right; font-weight:600;">$${(s.taxDeduction || 0).toLocaleString()}</td></tr>
                    <tr><td>Health Insurance Premium</td><td style="text-align:right; font-weight:600;">$${(s.healthInsurance || 0).toLocaleString()}</td></tr>
                    <tr><td>Other Deductions</td><td style="text-align:right; font-weight:600;">$${(s.otherDeductions || 0).toLocaleString()}</td></tr>
                    <tr style="background:#F8FAFC; font-weight:700;"><td>Total Deductions</td><td style="text-align:right; color:#EF4444;">-$${p.totalDeductions.toLocaleString()}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="payslip-net-box">
              <div>
                <div class="payslip-net-label">NET TAKE-HOME SALARY</div>
                <div style="font-size:0.75rem; color:#64748B;">Transferred via Direct Deposit / ACH Bank Wire</div>
              </div>
              <div class="payslip-net-amount">$${p.netSalary.toLocaleString()}</div>
            </div>

            <div class="payslip-footer">
              <div>
                <div>This is a computer-generated official document and does not require physical stamp.</div>
                <div>Questions? Contact hr@dayflow.io</div>
              </div>
              <div class="signature-line">
                <strong>Authorized Signatory</strong>
                <div style="font-size:0.7rem; color:#64748B;">Dayflow People & Finance</div>
              </div>
            </div>
          </div>
        `;
      }

      const modal = document.getElementById('payslipModal');
      if (modal) modal.classList.add('active');
    } catch (err) {
      Toast.error(err.message || 'Failed to fetch payslip.');
    }
  },

  closePayslipModal() {
    const modal = document.getElementById('payslipModal');
    if (modal) modal.classList.remove('active');
  },

  printPayslip() {
    window.print();
  },

  async generateBatch() {
    if (!confirm('Run monthly payroll batch computation for all active employees?')) return;
    try {
      const res = await api.generatePayrollBatch();
      Toast.success(res.message || 'Monthly payroll batch generated!');
      await this.loadAdminPayroll();
    } catch (err) {
      Toast.error(err.message || 'Failed to generate batch.');
    }
  },
};
