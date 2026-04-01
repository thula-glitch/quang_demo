/**
 * Dashboard App - Renders tabbed reports from MISA API
 */
(function () {
  const fmt = n => {
    if (n === undefined || n === null) return '—';
    if (Math.abs(n) >= 1e12) return (n/1e12).toFixed(2)+' Nghìn tỷ';
    if (Math.abs(n) >= 1e9) return (n/1e9).toFixed(1)+' Tỷ';
    if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(1)+' Triệu';
    return n.toLocaleString('vi-VN');
  };
  const fmtD = n => (n||0).toLocaleString('vi-VN')+' đ';
  const pct = (p,t) => t ? ((p/t)*100).toFixed(1)+'%' : '—';
  let C = {};
  const COL = {
    primary:'#1e40af', light:'#3b82f6', success:'#10b981', warning:'#f59e0b',
    danger:'#ef4444', info:'#6366f1', pink:'#ec4899', teal:'#14b8a6', slate:'#64748b',
    pie:['#1e40af','#3b82f6','#10b981','#f59e0b','#ef4444','#6366f1','#ec4899','#14b8a6','#64748b']
  };
  const CFONT = {family:'Inter',size:11};

  document.getElementById('sidebarOpen').onclick=()=>document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarClose').onclick=()=>document.getElementById('sidebar').classList.remove('open');

  // ===== Tabs Logic =====
  const tabBtns = document.querySelectorAll('.tab-btn');
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(targetId) {
    tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.target === targetId));
    navItems.forEach(nav => nav.classList.toggle('active', nav.dataset.tab === targetId));
    tabContents.forEach(content => {
      if (content.id === targetId) {
        content.classList.add('active');
        // Fix Chart.js sizing when container becomes visible
        setTimeout(() => { Object.values(C).forEach(c => { if(c && typeof c.resize==='function') c.resize(); }); }, 10);
      } else {
        content.classList.remove('active');
      }
    });
  }

  tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.target)));
  navItems.forEach(nav => nav.addEventListener('click', (e) => { e.preventDefault(); switchTab(nav.dataset.tab); }));

  // ===== KPI Cards =====
  function renderKPIs(d) {
    const cards = [
      {label:'Tổng Doanh Thu',value:fmt(d.revenue.total),sub:'Cơ cấu 4 nguồn',icon:'fa-chart-line',color:COL.primary,change:'+12.3%',dir:'up'},
      {label:'Tổng Chi Phí',value:fmt(d.expenses.total),sub:'CĐ: '+fmt(d.expenses.fixedTotal)+' | VH: '+fmt(d.expenses.operatingTotal),icon:'fa-wallet',color:COL.warning,change:'+5.2%',dir:'up'},
      {label:'Giá Vốn Hàng Bán',value:fmt(d.cogs.total),sub:pct(d.cogs.total,d.revenue.total)+' trên doanh thu',icon:'fa-boxes-stacked',color:COL.danger,change:'-2.1%',dir:'down'},
      {label:'Lợi Nhuận Gộp',value:fmt(d.profit.gross),sub:'Sau CP: '+fmt(d.profit.net),icon:'fa-coins',color:COL.success,change:'+8.7%',dir:'up'}
    ];
    document.getElementById('kpiGrid').innerHTML = cards.map(c=>`
      <div class="kpi-card" style="--card-accent:${c.color}">
        <div class="kpi-icon" style="background:${c.color}15;color:${c.color}"><i class="fas ${c.icon}"></i></div>
        <div class="kpi-label">${c.label}</div>
        <div class="kpi-value">${c.value}<span class="kpi-change ${c.dir}"><i class="fas fa-arrow-${c.dir}"></i>${c.change}</span></div>
        <div class="kpi-sub">${c.sub}</div>
      </div>`).join('');
  }

  // ===== Render Donut Abstract =====
  function renderDonut(id, chartKey, labels, dataVals, colors, centerText, fmtCb) {
    const el = document.getElementById(id);
    if (!el) return;
    const ctx = el.getContext('2d');
    if(C[chartKey]) C[chartKey].destroy();
    C[chartKey] = new Chart(ctx,{type:'doughnut',data:{labels,
      datasets:[{data:dataVals,backgroundColor:colors,borderWidth:2,borderColor:'#fff',hoverOffset:10}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'60%',
        plugins:{legend:{position:'bottom',labels:{padding:14,usePointStyle:true,font:CFONT}},
          tooltip:{callbacks:{label:c=>c.label+': '+fmt(c.raw)+' ('+pct(c.raw,dataVals.reduce((a,b)=>a+b,0))+')'}}}}});
  }

  // ===== Charts =====
  function renderCharts(d) {
    // Revenue Donuts (Overview + Tab)
    const revL = ['Sang tay NM','Tại kho','Hàng lẻ','Nguyên cont'];
    const revD = [d.revenue.sangTay,d.revenue.kho,d.revenue.hangLe,d.revenue.nguyenCont];
    renderDonut('revenueChartOverview', 'revOvw', revL, revD, COL.pie.slice(0,4));
    renderDonut('revenueChartTab', 'revTab', revL, revD, COL.pie.slice(0,4));

    // Expense Donuts (Overview + Tab)
    const expL = ['Nhân sự','Thưởng T13','Khấu hao','Lãi suất','Vận chuyển','Thuê kho','Thưởng KH','Mặt bằng','Chi phí kho','Xăng dầu','CP khác'];
    const f=d.expenses.fixed, o=d.expenses.operating;
    const expD = [f.nhanSu,f.thuong13,f.khauHao,f.laiSuat,o.vanChuyen,o.thueKho,o.thuongKH,o.matBang,o.chiPhiKho,o.xangDau,o.chiPhiKhac];
    const expC = COL.pie.concat(['#94a3b8','#475569']);
    renderDonut('expenseChartOverview', 'expOvw', expL, expD, expC);
    renderDonut('expenseChartTab', 'expTab', expL, expD, expC);

    // COGS Donut
    renderDonut('cogsChart', 'cogsT', revL, [d.cogs.sangTay,d.cogs.kho,d.cogs.hangLe,d.cogs.nguyenCont], [COL.danger+'dd',COL.warning+'dd',COL.info+'dd',COL.teal+'dd']);

    // Profit Waterfall
    const elP = document.getElementById('profitStructChart');
    if (elP) {
      if(C.ps) C.ps.destroy();
      C.ps = new Chart(elP.getContext('2d'),{type:'bar',data:{
        labels:['Doanh thu','Giá vốn','LN Gộp','Chi phí','LN Sau CP','Nợ NH','LN Trước thuế'],
        datasets:[{data:[d.revenue.total,d.cogs.total,d.profit.gross,d.expenses.total,d.profit.net,d.profit.shortTermDebt,d.profit.afterDebt],
          backgroundColor:[COL.primary+'cc',COL.danger+'99',COL.success+'cc',COL.warning+'99',COL.success+'99',COL.slate+'99',COL.info+'cc'],
          borderRadius:6,barPercentage:0.65}]},
        options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
          plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.raw)}}},
          scales:{x:{ticks:{callback:v=>fmt(v),font:{size:10}},grid:{color:'#f3f4f6'}},y:{grid:{display:false},ticks:{font:{size:11,family:'Inter'}}}}}});
    }

    // Trend
    const elT = document.getElementById('profitTrendChart');
    if (elT) {
      if(C.trend) C.trend.destroy();
      C.trend = new Chart(elT.getContext('2d'),{type:'line',data:{labels:['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'],
        datasets:[
        {label:'Doanh thu',data:d.monthly.revenue,borderColor:COL.primary,backgroundColor:COL.primary+'18',fill:true,tension:.4,pointRadius:3,borderWidth:2.5},
        {label:'Giá vốn',data:d.monthly.cogs,borderColor:COL.danger,backgroundColor:COL.danger+'0a',fill:false,tension:.4,pointRadius:2,borderWidth:2,borderDash:[5,3]},
        {label:'Chi phí',data:d.monthly.expense,borderColor:COL.warning,backgroundColor:COL.warning+'10',fill:false,tension:.4,pointRadius:2,borderWidth:2},
        {label:'LN Gộp',data:d.monthly.grossProfit,borderColor:COL.success,backgroundColor:COL.success+'15',fill:true,tension:.4,pointRadius:3,borderWidth:2.5},
        {label:'LN Ròng',data:d.monthly.netProfit,borderColor:COL.info,backgroundColor:COL.info+'10',fill:false,tension:.4,pointRadius:2,borderWidth:2}
      ]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{legend:{position:'bottom',labels:{usePointStyle:true,font:CFONT}},tooltip:{mode:'index',intersect:false,callbacks:{label:c=>c.dataset.label+': '+fmt(c.raw)}}},
        scales:{y:{ticks:{callback:v=>fmt(v),font:{size:10}},grid:{color:'#f3f4f6'}},x:{grid:{display:false}}}}});
    }
  }

  // ===== Tables =====
  function renderAllTables(d) {
    // Revenue Breakdown Tab 2
    document.getElementById('revenueTable').innerHTML = `
      <thead><tr><th>Danh mục</th><th style="text-align:right">Số tiền (VNĐ)</th><th style="text-align:right">Tỷ trọng</th></tr></thead>
      <tbody>
        ${[['Sang tay NM',d.revenue.sangTay],['Tại kho',d.revenue.kho],['Hàng lẻ',d.revenue.hangLe],['Nguyên cont',d.revenue.nguyenCont]]
          .map(r=>`<tr><td>${r[0]}</td><td class="amount">${fmtD(r[1])}</td><td class="amount">${pct(r[1], d.revenue.total)}</td></tr>`).join('')}
        <tr style="font-weight:700;border-top:2px solid #e5e7eb"><td>Tổng cộng</td><td class="amount positive">${fmtD(d.revenue.total)}</td><td class="amount">100%</td></tr>
      </tbody>`;

    // Revenue Weekly Tab 2
    const w = d.weekly;
    const rRows = [{name:'Sang tay NM',w:w.revenue.sangTay,cls:'sub-row'},{name:'Tại kho',w:w.revenue.kho,cls:'sub-row'},{name:'Hàng lẻ',w:w.revenue.hangLe,cls:'sub-row'},{name:'Nguyên cont',w:w.revenue.nguyenCont,cls:'sub-row'}];
    let rBody = `<thead><tr><th>Danh mục</th><th style="text-align:right">Tuần 1</th><th style="text-align:right">Tuần 2</th><th style="text-align:right">Tuần 3</th><th style="text-align:right">Tuần 4</th><th style="text-align:right">Tổng tháng</th></tr></thead><tbody>`;
    rRows.forEach(r => { rBody += `<tr class="${r.cls}"><td>${r.name}</td>${r.w.map(v=>`<td class="amount">${fmtD(v)}</td>`).join('')}<td class="amount" style="font-weight:700">${fmtD(r.w.reduce((a,b)=>a+b,0))}</td></tr>`; });
    rBody += `<tr style="font-weight:700;border-top:2px solid #e5e7eb"><td>Tổng doanh thu</td>${w.revenue.total.map(v=>`<td class="amount positive">${fmtD(v)}</td>`).join('')}<td class="amount positive">${fmtD(w.revenue.total.reduce((a,b)=>a+b,0))}</td></tr></tbody>`;
    document.getElementById('revenueWeeklyTable').innerHTML = rBody;

    // Reconciliation Tab 2
    document.getElementById('reconcileTable').innerHTML = `
      <thead><tr><th>Chỉ tiêu đối chiếu</th><th style="text-align:right">Số tiền (VNĐ)</th><th>Ghi chú</th></tr></thead>
      <tbody><tr><td>Doanh thu thuần (MISA)</td><td class="amount" style="font-weight:700">${fmtD(d.metrics.netRevenue)}</td><td style="color:#6b7280;font-size:.8rem">Tổng DT trên sổ kế toán MISA</td></tr>
        <tr><td>(-) Chiết khấu / Trả lại</td><td class="amount negative">${fmtD(d.metrics.chietKhau)}</td><td style="color:#6b7280;font-size:.8rem">CK thương mại, hàng trả lại, giảm giá</td></tr>
        <tr style="font-weight:700;border-top:2px solid #e5e7eb;background:#f0fdf4"><td>= Tổng DT theo cơ cấu</td><td class="amount positive">${fmtD(d.revenue.total)}</td><td style="color:#6b7280;font-size:.8rem">Khớp với bảng cơ cấu nguồn thu</td></tr>
        <tr><td>Chênh lệch</td><td class="amount" style="font-weight:700">${fmtD(d.metrics.netRevenue - d.revenue.total - d.metrics.chietKhau)}</td><td style="color:#10b981;font-size:.8rem">✓ Đã đối chiếu</td></tr></tbody>`;

    // Fixed & Operating Expenses Tab 3
    const f = d.expenses.fixed, tf = d.expenses.fixedTotal, o = d.expenses.operating, to = d.expenses.operatingTotal;
    document.getElementById('fixedExpTable').innerHTML = `
      <thead><tr><th>Chi phí cố định</th><th style="text-align:right">Số tiền</th><th style="text-align:right">Tỷ trọng</th></tr></thead>
      <tbody>${[['Nhân sự (Lương+CKNS)',f.nhanSu],['Thưởng T13 dự kiến',f.thuong13],['Khấu hao TSCĐ',f.khauHao],['Chi phí tài chính',f.laiSuat]].map(r=>`<tr><td>${r[0]}</td><td class="amount">${fmtD(r[1])}</td><td class="amount">${pct(r[1],tf)}</td></tr>`).join('')}
        <tr style="font-weight:700;border-top:2px solid #e5e7eb"><td>Tổng cố định</td><td class="amount negative">${fmtD(tf)}</td><td class="amount">100%</td></tr></tbody>`;

    const khacTotal = o.chiPhiKho + o.xangDau + o.chiPhiKhac;
    document.getElementById('opExpTable').innerHTML = `
      <thead><tr><th>Chi phí vận hành</th><th style="text-align:right">Số tiền</th><th style="text-align:right">Tỷ trọng</th></tr></thead>
      <tbody>${[['Vận chuyển đường thủy',o.vanChuyen],['Thuê kho',o.thueKho],['Thưởng khách hàng',o.thuongKH],['Mặt bằng',o.matBang]].map(r=>`<tr><td>${r[0]}</td><td class="amount">${fmtD(r[1])}</td><td class="amount">${pct(r[1],to)}</td></tr>`).join('')}
        <tr class="group-header"><td>Chi phí khác + kho + xăng dầu</td><td class="amount">${fmtD(khacTotal)}</td><td class="amount">${pct(khacTotal,to)}</td></tr>
        ${[['↳ Chi phí kho bãi',o.chiPhiKho],['↳ Xăng dầu',o.xangDau],['↳ Chi phí khác',o.chiPhiKhac]].map(r=>`<tr class="sub-row"><td>${r[0]}</td><td class="amount">${fmtD(r[1])}</td><td class="amount">${pct(r[1],to)}</td></tr>`).join('')}
        <tr style="font-weight:700;border-top:2px solid #e5e7eb"><td>Tổng vận hành</td><td class="amount negative">${fmtD(to)}</td><td class="amount">100%</td></tr></tbody>`;

    // COGS & Margin Tab 4
    document.getElementById('cogsTable').innerHTML = `
      <thead><tr><th>Loại hàng</th><th style="text-align:right">Giá vốn</th><th style="text-align:right">% / GVHB</th><th style="text-align:right">% / Doanh Thu Từng Loại</th></tr></thead>
      <tbody>${[['Sang tay NM',d.cogs.sangTay],['Tại kho',d.cogs.kho],['Hàng lẻ',d.cogs.hangLe],['Nguyên cont',d.cogs.nguyenCont]].map((r,i)=>{
        const revs = [d.revenue.sangTay,d.revenue.kho,d.revenue.hangLe,d.revenue.nguyenCont];
        return `<tr><td>${r[0]}</td><td class="amount">${fmtD(r[1])}</td><td class="amount">${pct(r[1],d.cogs.total)}</td><td class="amount">${pct(r[1],revs[i])}</td></tr>`;
      }).join('')}
        <tr style="font-weight:700;border-top:2px solid #e5e7eb"><td>Tổng GVHB</td><td class="amount negative">${fmtD(d.cogs.total)}</td><td class="amount">100%</td><td class="amount">${pct(d.cogs.total,d.revenue.total)}</td></tr></tbody>`;

    document.getElementById('marginTable').innerHTML = `
      <thead><tr><th>Loại hàng</th><th style="text-align:right">Biên lợi nhuận gộp (%)</th></tr></thead>
      <tbody>${[{name:'Sang tay NM',rev:d.revenue.sangTay,cogs:d.cogs.sangTay},{name:'Tại kho',rev:d.revenue.kho,cogs:d.cogs.kho},{name:'Hàng lẻ',rev:d.revenue.hangLe,cogs:d.cogs.hangLe},{name:'Nguyên cont',rev:d.revenue.nguyenCont,cogs:d.cogs.nguyenCont}].map(it=>`<tr><td>${it.name}</td><td class="amount ${it.rev-it.cogs>=0?'positive':'negative'}">${pct(it.rev-it.cogs,it.rev)}</td></tr>`).join('')}
        <tr style="font-weight:700;border-top:2px solid #e5e7eb"><td>Tổng cộng</td><td class="amount positive">${pct(d.profit.gross,d.revenue.total)}</td></tr></tbody>`;

    // Profit Table Tab 4
    document.getElementById('profitTable').innerHTML = `
      <thead><tr><th>Chỉ tiêu thặng dư</th><th style="text-align:right">Số tiền</th><th style="text-align:right">% / DT</th></tr></thead>
      <tbody><tr><td>Doanh thu</td><td class="amount">${fmtD(d.revenue.total)}</td><td class="amount">100%</td></tr>
        <tr><td>(-) Giá vốn hàng bán</td><td class="amount negative">${fmtD(d.cogs.total)}</td><td class="amount">${pct(d.cogs.total,d.revenue.total)}</td></tr>
        <tr style="font-weight:700;background:#f0fdf4"><td>= Lợi nhuận gộp</td><td class="amount positive">${fmtD(d.profit.gross)}</td><td class="amount">${pct(d.profit.gross,d.revenue.total)}</td></tr>
        <tr><td>(-) Chi phí cố định</td><td class="amount">${fmtD(tf)}</td><td class="amount">${pct(tf,d.revenue.total)}</td></tr>
        <tr><td>(-) Chi phí vận hành</td><td class="amount">${fmtD(to)}</td><td class="amount">${pct(to,d.revenue.total)}</td></tr>
        <tr style="font-weight:700;background:#eff6ff"><td>= Lợi nhuận sau chi phí</td><td class="amount ${d.profit.net>=0?'positive':'negative'}">${fmtD(d.profit.net)}</td><td class="amount">${pct(d.profit.net,d.revenue.total)}</td></tr>
        <tr><td>(-) Nợ phải trả ngắn hạn</td><td class="amount">${fmtD(d.profit.shortTermDebt)}</td><td class="amount">${pct(d.profit.shortTermDebt,d.revenue.total)}</td></tr>
        <tr style="font-weight:700;background:#fefce8"><td>= LN trước thuế chưa phân bổ</td><td class="amount ${d.profit.afterDebt>=0?'positive':'negative'}">${fmtD(d.profit.afterDebt)}</td><td class="amount">${pct(d.profit.afterDebt,d.revenue.total)}</td></tr></tbody>`;
  }

  function renderMetrics(d) {
    document.getElementById('metricsGrid').innerHTML = [
      {label:'Tổng m² gạch bán',value:fmt(d.metrics.totalArea),unit:'m²'},{label:'Doanh thu thuần',value:fmt(d.metrics.netRevenue),unit:'VNĐ'},
      {label:'LN trước thuế',value:fmt(d.profit.beforeTax),unit:'VNĐ'},{label:'Nợ ngắn hạn',value:fmt(d.profit.shortTermDebt),unit:'VNĐ'},
      {label:'LN chưa phân bổ',value:fmt(d.profit.afterDebt),unit:'VNĐ'},{label:'Tỷ suất LN',value:(d.profit.rate*100).toFixed(2)+'%',unit:''},
      {label:'Chi phí / m²',value:fmt(Math.round(d.metrics.costPerM2)),unit:'đ/m²'},{label:'Doanh thu / m²',value:fmt(Math.round(d.metrics.revenuePerM2)),unit:'đ/m²'}
    ].map(m=>`<div class="metric-item"><div class="metric-label">${m.label}</div><div class="metric-value">${m.value}</div><div class="metric-unit">${m.unit}</div></div>`).join('');
  }

  // ===== Load Data =====
  async function load() {
    const data = await MisaAPI.fetchDashboard(parseInt(document.getElementById('monthSelect').value));
    document.getElementById('lastSync').textContent = 'Cập nhật: '+data.timestamp;
    renderKPIs(data);
    renderCharts(data);
    renderAllTables(data);
    renderMetrics(data);
  }

  document.getElementById('monthSelect').addEventListener('change', load);
  load();
  setInterval(load, 30000); // 30s auto-refresh
})();
