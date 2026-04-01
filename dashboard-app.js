/**
 * Dashboard App - Renders KPIs, Charts, Tables from MISA API data
 */
(function () {
  const fmt = (n) => {
    if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + ' Nghìn tỷ';
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + ' Tỷ';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + ' Triệu';
    return n.toLocaleString('vi-VN');
  };
  const fmtFull = (n) => n.toLocaleString('vi-VN') + ' đ';
  const pct = (part, total) => ((part / total) * 100).toFixed(1) + '%';

  let charts = {};
  const COLORS = {
    primary: '#1e40af', primaryLight: '#3b82f6', success: '#10b981',
    warning: '#f59e0b', danger: '#ef4444', info: '#6366f1',
    pie: ['#1e40af','#3b82f6','#10b981','#f59e0b','#ef4444','#6366f1','#ec4899','#14b8a6']
  };

  // Sidebar toggle
  document.getElementById('sidebarOpen').onclick = () => document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarClose').onclick = () => document.getElementById('sidebar').classList.remove('open');

  function renderKPIs(d) {
    const cards = [
      { label: 'Tổng Doanh Thu', value: fmt(d.revenue.total), sub: 'Năm 2026', icon: 'fa-chart-line', color: COLORS.primary, accent: COLORS.primary, change: '+12.3%', dir: 'up' },
      { label: 'Tổng Chi Phí', value: fmt(d.expenses.total), sub: 'Chi thường xuyên + vận hành', icon: 'fa-wallet', color: COLORS.warning, accent: COLORS.warning, change: '+5.2%', dir: 'up' },
      { label: 'Giá Vốn Hàng Bán', value: fmt(d.cogs.total), sub: pct(d.cogs.total, d.revenue.total) + ' trên doanh thu', icon: 'fa-boxes-stacked', color: COLORS.danger, accent: COLORS.danger, change: '-2.1%', dir: 'down' },
      { label: 'Lợi Nhuận Trước Thuế', value: fmt(d.metrics.profitPreTax), sub: 'Tỷ suất: ' + (d.metrics.profitRate * 100).toFixed(2) + '%', icon: 'fa-coins', color: COLORS.success, accent: COLORS.success, change: '+8.7%', dir: 'up' }
    ];
    document.getElementById('kpiGrid').innerHTML = cards.map(c => `
      <div class="kpi-card" style="--card-accent:${c.accent}">
        <div class="kpi-icon" style="background:${c.color}15;color:${c.color}"><i class="fas ${c.icon}"></i></div>
        <div class="kpi-label">${c.label}</div>
        <div class="kpi-value">${c.value}<span class="kpi-change ${c.dir}"><i class="fas fa-arrow-${c.dir}"></i>${c.change}</span></div>
        <div class="kpi-sub">${c.sub}</div>
      </div>`).join('');
  }

  function renderRevenueChart(d) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (charts.revenue) charts.revenue.destroy();
    charts.revenue = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Sang tay NM', 'Tại kho', 'Hàng lẻ', 'Nguyên cont'],
        datasets: [{ data: [d.revenue.sangTay, d.revenue.kho, d.revenue.hangLe, d.revenue.nguyenCont],
          backgroundColor: COLORS.pie.slice(0, 4), borderWidth: 0, hoverOffset: 12 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { family: 'Inter', size: 12 } } },
          tooltip: { callbacks: { label: (c) => c.label + ': ' + fmt(c.raw) + ' (' + pct(c.raw, d.revenue.total) + ')' } }
        }, cutout: '62%'
      }
    });
  }

  function renderWeeklyChart(d) {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    if (charts.weekly) charts.weekly.destroy();
    charts.weekly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
        datasets: [
          { label: 'Doanh thu', data: d.weekly.revenue, backgroundColor: COLORS.primary + 'cc', borderRadius: 6, barPercentage: 0.6 },
          { label: 'Chi phí', data: d.weekly.expense, backgroundColor: COLORS.warning + 'cc', borderRadius: 6, barPercentage: 0.6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Inter', size: 12 } } },
          tooltip: { callbacks: { label: c => c.dataset.label + ': ' + fmt(c.raw) } } },
        scales: { y: { ticks: { callback: v => fmt(v), font: { size: 11 } }, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } }
      }
    });
  }

  function renderExpenseChart(d) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (charts.expense) charts.expense.destroy();
    const labels = ['Nhân sự', 'Thưởng T13', 'Khấu hao', 'Lãi suất', 'Vận chuyển', 'Thuê kho', 'Thưởng KH', 'Mặt bằng', 'Khác'];
    const values = [d.expenses.fixed.nhanSu, d.expenses.fixed.thuong13, d.expenses.fixed.khauHao, d.expenses.fixed.laiSuat,
      d.expenses.operating.vanChuyen, d.expenses.operating.thueKho, d.expenses.operating.thuongKH, d.expenses.operating.matBang, d.expenses.operating.khac];
    charts.expense = new Chart(ctx, {
      type: 'polarArea',
      data: { labels, datasets: [{ data: values, backgroundColor: COLORS.pie.concat(['#64748b']).map(c => c + '99'), borderWidth: 1, borderColor: '#fff' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { family: 'Inter', size: 11 } } },
          tooltip: { callbacks: { label: c => c.label + ': ' + fmt(c.raw) } } },
        scales: { r: { ticks: { display: false }, grid: { color: '#f3f4f6' } } }
      }
    });
  }

  function renderProfitTrend(d) {
    const ctx = document.getElementById('profitTrendChart').getContext('2d');
    if (charts.profit) charts.profit.destroy();
    const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
    charts.profit = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label: 'Doanh thu', data: d.monthlyRevenue, borderColor: COLORS.primary, backgroundColor: COLORS.primary + '18', fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2.5 },
          { label: 'Chi phí', data: d.monthlyExpense, borderColor: COLORS.warning, backgroundColor: COLORS.warning + '10', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
          { label: 'Lợi nhuận', data: d.monthlyProfit, borderColor: COLORS.success, backgroundColor: COLORS.success + '10', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Inter', size: 12 } } },
          tooltip: { mode: 'index', intersect: false, callbacks: { label: c => c.dataset.label + ': ' + fmt(c.raw) } } },
        scales: { y: { ticks: { callback: v => fmt(v), font: { size: 11 } }, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
      }
    });
  }

  function renderTables(d) {
    document.getElementById('revenueTable').innerHTML = `
      <thead><tr><th>Danh mục</th><th style="text-align:right">Số tiền (VNĐ)</th><th style="text-align:right">Tỷ trọng</th></tr></thead>
      <tbody>
        <tr><td>Bán hàng sang tay tại NM</td><td class="amount">${fmtFull(d.revenue.sangTay)}</td><td class="amount">${pct(d.revenue.sangTay, d.revenue.total)}</td></tr>
        <tr><td>Doanh thu tại kho</td><td class="amount">${fmtFull(d.revenue.kho)}</td><td class="amount">${pct(d.revenue.kho, d.revenue.total)}</td></tr>
        <tr><td>Hàng lẻ</td><td class="amount">${fmtFull(d.revenue.hangLe)}</td><td class="amount">${pct(d.revenue.hangLe, d.revenue.total)}</td></tr>
        <tr><td>Nguyên container</td><td class="amount">${fmtFull(d.revenue.nguyenCont)}</td><td class="amount">${pct(d.revenue.nguyenCont, d.revenue.total)}</td></tr>
        <tr style="font-weight:700;border-top:2px solid #e5e7eb"><td>Tổng cộng</td><td class="amount positive">${fmtFull(d.revenue.total)}</td><td class="amount">100%</td></tr>
      </tbody>`;

    const expRows = [
      ['Nhân sự (lương + CKNS)', d.expenses.fixed.nhanSu], ['Thưởng tháng 13', d.expenses.fixed.thuong13],
      ['Khấu hao TSCĐ', d.expenses.fixed.khauHao], ['Chi phí tài chính (lãi suất)', d.expenses.fixed.laiSuat],
      ['Vận chuyển đường thủy', d.expenses.operating.vanChuyen], ['Thuê kho', d.expenses.operating.thueKho],
      ['Thưởng khách hàng cuối năm', d.expenses.operating.thuongKH], ['Mặt bằng', d.expenses.operating.matBang],
      ['Chi phí khác + kho + xăng dầu', d.expenses.operating.khac]
    ];
    document.getElementById('expenseTable').innerHTML = `
      <thead><tr><th>Danh mục chi phí</th><th style="text-align:right">Số tiền (VNĐ)</th><th style="text-align:right">Tỷ trọng</th></tr></thead>
      <tbody>${expRows.map(r => `<tr><td>${r[0]}</td><td class="amount">${fmtFull(r[1])}</td><td class="amount">${pct(r[1], d.expenses.total)}</td></tr>`).join('')}
        <tr style="font-weight:700;border-top:2px solid #e5e7eb"><td>Tổng chi phí</td><td class="amount negative">${fmtFull(d.expenses.total)}</td><td class="amount">100%</td></tr>
      </tbody>`;
  }

  function renderMetrics(d) {
    const items = [
      { label: 'Tổng m² gạch bán', value: fmt(d.metrics.totalArea), unit: 'm²' },
      { label: 'Doanh thu thuần', value: fmt(d.metrics.netRevenue), unit: 'VNĐ' },
      { label: 'LN trước thuế', value: fmt(d.metrics.profitBT), unit: 'VNĐ' },
      { label: 'Nợ ngắn hạn', value: fmt(d.metrics.shortTermDebt), unit: 'VNĐ' },
      { label: 'LN chưa phân bổ', value: fmt(d.metrics.profitPreTax), unit: 'VNĐ' },
      { label: 'Tỷ suất LN', value: (d.metrics.profitRate * 100).toFixed(2) + '%', unit: '' },
      { label: 'Chi phí / m² gạch', value: fmt(Math.round(d.metrics.costPerM2)), unit: 'đ/m²' },
      { label: 'Doanh thu / m² gạch', value: fmt(Math.round(d.metrics.revenuePerM2)), unit: 'đ/m²' }
    ];
    document.getElementById('metricsGrid').innerHTML = items.map(m => `
      <div class="metric-item"><div class="metric-label">${m.label}</div><div class="metric-value">${m.value}</div><div class="metric-unit">${m.unit}</div></div>`).join('');
  }

  async function loadDashboard() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const data = await MisaAPI.fetchDashboard(month);
    document.getElementById('lastSync').textContent = 'Cập nhật: ' + data.timestamp;
    renderKPIs(data);
    renderRevenueChart(data);
    renderWeeklyChart(data);
    renderExpenseChart(data);
    renderProfitTrend(data);
    renderTables(data);
    renderMetrics(data);
  }

  document.getElementById('monthSelect').addEventListener('change', loadDashboard);
  loadDashboard();
  setInterval(loadDashboard, 30000); // Auto-refresh every 30s
})();
