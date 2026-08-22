// DAYFLOW PULSE - Real-Time Employee Workday Engine
let pulseTimerInterval = null;
let currentAttendanceData = null;

const Pulse = {
  async init() {
    this.updateGreeting();
    await this.fetchTodayState();
  },

  updateGreeting() {
    const user = TokenService.getUser();
    if (!user) return;

    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    else if (hour >= 17) timeGreeting = 'Good evening';

    const greetingEl = document.getElementById('pulseGreetingTitle');
    const subtitleEl = document.getElementById('pulseGreetingSubtitle');

    if (greetingEl) {
      greetingEl.innerHTML = `${timeGreeting}, <span class="text-gradient">${user.fullName.split(' ')[0]}</span> 👋`;
    }
    if (subtitleEl) {
      const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
      subtitleEl.innerText = `${new Date().toLocaleDateString('en-US', options)} • Ready to make today impactful.`;
    }
  },

  async fetchTodayState() {
    try {
      const res = await api.getTodayAttendance();
      currentAttendanceData = res.attendance;
      this.renderState(res.state, res.isOnBreak, res.attendance);
    } catch (err) {
      console.error('Failed to load pulse state:', err);
    }
  },

  renderState(state, isOnBreak, attendance) {
    const statusPill = document.getElementById('pulseStatusPill');
    const checkInTimeEl = document.getElementById('pulseCheckInTime');
    const checkOutTimeEl = document.getElementById('pulseCheckOutTime');
    const liveTimerEl = document.getElementById('pulseLiveTimer');
    const breakStatusEl = document.getElementById('pulseBreakStatus');
    const progressTrackEl = document.getElementById('pulseProgressTrack');

    const btnCheckIn = document.getElementById('btnPulseCheckIn');
    const btnBreak = document.getElementById('btnPulseBreak');
    const btnCheckOut = document.getElementById('btnPulseCheckOut');

    // Clear any existing ticker
    if (pulseTimerInterval) clearInterval(pulseTimerInterval);

    // Reset Flow Timeline steps
    const stepMorning = document.getElementById('stepMorning');
    const stepCheckIn = document.getElementById('stepCheckIn');
    const stepWorking = document.getElementById('stepWorking');
    const stepBreak = document.getElementById('stepBreak');
    const stepCheckOut = document.getElementById('stepCheckOut');
    const stepSummary = document.getElementById('stepSummary');

    [stepMorning, stepCheckIn, stepWorking, stepBreak, stepCheckOut, stepSummary].forEach((step) => {
      if (step) step.className = 'flow-step';
    });

    if (stepMorning) stepMorning.classList.add('completed');

    if (state === 'not_checked_in' || !attendance) {
      if (statusPill) {
        statusPill.className = 'badge badge-warning';
        statusPill.innerHTML = '<span class="live-dot" style="background:#F59E0B;"></span> Not Checked In';
      }
      if (checkInTimeEl) checkInTimeEl.innerText = '--:-- --';
      if (checkOutTimeEl) checkOutTimeEl.innerText = '--:-- --';
      if (liveTimerEl) liveTimerEl.innerText = '00:00:00';
      if (breakStatusEl) breakStatusEl.innerText = '0 mins';
      if (progressTrackEl) progressTrackEl.style.width = '0%';

      if (btnCheckIn) { btnCheckIn.style.display = 'inline-flex'; btnCheckIn.disabled = false; }
      if (btnBreak) { btnBreak.style.display = 'none'; }
      if (btnCheckOut) { btnCheckOut.style.display = 'none'; }

      if (stepCheckIn) stepCheckIn.classList.add('active');
    } else if (state === 'working' || state === 'on_break') {
      const checkInDate = new Date(attendance.checkIn);
      if (checkInTimeEl) checkInTimeEl.innerText = checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (checkOutTimeEl) checkOutTimeEl.innerText = 'In Progress';

      if (stepCheckIn) stepCheckIn.classList.add('completed');
      if (stepWorking) stepWorking.classList.add('active');

      if (btnCheckIn) btnCheckIn.style.display = 'none';
      if (btnBreak) {
        btnBreak.style.display = 'inline-flex';
        btnBreak.innerHTML = isOnBreak
          ? '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> End Break'
          : '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Take Break';
        btnBreak.className = isOnBreak ? 'btn btn-success' : 'btn btn-secondary';
      }
      if (btnCheckOut) {
        btnCheckOut.style.display = 'inline-flex';
        btnCheckOut.disabled = false;
      }

      if (isOnBreak) {
        if (statusPill) {
          statusPill.className = 'badge badge-info';
          statusPill.innerHTML = '<span class="live-dot" style="background:#06B6D4;"></span> On Break';
        }
        if (stepBreak) stepBreak.classList.add('active');
      } else {
        if (statusPill) {
          statusPill.className = 'badge badge-success';
          statusPill.innerHTML = '<span class="live-dot" style="background:#10B981;"></span> Working Active';
        }
      }

      // Start live timer
      this.startLiveWorkTimer(attendance, isOnBreak);
    } else if (state === 'completed') {
      const checkInDate = new Date(attendance.checkIn);
      const checkOutDate = new Date(attendance.checkOut);

      if (checkInTimeEl) checkInTimeEl.innerText = checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (checkOutTimeEl) checkOutTimeEl.innerText = checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const totalMins = attendance.totalWorkMinutes || 0;
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      if (liveTimerEl) liveTimerEl.innerText = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
      if (breakStatusEl) breakStatusEl.innerText = `${attendance.totalBreakMinutes || 0} mins`;

      const pct = Math.min(100, Math.round((totalMins / 480) * 100));
      if (progressTrackEl) progressTrackEl.style.width = `${pct}%`;

      if (statusPill) {
        statusPill.className = 'badge badge-present';
        statusPill.innerHTML = '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Workday Completed';
      }

      if (btnCheckIn) btnCheckIn.style.display = 'none';
      if (btnBreak) btnBreak.style.display = 'none';
      if (btnCheckOut) {
        btnCheckOut.style.display = 'inline-flex';
        btnCheckOut.disabled = true;
        btnCheckOut.innerHTML = 'Checked Out';
      }

      [stepMorning, stepCheckIn, stepWorking, stepBreak, stepCheckOut, stepSummary].forEach((step) => {
        if (step) step.classList.add('completed');
      });
    }
  },

  startLiveWorkTimer(attendance, isOnBreak) {
    const liveTimerEl = document.getElementById('pulseLiveTimer');
    const breakStatusEl = document.getElementById('pulseBreakStatus');
    const progressTrackEl = document.getElementById('pulseProgressTrack');

    const checkInMs = new Date(attendance.checkIn).getTime();

    const updateTime = () => {
      const now = Date.now();
      let totalBreakMs = 0;

      if (attendance.breaks && attendance.breaks.length > 0) {
        attendance.breaks.forEach((b) => {
          const s = new Date(b.startTime).getTime();
          const e = b.endTime ? new Date(b.endTime).getTime() : now;
          totalBreakMs += (e - s);
        });
      }

      const totalBreakMins = Math.round(totalBreakMs / 60000);
      if (breakStatusEl) breakStatusEl.innerText = `${totalBreakMins} mins`;

      const netWorkMs = Math.max(0, (now - checkInMs) - totalBreakMs);
      const totalSec = Math.floor(netWorkMs / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      if (liveTimerEl) {
        liveTimerEl.innerText = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }

      const netMinutes = netWorkMs / 60000;
      const pct = Math.min(100, Math.round((netMinutes / 480) * 100));
      if (progressTrackEl) {
        progressTrackEl.style.width = `${pct}%`;
      }
    };

    updateTime();
    pulseTimerInterval = setInterval(updateTime, 1000);
  },

  async handleCheckIn() {
    try {
      const res = await api.checkIn({ workType: 'Office', checkInNote: 'Started day from Dayflow Pulse' });
      Toast.success(res.message || 'Checked in successfully!');
      await this.fetchTodayState();
      // Reload stats
      if (window.App && window.App.refreshOverviewStats) {
        window.App.refreshOverviewStats();
      }
    } catch (err) {
      Toast.error(err.message || 'Check-in failed.');
    }
  },

  async handleBreakToggle() {
    try {
      const res = await api.toggleBreak();
      Toast.info(res.message || 'Break status updated.');
      await this.fetchTodayState();
    } catch (err) {
      Toast.error(err.message || 'Failed to toggle break.');
    }
  },

  async handleCheckOut() {
    if (!confirm('Are you ready to finish your workday and check out?')) return;

    try {
      const res = await api.checkOut({ checkOutNote: 'Workday completed' });
      Toast.success(res.message || 'Checked out successfully!');
      await this.fetchTodayState();
      if (window.App && window.App.refreshOverviewStats) {
        window.App.refreshOverviewStats();
      }
    } catch (err) {
      Toast.error(err.message || 'Check-out failed.');
    }
  },
};
