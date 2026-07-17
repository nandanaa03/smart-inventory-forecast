import { useEffect, useState } from 'react';
import { getProducts, getForecast } from '../api/client';

export default function Forecast() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getProducts().then(data => setProducts(data || []));
  }, []);

  const handleForecast = async () => {
    if (!selectedProduct) return alert('Select a product');
    setLoading(true);
    setForecast(null);
    setError('');
    try {
      const data = await getForecast(selectedProduct);
      setForecast(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const urgencyColor = (urgency) => {
    if (!urgency) return '#888';
    const u = urgency.toLowerCase();
    if (u.includes('critical')) return '#d00';
    if (u.includes('high')) return '#e65c00';
    if (u.includes('medium')) return '#b8860b';
    return '#2d7a2d';
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>AI Forecast</h2>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '13px' }}>
        AI-powered restocking recommendations based on sales history and uploaded documents.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{
          padding: '8px 12px', border: '1px solid #e5e5e5', borderRadius: '6px',
          fontSize: '14px', outline: 'none', minWidth: '200px'
        }}>
          <option value="">Select product</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={handleForecast} disabled={loading} style={{
          padding: '8px 20px', background: '#1a1a1a', color: '#fff',
          border: 'none', borderRadius: '6px', fontWeight: '500', fontSize: '13px'
        }}>
          {loading ? 'Generating...' : 'Generate Forecast'}
        </button>
      </div>

      {error && <p style={{ color: '#d00', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

      {forecast && (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Current Stock', value: `${forecast.current_stock} units` },
              { label: 'Avg Daily Demand', value: `${forecast.avg_daily_demand.toFixed(1)} units` },
              { label: 'Predicted Weekly', value: `${forecast.predicted_weekly_demand} units` },
              { label: 'Days of Stock Left', value: `${forecast.days_of_stock_remaining} days` },
              { label: 'AI Confidence', value: `${forecast.confidence_score}%` },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#fff', border: '1px solid #e5e5e5',
                borderRadius: '8px', padding: '16px'
              }}>
                <p style={{ fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: '20px', fontWeight: '600',color: stat.label === 'AI Confidence' 
                  ? (forecast.confidence_score >= 70 ? '#2d7a2d' : forecast.confidence_score >= 40 ? '#b8860b' : '#d00')
                  : '#1a1a1a'
                }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* AI Recommendation */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>AI Recommendation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {forecast.recommendation.split('\n').filter(l => l.trim()).map((line, i) => {
                const [label, ...rest] = line.split(':');
                const value = rest.join(':').trim();
                if (!value) return null;
                const isUrgency = label.toLowerCase().includes('urgency');
                return (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', color: '#888',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      minWidth: '160px', paddingTop: '2px'
                    }}>
                      {label.trim()}
                    </span>
                    <span style={{
                      fontSize: '14px', lineHeight: '1.6',
                      color: isUrgency ? urgencyColor(value) : '#1a1a1a',
                      fontWeight: isUrgency ? '600' : '400'
                    }}>
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: '#aaa', marginTop: '16px' }}>
              Based on {forecast.retrieved_context_count} document chunk(s) retrieved via semantic search.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}