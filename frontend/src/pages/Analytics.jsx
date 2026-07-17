import { useEffect, useState } from 'react';
import { getProducts, getSalesForProduct } from '../api/client';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement);

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: '#f0f0f0' }, beginAtZero: true }
  }
};

export default function Analytics() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [sales, setSales] = useState([]);
  const [allSales, setAllSales] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProducts().then(data => {
      setProducts(data || []);
      // Load sales for all products for comparison chart
      data?.forEach(p => {
        getSalesForProduct(p.id).then(s => {
          setAllSales(prev => ({ ...prev, [p.name]: s || [] }));
        });
      });
    });
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setLoading(true);
      getSalesForProduct(selectedProduct).then(data => {
        setSales(data || []);
        setLoading(false);
      });
    }
  }, [selectedProduct]);

  // Daily sales chart data
  const dailyChartData = {
    labels: sales.map(s => s.sale_date),
    datasets: [{
      label: 'Units Sold',
      data: sales.map(s => s.quantity_sold),
      backgroundColor: '#1a1a1a',
      borderColor: '#1a1a1a',
      borderRadius: 4,
    }]
  };

  // Trend line data
  const trendData = {
    labels: sales.map(s => s.sale_date),
    datasets: [{
      label: 'Sales Trend',
      data: sales.map(s => s.quantity_sold),
      borderColor: '#1a1a1a',
      backgroundColor: 'rgba(26,26,26,0.05)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }]
  };

  // Product comparison doughnut
  const comparisonData = {
    labels: Object.keys(allSales),
    datasets: [{
      data: Object.values(allSales).map(s => s.reduce((sum, r) => sum + r.quantity_sold, 0)),
      backgroundColor: ['#1a1a1a', '#444', '#666', '#888', '#aaa', '#ccc'],
      borderWidth: 0,
    }]
  };

  const totalSold = sales.reduce((sum, s) => sum + s.quantity_sold, 0);
  const avgDaily = sales.length > 0 ? (totalSold / sales.length).toFixed(1) : 0;
  const maxDay = sales.length > 0 ? Math.max(...sales.map(s => s.quantity_sold)) : 0;
  const trend = sales.length > 1
    ? sales[sales.length - 1].quantity_sold > sales[0].quantity_sold ? 'Increasing' : 'Decreasing'
    : 'N/A';

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Analytics</h2>

      {/* Product selector */}
      <div style={{ marginBottom: '24px' }}>
        <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{
          padding: '8px 12px', border: '1px solid #e5e5e5', borderRadius: '6px',
          fontSize: '14px', outline: 'none', minWidth: '220px'
        }}>
          <option value="">Select product to analyse</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {selectedProduct && !loading && sales.length > 0 && (
        <>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Units Sold', value: totalSold },
              { label: 'Avg Daily Sales', value: `${avgDaily} units` },
              { label: 'Peak Day Sales', value: `${maxDay} units` },
              { label: 'Demand Trend', value: trend },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#fff', border: '1px solid #e5e5e5',
                borderRadius: '8px', padding: '16px'
              }}>
                <p style={{ fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: stat.label === 'Demand Trend' ? (trend === 'Increasing' ? '#2d7a2d' : '#d00') : '#1a1a1a' }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Daily Sales Volume
              </h3>
              <Bar data={dailyChartData} options={chartOptions} />
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sales Trend
              </h3>
              <Line data={trendData} options={chartOptions} />
            </div>
          </div>
        </>
      )}

      {selectedProduct && sales.length === 0 && !loading && (
        <p style={{ color: '#888', fontSize: '13px' }}>No sales data for this product yet.</p>
      )}

      {/* Product comparison */}
      {Object.keys(allSales).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sales by Product
            </h3>
            <Doughnut data={comparisonData} options={{ plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } } }} />
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Product Performance
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  {['Product', 'Total Sold', 'Avg/Day', 'Trend'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '500', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(allSales).map(([name, s], i) => {
                  const total = s.reduce((sum, r) => sum + r.quantity_sold, 0);
                  const avg = s.length > 0 ? (total / s.length).toFixed(1) : 0;
                  const t = s.length > 1 ? (s[s.length - 1].quantity_sold > s[0].quantity_sold ? '↑' : '↓') : '—';
                  return (
                    <tr key={name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '500', fontSize: '13px' }}>{name}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px' }}>{total}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#666' }}>{avg}</td>
                      <td style={{ padding: '10px 12px', fontSize: '14px', color: t === '↑' ? '#2d7a2d' : t === '↓' ? '#d00' : '#888', fontWeight: '600' }}>{t}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}