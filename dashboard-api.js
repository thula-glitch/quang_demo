/**
 * MISA API Simulator - Mock data based on financial report template
 * Dữ liệu từ: MẪU THEO DÕI QUẢN LÝ TÀI CHÍNH DOANH NGHIỆP NĂM 2026
 */
const MisaAPI = (() => {
  const BASE = {
    revenue: {
      sangTay: 218371357648, kho: 107799139126, hangLe: 21367239382, nguyenCont: 15213196760,
      get total() { return this.sangTay + this.kho + this.hangLe + this.nguyenCont; }
    },
    expenses: {
      fixed: { nhanSu: 12417985383, thuong13: 2000000000, khauHao: 172347883, laiSuat: 666015697 },
      operating: { vanChuyen: 11358859000, thueKho: 1870000000, thuongKH: 1900000000, matBang: 2833914000,
        chiPhiKho: 5200000000, xangDau: 3800000000, chiPhiKhac: 8209100623 }
    },
    cogs: { sangTay: 195000000000, kho: 87000000000, hangLe: 17500000000, nguyenCont: 12822710330 },
    metrics: {
      totalArea: 2580189, netRevenue: 387819911553, totalCogs: 340965728710,
      totalCostLT: 38450329404, profitBT: 8403853439, shortTermDebt: 3404194117,
      profitPreTax: 4999659322, profitRate: 0.01289170353,
      costPerM2: 14902.14, revenuePerM2: 150306.78
    }
  };

  function jitter(v, p=0.03) { return Math.round(v * (1 + (Math.random()-0.5)*2*p)); }
  function splitW(t) { return [0.22,0.28,0.26,0.24].map(r => jitter(Math.round(t*r), 0.05)); }
  function monthT(a) { return [.07,.06,.085,.08,.09,.085,.08,.095,.09,.085,.09,.09].map(r => jitter(Math.round(a*r), 0.04)); }

  return {
    fetchDashboard(month) {
      return new Promise(resolve => {
        setTimeout(() => {
          // Revenue with jitter
          const rev = { sangTay: jitter(BASE.revenue.sangTay), kho: jitter(BASE.revenue.kho),
            hangLe: jitter(BASE.revenue.hangLe), nguyenCont: jitter(BASE.revenue.nguyenCont) };
          rev.total = rev.sangTay + rev.kho + rev.hangLe + rev.nguyenCont;

          // Expenses with detailed "khác" breakdown
          const fixed = {}; Object.keys(BASE.expenses.fixed).forEach(k => fixed[k] = jitter(BASE.expenses.fixed[k]));
          const op = {}; Object.keys(BASE.expenses.operating).forEach(k => op[k] = jitter(BASE.expenses.operating[k]));
          const fixT = Object.values(fixed).reduce((a,b)=>a+b,0);
          const opT = Object.values(op).reduce((a,b)=>a+b,0);

          // COGS breakdown by product type (#1)
          const cogs = { sangTay: jitter(BASE.cogs.sangTay), kho: jitter(BASE.cogs.kho),
            hangLe: jitter(BASE.cogs.hangLe), nguyenCont: jitter(BASE.cogs.nguyenCont) };
          cogs.total = cogs.sangTay + cogs.kho + cogs.hangLe + cogs.nguyenCont;

          // Weekly breakdown per category (#2)
          const weekly = {
            revenue: { sangTay: splitW(rev.sangTay/12), kho: splitW(rev.kho/12), hangLe: splitW(rev.hangLe/12), nguyenCont: splitW(rev.nguyenCont/12) },
            expense: { fixed: splitW(fixT/12), operating: splitW(opT/12) }
          };
          weekly.revenue.total = [0,1,2,3].map(i => weekly.revenue.sangTay[i]+weekly.revenue.kho[i]+weekly.revenue.hangLe[i]+weekly.revenue.nguyenCont[i]);
          weekly.expense.total = [0,1,2,3].map(i => weekly.expense.fixed[i]+weekly.expense.operating[i]);

          // Profit structure (#4)
          const grossProfit = rev.total - cogs.total;
          const totalExp = fixT + opT;
          const netProfit = grossProfit - totalExp;
          const profitBT = jitter(BASE.metrics.profitBT);
          const shortTermDebt = jitter(BASE.metrics.shortTermDebt);
          const profitPreTax = profitBT - shortTermDebt;

          // Monthly trends
          const mRev = monthT(rev.total), mExp = monthT(totalExp), mCogs = monthT(cogs.total);
          const mGross = mRev.map((r,i) => r - mCogs[i]);
          const mNet = mGross.map((g,i) => g - mExp[i]);

          // Metrics (#6 - reconciliation)
          const netRevenue = jitter(BASE.metrics.netRevenue);
          const chietKhau = netRevenue - rev.total; // difference explained as discounts/adjustments

          resolve({
            revenue: rev,
            expenses: { total: totalExp, fixedTotal: fixT, operatingTotal: opT, fixed, operating: op },
            cogs,
            profit: { gross: grossProfit, net: netProfit, beforeTax: profitBT, afterDebt: profitPreTax,
              shortTermDebt, rate: +(netProfit / rev.total).toFixed(6) },
            weekly,
            monthly: { revenue: mRev, expense: mExp, cogs: mCogs, grossProfit: mGross, netProfit: mNet },
            metrics: {
              totalArea: jitter(BASE.metrics.totalArea), netRevenue, chietKhau,
              totalCogs: cogs.total, totalCostLT: jitter(BASE.metrics.totalCostLT),
              costPerM2: jitter(BASE.metrics.costPerM2), revenuePerM2: jitter(BASE.metrics.revenuePerM2)
            },
            timestamp: new Date().toLocaleString('vi-VN')
          });
        }, 300 + Math.random()*400);
      });
    }
  };
})();
