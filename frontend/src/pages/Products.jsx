import { useEffect, useState } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../api/client';

const emptyForm = { name: '', category: '', current_stock: '', price: '' };

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid #e5e5e5',
  borderRadius: '6px', fontSize: '14px', outline: 'none'
};

const btnStyle = (variant) => ({
  padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '500',
  background: variant === 'primary' ? '#1a1a1a' : variant === 'danger' ? '#fff3f3' : '#f5f5f5',
  color: variant === 'primary' ? '#fff' : variant === 'danger' ? '#d00' : '#1a1a1a',
  fontSize: '13px'
});

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => getProducts().then(data => setProducts(data || []));
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name) return alert('Product name is required');
    setLoading(true);
    if (editing) {
      await updateProduct(editing, form);
      setEditing(null);
    } else {
      await addProduct(form);
    }
    setForm(emptyForm);
    await load();
    setLoading(false);
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, category: p.category, current_stock: p.current_stock, price: p.price });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await deleteProduct(id);
    await load();
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Products</h2>

      {/* Form */}
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
          {editing ? 'Edit Product' : 'Add Product'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { key: 'name', placeholder: 'Product name' },
            { key: 'category', placeholder: 'Category' },
            { key: 'current_stock', placeholder: 'Stock quantity', type: 'number' },
            { key: 'price', placeholder: 'Price', type: 'number' },
          ].map(field => (
            <input
              key={field.key}
              type={field.type || 'text'}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={e => setForm({ ...form, [field.key]: e.target.value })}
              style={inputStyle}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSubmit} style={btnStyle('primary')} disabled={loading}>
            {loading ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(emptyForm); }} style={btnStyle('secondary')}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>
              {['Product', 'Category', 'Stock', 'Price', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', color: '#888', fontWeight: '500' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{p.name}</td>
                <td style={{ padding: '12px 16px', color: '#666' }}>{p.category}</td>
                <td style={{ padding: '12px 16px' }}>{p.current_stock}</td>
                <td style={{ padding: '12px 16px', color: '#666' }}>₹{p.price}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(p)} style={btnStyle('secondary')}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={btnStyle('danger')}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}