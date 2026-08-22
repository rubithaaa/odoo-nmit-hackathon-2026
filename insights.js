// DAYFLOW INSIGHTS - Calculated Workforce Intelligence Engine
const InsightsModule = {
  async init() {
    await this.loadInsights();
  },

  async loadInsights() {
    try {
      const res = await api.getInsights();
      const container = document.getElementById('insightsGridContainer');
      const deptContainer = document.getElementById('insightsDeptRankingsContainer');

      if (container) {
        if (!res.insights || res.insights.length === 0) {
          container.innerHTML = `
            <div class="empty-state card" style="grid-column: 1 / -1;">
              <h4 class="empty-title">Calibrating Data Models...</h4>
              <p class="empty-desc">Not enough data to generate insights yet. Log daily check-ins to view automated analytics.</p>
            </div>
          `;
          return;
        }

        container.innerHTML = res.insights.map((ins) => {
          let badgeColor = 'var(--accent-primary)';
          if (ins.type === 'positive' || ins.type === 'highlight') badgeColor = 'var(--accent-emerald)';
          else if (ins.type === 'warning') badgeColor = 'var(--accent-amber)';
          else if (ins.type === 'info') badgeColor = 'var(--accent-cyan)';

          return `
            <div class="insight-card">
              <div>
                <div class="insight-top">
                  <span class="badge" style="background:rgba(255,255,255,0.05); color:${badgeColor}; border-color:${badgeColor}; font-weight:700;">
                    ${ins.tag || 'Workforce Insight'}
                  </span>
                  <span class="insight-metric-pill">${ins.metric || ''}</span>
                </div>
                <h3 class="insight-title">${ins.title}</h3>
                <p class="insight-desc">${ins.description}</p>
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                <span class="live-dot" style="background:${badgeColor};"></span> Verified by Dayflow Analytics Engine
              </div>
            </div>
          `;
        }).join('');
      }

      // Department Rankings
      if (deptContainer && res.departmentRankings && res.departmentRankings.length > 0) {
        deptContainer.innerHTML = res.departmentRankings.map((dept, index) => {
          return `
            <div style="margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; font-size:0.88rem; margin-bottom:6px;">
                <span style="font-weight:600;">#${index + 1} ${dept.department}</span>
                <span style="color:var(--accent-cyan); font-weight:700;">${dept.rate}% On-Time</span>
              </div>
              <div style="height:6px; background:var(--bg-surface-elevated); border-radius:4px; overflow:hidden;">
                <div style="width:${dept.rate}%; height:100%; background:var(--accent-gradient); border-radius:4px;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Failed to load insights:', err);
    }
  },
};
