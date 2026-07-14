import { useEffect, useState } from 'react';
import { getProducts } from '../api/client';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then(res => {
      setProducts(res.data);
      setLoading(false);
    });
  }, []);

  const lowStock = products.filter(p => p.current_stock < 20);
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.current_stock, 0);

  if (loading) return <p style={{ color: '#888' }}>Loading...</p>;

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Dashboard</h2>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Products', value: totalProducts },
          { label: 'Total Stock Units', value: totalStock },
          { label: 'Low Stock Alerts', value: lowStock.length },
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

      {/* All products table */}
      <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>All Products</h3>
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>
              {['Product', 'Category', 'Stock', 'Price'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: '500' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{p.name}</td>
                <td style={{ padding: '12px 16px', color: '#666' }}>{p.category}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    color: p.current_stock < 20 ? '#d00' : '#1a1a1a',
                    fontWeight: p.current_stock < 20 ? '500' : '400'
                  }}>
                    {p.current_stock}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#666' }}>₹{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}