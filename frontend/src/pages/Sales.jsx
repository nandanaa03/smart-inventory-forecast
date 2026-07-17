import { useEffect, useState } from 'react';
import { getProducts, addSale, getSalesForProduct } from '../api/client';

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid #e5e5e5',
  borderRadius: '6px', fontSize: '14px', outline: 'none'
};

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProducts().then(data => setProducts(data || []));
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      getSalesForProduct(selectedProduct).then(data => setSales(data || []));
    }
  }, [selectedProduct]);

  const handleSubmit = async () => {
    if (!selectedProduct || !quantity) return alert('Select a product and enter quantity');
    setLoading(true);
    await addSale({ product_id: parseInt(selectedProduct), quantity_sold: parseInt(quantity), sale_date: date || undefined });
    setQuantity('');
    setDate('');
    getSalesForProduct(selectedProduct).then(data => setSales(data || []));
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Log Sale</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Form */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>New Sale Entry</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={inputStyle}>
              <option value="">Select product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" placeholder="Quantity sold" value={quantity}
              onChange={e => setQuantity(e.target.value)} style={inputStyle} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
          <button onClick={handleSubmit} disabled={loading} style={{
            padding: '8px 16px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: '6px', fontWeight: '500', fontSize: '13px'
          }}>
            {loading ? 'Saving...' : 'Log Sale'}
          </button>
        </div>

        {/* Sales history */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Sales History</h3>
          {sales.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px' }}>
              {selectedProduct ? 'No sales recorded yet.' : 'Select a product to view history.'}
            </p>
          ) : (
            <div>
              {sales.map((s, i) => (
                <div key={s.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: i < sales.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <span style={{ color: '#666', fontSize: '13px' }}>{s.sale_date}</span>
                  <span style={{ fontWeight: '500' }}>{s.quantity_sold} units</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}