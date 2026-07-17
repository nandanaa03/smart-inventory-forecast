import { useEffect, useState } from 'react';
import { getProducts, getSalesForProduct } from '../api/client';

function calculateHealthScore(product, salesData) {
  const sales = salesData[product.id] || [];
  if (sales.length === 0) return { score: 50, label: 'Insufficient Data', color: '#888' };

  const avgDailyDemand = sales.reduce((sum, s) => sum + s.quantity_sold, 0) / sales.length;
  const daysOfStock = avgDailyDemand > 0 ? product.current_stock / avgDailyDemand : 999;

  // Trend
  const recentSales = sales.slice(-3).map(s => s.quantity_sold);
  const olderSales = sales.slice(0, 3).map(s => s.quantity_sold);
  const recentAvg = recentSales.reduce((a, b) => a + b, 0) / recentSales.length;
  const olderAvg = olderSales.reduce((a, b) => a + b, 0) / olderSales.length;
  const trendRising = recentAvg > olderAvg;

  // Score calculation
  let score = 0;

  // Stock coverage (40 points)
  if (daysOfStock >= 30) score += 40;
  else if (daysOfStock >= 14) score += 30;
  else if (daysOfStock >= 7) score += 20;
  else if (daysOfStock >= 3) score += 10;
  else score += 0;

  // Stock level (30 points)
  if (product.current_stock >= 100) score += 30;
  else if (product.current_stock >= 50) score += 20;
  else if (product.current_stock >= 20) score += 10;
  else score += 0;

  // Demand trend (30 points) — stable or falling is better for health
  if (!trendRising) score += 30;
  else if (recentAvg / olderAvg < 1.5) score += 20;
  else score += 10;

  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Moderate' : score >= 40 ? 'At Risk' : 'Critical';
  const color = score >= 80 ? '#2d7a2d' : score >= 60 ? '#b8860b' : score >= 40 ? '#e65c00' : '#d00';

  return { score, label, color, daysOfStock: daysOfStock.toFixed(1), avgDailyDemand: avgDailyDemand.toFixed(1) };
}

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [salesData, setSalesData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then(data => {
      setProducts(data || []);
      // Load sales for all products
      Promise.all((data || []).map(p =>
        getSalesForProduct(p.id).then(s => ({ id: p.id, sales: s || [] }))
      )).then(results => {
        const map = {};
        results.forEach(r => { map[r.id] = r.sales; });
        setSalesData(map);
        setLoading(false);
      });
    });
  }, []);

  const lowStock = products.filter(p => p.current_stock < 20);
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.current_stock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.price), 0);
  const criticalProducts = products.filter(p => {
    const h = calculateHealthScore(p, salesData);
    return h.label === 'Critical';
  });

  if (loading) return <p style={{ color: '#888', padding: '32px' }}>Loading...</p>;

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Dashboard</h2>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Products', value: totalProducts },
          { label: 'Total Stock Units', value: totalStock },
          { label: 'Inventory Value', value: `₹${totalValue.toLocaleString()}` },
          { label: 'Critical Alerts', value: criticalProducts.length },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#fff', border: '1px solid #e5e5e5',
            borderRadius: '8px', padding: '20px'
          }}>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{stat.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '600' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Low Stock Alerts</h3>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
            {lowStock.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < lowStock.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}>
                <div>
                  <p style={{ fontWeight: '500' }}>{p.name}</p>
                  <p style={{ fontSize: '12px', color: '#888' }}>{p.category}</p>
                </div>
                <span style={{
                  background: '#fff3f3', color: '#d00',
                  padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                }}>
                  {p.current_stock} units left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Health */}
      <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Inventory Health</h3>
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>
              {['Product', 'Stock', 'Avg Daily Demand', 'Days Remaining', 'Health Score'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: '500' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const health = calculateHealthScore(p, salesData);
              return (
                <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{p.name}</td>
                  <td style={{ padding: '12px 16px' }}>{p.current_stock}</td>
                  <td style={{ padding: '12px 16px', color: '#666' }}>{health.avgDailyDemand} units</td>
                  <td style={{ padding: '12px 16px', color: '#666' }}>{health.daysOfStock} days</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Score bar */}
                      <div style={{ width: '80px', height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${health.score}%`, height: '100%', background: health.color, borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: health.color }}>
                        {health.score} — {health.label}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}