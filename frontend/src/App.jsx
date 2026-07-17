import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Documents from './pages/Documents';
import Forecast from './pages/Forecast';
import Analytics from './pages/Analytics';
import './index.css';

function Sidebar() {
  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/products', label: 'Products' },
    { to: '/sales', label: 'Log Sale' },
    { to: '/documents', label: 'Documents' },
    { to: '/forecast', label: 'Forecast' },
    { to: '/analytics', label: 'Analytics' },
  ];

  return (
    <aside style={{
      width: '220px', minHeight: '100vh', background: '#fff',
      borderRight: '1px solid #e5e5e5', padding: '24px 0',
      position: 'fixed', top: 0, left: 0
    }}>
      <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #e5e5e5' }}>
        <h1 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
          Inventory IQ
        </h1>
        <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
          Smart Stock Management
        </p>
      </div>
      <nav style={{ padding: '16px 12px' }}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            style={({ isActive }) => ({
              display: 'block', padding: '8px 12px', borderRadius: '6px',
              marginBottom: '2px', color: isActive ? '#1a1a1a' : '#666',
              background: isActive ? '#f0f0f0' : 'transparent',
              fontWeight: isActive ? '500' : '400',
              fontSize: '14px'
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function Layout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}