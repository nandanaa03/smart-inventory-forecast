import { useEffect, useState } from 'react';
import { getProducts, getDocuments, deleteDocument } from '../api/client';
import axios from 'axios';

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid #e5e5e5',
  borderRadius: '6px', fontSize: '14px', outline: 'none'
};

export default function Documents() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('text'); // 'text' or 'file'
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProducts().then(res => setProducts(res.data));
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      getDocuments(selectedProduct).then(res => setDocuments(res.data));
    }
  }, [selectedProduct]);

  const handleUpload = async () => {
    if (!selectedProduct) return alert('Select a product');
    setLoading(true);

    try {
      if (uploadMode === 'file') {
        if (!file) return alert('Select a file');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('product_id', selectedProduct);
        await axios.post('http://localhost:5000/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        if (!content) return alert('Enter some content');
        await axios.post('http://localhost:5000/documents/upload', {
          product_id: parseInt(selectedProduct), content
        });
      }
      setContent('');
      setFile(null);
      getDocuments(selectedProduct).then(res => setDocuments(res.data));
    } catch (e) {
      alert('Upload failed');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    await deleteDocument(id);
    getDocuments(selectedProduct).then(res => setDocuments(res.data));
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Documents</h2>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '13px' }}>
        Upload CSV datasets or PDF reports per product. These are used by the AI for smarter forecasting.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Upload Document</h3>

          {/* Product select */}
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
            style={{ ...inputStyle, marginBottom: '12px' }}>
            <option value="">Select product</option>
            <option value="0">Global Market Context (all products)</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {['file', 'text'].map(mode => (
              <button key={mode} onClick={() => setUploadMode(mode)} style={{
                padding: '6px 14px', borderRadius: '6px', border: '1px solid #e5e5e5',
                background: uploadMode === mode ? '#1a1a1a' : '#fff',
                color: uploadMode === mode ? '#fff' : '#666',
                fontSize: '13px', fontWeight: '500'
              }}>
                {mode === 'file' ? 'Upload File (CSV/PDF)' : 'Paste Text'}
              </button>
            ))}
          </div>

          {uploadMode === 'file' ? (
            <div style={{
              border: '1px dashed #e5e5e5', borderRadius: '6px',
              padding: '24px', textAlign: 'center', marginBottom: '12px', cursor: 'pointer'
            }} onClick={() => document.getElementById('file-input').click()}>
              <input id="file-input" type="file" accept=".csv,.pdf,.txt"
                style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
              <p style={{ color: '#888', fontSize: '13px' }}>
                {file ? file.name : 'Click to upload CSV, PDF, or TXT file'}
              </p>
            </div>
          ) : (
            <textarea placeholder="Paste supplier notes, market insights, demand trends..."
              value={content} onChange={e => setContent(e.target.value)}
              rows={6} style={{ ...inputStyle, resize: 'vertical', marginBottom: '12px' }} />
          )}

          <button onClick={handleUpload} disabled={loading} style={{
            padding: '8px 16px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: '6px', fontWeight: '500', fontSize: '13px'
          }}>
            {loading ? 'Uploading & embedding...' : 'Upload'}
          </button>
        </div>

        {/* Documents list */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Stored Documents</h3>
          {documents.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px' }}>
              {selectedProduct ? 'No documents uploaded yet.' : 'Select a product to view documents.'}
            </p>
          ) : (
            <div>
              {documents.map((d, i) => (
                <div key={d.id} style={{
                  padding: '12px 0',
                  borderBottom: i < documents.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '13px', color: '#444', lineHeight: '1.5', flex: 1, marginRight: '12px' }}>
                      {d.content}
                    </p>
                    <button onClick={() => handleDelete(d.id)} style={{
                      padding: '4px 10px', background: '#fff3f3', color: '#d00',
                      border: 'none', borderRadius: '4px', fontSize: '12px', flexShrink: 0
                    }}>
                      Delete
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>{d.created_at}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}