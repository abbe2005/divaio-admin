// admin/src/App.jsx
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import AdminItems    from './pages/AdminItems';
import AdminItemForm from './pages/AdminItemForm';
import AdminOrders   from './pages/AdminOrders';
import AdminLogin    from './pages/AdminLogin';

export default function App() {
  const [page, setPage] = useState(window.location.pathname);
  const { session, loading } = useAuth();

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => setPage(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Intercept all <a href="..."> clicks for client-side routing
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//') && !href.startsWith('#')) {
        e.preventDefault();
        window.history.pushState({}, '', href);
        setPage(href);
        window.scrollTo(0, 0);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // While Supabase is checking the stored session, show nothing (avoids flash)
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#c9a96e',
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '1.2rem',
        letterSpacing: '0.1em',
      }}>
        Loading…
      </div>
    );
  }

  // Not authenticated → always show login
  if (!session) {
    return <AdminLogin />;
  }

  // ── Authenticated routing ──
  if (page === '/') return <AdminItems />;
  if (page === '/items') return <AdminItems />;

  if (page === '/items/new')             return <AdminItemForm />;

  if (page.startsWith('/items/')) {
    const id = page.split('/')[2];
    if (id && id !== 'new') return <AdminItemForm id={id} />;
  }

  if (page === '/orders') return <AdminOrders />;

  return <AdminItems />;
}