// src/pages/admin/AdminOrders.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from './AdminItems';
import './AdminItems.css';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      alert('Error updating order: ' + error.message);
    } else {
      fetchOrders();
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const getStatusBadgeClass = (status) => {
    const map = {
      pending:   'status-badge status-badge--pending',
      confirmed: 'status-badge status-badge--confirmed',
      shipped:   'status-badge status-badge--shipped',
      delivered: 'status-badge status-badge--delivered',
    };
    return map[status] || 'status-badge';
  };

  const getStatusLabel = (status) => {
    const map = {
      pending: 'Pending', confirmed: 'Confirmed',
      shipped: 'Shipped', delivered: 'Delivered',
    };
    return map[status] || status;
  };

  return (
    <div className="admin-items">
      <NavBar activePage="orders" />

      <div className="admin-content">
        <div className="admin-content__header">
          <div className="admin-page-header">
            <h1 className="admin-page-title">Orders</h1>
            <p className="admin-page-sub">
              {loading ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''} total.`}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="admin-filters">
          {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {' '}({f === 'all' ? orders.length : orders.filter(o => o.status === f).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-loading">Loading orders…</div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-empty">No orders found.</div>
        ) : (
          <div className="orders-container">
            {filteredOrders.map(order => (
              <div key={order.id} className="order-card">

                <div className="order-card__header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="order-id">Order #{order.id}</span>
                    <span className={getStatusBadgeClass(order.status)}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="order-card__body">
                  <div className="order-item-info">
                    <h4>{order.item_name}</h4>
                    <p><strong>Price:</strong> {order.price?.toLocaleString()} DA</p>
                    <p>
                      <strong>Size:</strong> {order.size || 'N/A'}
                      {' · '}
                      <strong>Color:</strong> {order.color || 'N/A'}
                    </p>
                  </div>
                  <div className="order-customer-info">
                    <p><strong>Customer:</strong> {order.customer_name}</p>
                    <p><strong>Phone:</strong> {order.phone}</p>
                    <p><strong>Wilaya:</strong> {order.wilaya}</p>
                  </div>
                </div>

                <div className="order-card__footer">
                  <select
                    value={order.status}
                    onChange={e => updateOrderStatus(order.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
