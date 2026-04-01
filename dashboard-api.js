/**
 * MISA API Simulator - Mock data based on financial report template
 * Simulates real-time data fetching from MISA accounting software
 */
const MisaAPI = (() => {
  const BASE_DATA = {
    revenue: {
      total: 362750932916,
      sangTay: 218371357648,
      kho: 107799139126,
      hangLe: 21367239382,
      nguyenCont: 15213196760
    },
    expenses: {
      total: 50428222586,
      fixed: {
        nhanSu: 12417985383,
        thuong13: 2000000000,
        khauHao: 172347883,
        laiSuat: 666015697
      },
      operating: {
        vanChuyen: 11358859000,
        thueKho: 1870000000,
        thuongKH: 1900000000,
        matBang: 2833914000,
        khac: 17209100623
      }
    },
    cogs: { total: 312322710330, sangTay: 312322710330 },
    metrics: {
      totalArea: 2580189,
      netRevenue: 387819911553,
      totalCogs: 340965728710,
      totalCostLT: 38450329404,
      profitBT: 8403853439,
      shortTermDebt: 3404194117,
      profitPreTax: 4999659322,
      profitRate: 0.01289170353,
      costPerM2: 14902.14,
      revenuePerM2: 150306.78
    }
  };

  function jitter(val, pct = 0.03) {
    return Math.round(val * (1 + (Math.random() - 0.5) * 2 * pct));
  }

  function splitWeekly(total) {
    const w = [0.22, 0.28, 0.26, 0.24];
    return w.map(r => jitter(Math.round(total * r), 0.05));
  }

  function monthlyTrend(annual, months = 12) {
    const seasonal = [0.07,0.06,0.085,0.08,0.09,0.085,0.08,0.095,0.09,0.085,0.09,0.09];
    return seasonal.slice(0, months).map(r => jitter(Math.round(annual * r), 0.04));
  }

  return {
    fetchDashboard(month) {
      return new Promise(resolve => {
        setTimeout(() => {
          const d = JSON.parse(JSON.stringify(BASE_DATA));
          const mf = 1 + (Math.random() - 0.5) * 0.06;
          Object.keys(d.revenue).forEach(k => { if (k !== 'total') d.revenue[k] = jitter(d.revenue[k]); });
          d.revenue.total = d.revenue.sangTay + d.revenue.kho + d.revenue.hangLe + d.revenue.nguyenCont;

          Object.keys(d.expenses.fixed).forEach(k => d.expenses.fixed[k] = jitter(d.expenses.fixed[k]));
          Object.keys(d.expenses.operating).forEach(k => d.expenses.operating[k] = jitter(d.expenses.operating[k]));
          const fixedTotal = Object.values(d.expenses.fixed).reduce((a,b) => a+b, 0);
          const opTotal = Object.values(d.expenses.operating).reduce((a,b) => a+b, 0);
          d.expenses.total = fixedTotal + opTotal;

          d.cogs.total = jitter(d.cogs.total);
          Object.keys(d.metrics).forEach(k => {
            if (typeof d.metrics[k] === 'number') d.metrics[k] = k.includes('Rate') ? +(d.metrics[k] * (1 + (Math.random()-0.5)*0.1)).toFixed(6) : jitter(d.metrics[k]);
          });

          d.weekly = {
            revenue: splitWeekly(d.revenue.total / 12),
            expense: splitWeekly(d.expenses.total / 12)
          };
          d.monthlyRevenue = monthlyTrend(d.revenue.total);
          d.monthlyExpense = monthlyTrend(d.expenses.total);
          d.monthlyProfit = d.monthlyRevenue.map((r, i) => r - d.monthlyExpense[i] - Math.round(d.cogs.total / 12 * (1 + (Math.random()-0.5)*0.08)));
          d.timestamp = new Date().toLocaleString('vi-VN');
          resolve(d);
        }, 300 + Math.random() * 400);
      });
    }
  };
})();
