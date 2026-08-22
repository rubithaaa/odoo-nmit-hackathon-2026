// Employee Directory & Profile Manager
let currentEditingEmpId = null;

const DirectoryModule = {
  async init() {
    await this.loadDirectory();
  },

  async loadDirectory() {
    try {
      const searchVal = document.getElementById('filterDirSearch')?.value || '';
      const deptVal = document.getElementById('filterDirDept')?.value || 'All';
      const statusVal = document.getElementById('filterDirStatus')?.value || 'All';

      const params = new URLSearchParams();
      if (searchVal) params.append('search', searchVal);
      if (deptVal !== 'All') params.append('department', deptVal);
      if (statusVal !== 'All') params.append('status', statusVal);

      const res = await api.getEmployees(params.toString());
      const user = TokenService.getUser();
      const isAdmin = user.role === 'admin';

      const tbody = document.getElementById('directoryTableBody');
      if (tbody) {
        if (!res.employees || res.employees.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="text-center" style="padding:36px; color:var(--text-muted);">
                No employees found matching filter criteria.
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = res.employees.map((emp) => {
          const isWorking = emp.todayAttendance?.isWorking;
          const status = emp.status || 'Active';
          let statusBadge = 'badge-active';
          if (status === 'Inactive') statusBadge = 'badge-inactive';
          else if (status === 'On Leave') statusBadge = 'badge-on-leave';

          return `
            <tr>
              <td>
                <div class="user-cell">
                  <img class="user-cell-avatar" src="${emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" alt="${emp.fullName}">
                  <div class="user-cell-meta">
                    <span class="user-cell-name">${emp.fullName}</span>
                    <span class="user-cell-sub">${emp.email}</span>
                  </div>
                </div>
              </td>
              <td><span class="kbd-shortcut" style="font-size:0.75rem;">${emp.employeeId}</span></td>
              <td>${emp.department}</td>
              <td>${emp.designation}</td>
              <td>
                ${isWorking ? `
                  <span class="badge badge-success"><span class="live-dot"></span> Working</span>
                ` : `
                  <span class="badge badge-secondary" style="background:rgba(255,255,255,0.05); color:var(--text-muted);">Off Clock</span>
                `}
              </td>
              <td><span class="badge ${statusBadge}">${status}</span></td>
              <td>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-secondary btn-sm" onclick="DirectoryModule.openProfileModal('${emp._id}')">
                    View
                  </button>
                  ${isAdmin ? `
                    <button class="btn btn-ghost btn-sm" onclick="DirectoryModule.openEditModal('${emp._id}')">
                      Edit
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Failed to load directory:', err);
    }
  },

  async openProfileModal(empId) {
    try {
      const res = await api.getEmployeeById(empId);
      const emp = res.employee;
      const stats = res.stats;

      const body = document.getElementById('profileViewModalBody');
      if (body) {
        body.innerHTML = `
          <div style="text-align:center; margin-bottom:20px;">
            <img src="${emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" style="width:80px; height:80px; border-radius:50%; border:2px solid var(--accent-primary); margin-bottom:10px;">
            <h3 style="font-size:1.3rem; margin-bottom:2px;">${emp.fullName}</h3>
            <div style="color:var(--accent-cyan); font-size:0.9rem; font-weight:600;">${emp.designation} • ${emp.department}</div>
            <div style="font-size:0.8rem; color:var(--text-muted);">${emp.employeeId} • ${emp.employmentType}</div>
          </div>

          <div class="metrics-grid" style="grid-template-columns:1fr 1fr; margin-bottom:20px;">
            <div class="metric-card" style="padding:12px;">
              <div class="metric-title">Days Present</div>
              <div class="metric-value" style="font-size:1.4rem;">${stats.totalDaysPresent}</div>
            </div>
            <div class="metric-card" style="padding:12px;">
              <div class="metric-title">Approved Leaves</div>
              <div class="metric-value" style="font-size:1.4rem;">${stats.approvedLeaves}</div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px; font-size:0.9rem;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">
              <span style="color:var(--text-muted);">Email:</span>
              <span style="font-weight:600;">${emp.email}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">
              <span style="color:var(--text-muted);">Phone:</span>
              <span style="font-weight:600;">${emp.phone || '--'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">
              <span style="color:var(--text-muted);">Joined:</span>
              <span style="font-weight:600;">${new Date(emp.joiningDate).toLocaleDateString()}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">
              <span style="color:var(--text-muted);">Location:</span>
              <span style="font-weight:600;">${emp.address?.city || 'San Francisco'}, ${emp.address?.state || 'CA'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">
              <span style="color:var(--text-muted);">Emergency Contact:</span>
              <span style="font-weight:600;">${emp.emergencyContact?.name || '--'} (${emp.emergencyContact?.relation || '--'})</span>
            </div>
          </div>
        `;
      }

      const modal = document.getElementById('profileViewModal');
      if (modal) modal.classList.add('active');
    } catch (err) {
      Toast.error(err.message || 'Failed to fetch employee details.');
    }
  },

  closeProfileModal() {
    const modal = document.getElementById('profileViewModal');
    if (modal) modal.classList.remove('active');
  },

  async openEditModal(empId) {
    currentEditingEmpId = empId;
    try {
      const res = await api.getEmployeeById(empId);
      const emp = res.employee;
      const currentUser = TokenService.getUser();
      const isAdmin = currentUser.role === 'admin';

      document.getElementById('editEmpFullName').value = emp.fullName || '';
      document.getElementById('editEmpPhone').value = emp.phone || '';
      document.getElementById('editEmpCity').value = emp.address?.city || '';
      document.getElementById('editEmpEmergencyName').value = emp.emergencyContact?.name || '';
      document.getElementById('editEmpEmergencyPhone').value = emp.emergencyContact?.phone || '';

      const deptEl = document.getElementById('editEmpDept');
      const desigEl = document.getElementById('editEmpDesig');
      const statusEl = document.getElementById('editEmpStatus');

      if (deptEl) deptEl.value = emp.department || 'Engineering';
      if (desigEl) desigEl.value = emp.designation || '';
      if (statusEl) statusEl.value = emp.status || 'Active';

      // Disable admin fields for normal employee
      if (!isAdmin) {
        if (deptEl) deptEl.disabled = true;
        if (desigEl) desigEl.disabled = true;
        if (statusEl) statusEl.disabled = true;
        document.getElementById('editEmpFullName').disabled = true;
      } else {
        if (deptEl) deptEl.disabled = false;
        if (desigEl) desigEl.disabled = false;
        if (statusEl) statusEl.disabled = false;
        document.getElementById('editEmpFullName').disabled = false;
      }

      const modal = document.getElementById('editProfileModal');
      if (modal) modal.classList.add('active');
    } catch (err) {
      Toast.error(err.message || 'Failed to load employee for edit.');
    }
  },

  closeEditModal() {
    currentEditingEmpId = null;
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.classList.remove('active');
  },

  async handleSaveEdit(e) {
    e.preventDefault();
    if (!currentEditingEmpId) return;

    const currentUser = TokenService.getUser();
    const isAdmin = currentUser.role === 'admin';

    const updateData = {
      phone: document.getElementById('editEmpPhone').value.trim(),
      address: { city: document.getElementById('editEmpCity').value.trim() },
      emergencyContact: {
        name: document.getElementById('editEmpEmergencyName').value.trim(),
        phone: document.getElementById('editEmpEmergencyPhone').value.trim(),
      },
    };

    if (isAdmin) {
      updateData.fullName = document.getElementById('editEmpFullName').value.trim();
      updateData.department = document.getElementById('editEmpDept').value;
      updateData.designation = document.getElementById('editEmpDesig').value.trim();
      updateData.status = document.getElementById('editEmpStatus').value;
    }

    try {
      const res = await api.updateEmployee(currentEditingEmpId, updateData);
      Toast.success(res.message || 'Profile updated successfully!');
      this.closeEditModal();
      await this.loadDirectory();
    } catch (err) {
      Toast.error(err.message || 'Failed to update profile.');
    }
  },

  openAddModal() {
    const modal = document.getElementById('addEmployeeModal');
    if (modal) modal.classList.add('active');
  },

  closeAddModal() {
    const modal = document.getElementById('addEmployeeModal');
    if (modal) modal.classList.remove('active');
  },

  async handleAddSubmit(e) {
    e.preventDefault();
    const employeeId = document.getElementById('addEmpId').value.trim();
    const fullName = document.getElementById('addEmpFullName').value.trim();
    const email = document.getElementById('addEmpEmail').value.trim();
    const department = document.getElementById('addEmpDept').value;
    const designation = document.getElementById('addEmpDesig').value.trim();
    const salary = document.getElementById('addEmpSalary').value;
    const role = document.getElementById('addEmpRole').value;

    if (!employeeId || !fullName || !email) {
      Toast.error('Employee ID, Name, and Email are required.');
      return;
    }

    try {
      const res = await api.createEmployee({
        employeeId,
        fullName,
        email,
        department,
        designation,
        salary,
        role,
      });
      Toast.success(res.message || 'Employee added successfully!');
      this.closeAddModal();
      document.getElementById('addEmployeeForm')?.reset();
      await this.loadDirectory();
    } catch (err) {
      Toast.error(err.message || 'Failed to add employee.');
    }
  },
};
