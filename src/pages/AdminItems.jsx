import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './AdminItems.css';

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const toggleMenu = (id, e) => {
    if (openMenu === id) { setOpenMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right,
    });
    setOpenMenu(id);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenu]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('Error loading items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data: item } = await supabase
        .from('items')
        .select('image_url')
        .eq('id', id)
        .single();

      if (item?.image_url) {
        const fileName = item.image_url.split('/').pop();
        await supabase.storage.from('item-images').remove([fileName]);
      }

      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item: ' + error.message);
    }
    setShowDeleteConfirm(null);
  };

  return (
    <div className="admin-items">
      <NavBar activePage="items" itemCount={items.length} />

      <div className="admin-content">
        <div className="admin-content__header">
          <div className="admin-page-header">
            <h1 className="admin-page-title">All Items</h1>
            <p className="admin-page-sub">
              {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''} in your store.`}
            </p>
          </div>
          <a href="/items/new" className="admin-btn admin-btn--primary">
            + Add Item
          </a>
        </div>

        {loading ? (
          <div className="admin-loading">Loading items…</div>
        ) : items.length === 0 ? (
          <div className="admin-empty">
            <p>No items yet.</p>
            <a href="/items/new" className="admin-btn admin-btn--primary">Add your first item</a>
          </div>
        ) : (
          <div className="items-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th className="pthpth">Photo</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th className="col-created">Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="items-table__image">
                      <img src={item.image_url} alt={item.name} />
                    </td>
                    <td style={{ fontWeight: 500, color: '#111' }}>{item.name}</td>
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {item.price.toLocaleString()} DA
                    </td>
                    <td className="col-created" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {/* Desktop: inline buttons */}
                      <div className="items-table__actions items-table__actions--desktop">
                        <a
                          href={`/items/${item.id}`}
                          className="admin-btn admin-btn--small admin-btn--edit"
                        >
                          Modify
                        </a>
                        <button
                          onClick={() => setShowDeleteConfirm(item.id)}
                          className="admin-btn admin-btn--small admin-btn--delete"
                        >
                          Delete
                        </button>
                      </div>
                      {/* Mobile: three-dot menu */}
                      <div className="items-table__actions--mobile">
                        <button
                          className="dot-menu-btn"
                          onClick={e => { e.stopPropagation(); toggleMenu(item.id, e); }}
                          aria-label="Actions"
                        >
                          &#8942;
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="admin-modal__actions">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="admin-btn admin-btn--small admin-btn--secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="admin-btn admin-btn--small admin-btn--delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile dot-menu — rendered outside table so overflow doesn't clip it */}
      {openMenu && (
        <div
          className="dot-menu"
          style={{ top: menuPos.top, right: menuPos.right }}
          onClick={e => e.stopPropagation()}
        >
          <a href={`/items/${openMenu}`} className="dot-menu__item">
            Modify
          </a>
          <button
            onClick={() => { setShowDeleteConfirm(openMenu); setOpenMenu(null); }}
            className="dot-menu__item dot-menu__item--delete"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Shared NavBar ──────────────────────────────────────── */
export function NavBar({ activePage, itemCount }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // useAuth in App.jsx will detect the session change and render <AdminLogin />
  };

  return (
    <div className="admin-header">
      <nav className="admin-nav">

        <div className="admin-nav__left">
          <a href="/items" className="admin-nav__logo">
            <img src="./logo.png" alt="Divaio" />
          </a>
        </div>

        <div className="admin-nav__links">
          <a
            href="/items"
            className={`admin-nav__link${activePage === 'items' ? ' active' : ''}`}
          >
            All Items
           
          </a>
          <a
            href="/orders"
            className={`admin-nav__link${activePage === 'orders' ? ' active' : ''}`}
          >
            Orders
          </a>
        </div>

        <button onClick={handleSignOut} className="admin-nav__signout">
          Sign Out
        </button>

      </nav>
    </div>
  );
}