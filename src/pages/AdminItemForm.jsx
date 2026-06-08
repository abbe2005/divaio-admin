import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NavBar } from './AdminItems';
import './AdminItems.css';

const CATEGORIES = ['Shirts', 'Pants', 'Shoes', 'Caps', 'Ensemble'];

export default function AdminItemForm({ id }) {
  const isEditing = !!id;

  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData]   = useState({
    name: '', category: '', price: '', description: '',
  });
  const [sizesInput, setSizesInput]   = useState('');
  const [colorsInput, setColorsInput] = useState('');

  const [existingImages, setExistingImages]     = useState([]);
  const [newImageFiles, setNewImageFiles]       = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  useEffect(() => {
    if (isEditing) fetchItem();
  }, [id]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (data) {
        setFormData({
          name:        data.name,
          category:    data.category,
          price:       data.price,
          description: data.description || '',
        });
        setSizesInput((data.sizes  || []).join(', '));
        setColorsInput((data.colors || []).join(', '));
        const imgs = data.images && data.images.length > 0
          ? data.images
          : data.image_url ? [data.image_url] : [];
        setExistingImages(imgs);
      }
    } catch (err) {
      console.error('Error fetching item:', err);
      alert('Error loading item: ' + err.message);
    }
    setLoading(false);
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('item-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setNewImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreviews(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeExisting = (index) => setExistingImages(prev => prev.filter((_, i) => i !== index));
  const removeNew = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    const totalImages = existingImages.length + newImageFiles.length;
    if (!isEditing && totalImages === 0) {
      alert('Please add at least one image');
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = await Promise.all(newImageFiles.map(uploadImage));
      const allImages  = [...existingImages, ...uploadedUrls];
      const primaryUrl = allImages[0] || null;

      const sizesArray  = sizesInput.trim()
        ? sizesInput.split(',').map(s => s.trim()).filter(Boolean) : null;
      const colorsArray = colorsInput.trim()
        ? colorsInput.split(',').map(c => c.trim()).filter(Boolean) : null;

      const itemData = {
        name:        formData.name,
        category:    formData.category,
        price:       parseInt(formData.price),
        description: formData.description || null,
        image_url:   primaryUrl,
        images:      allImages,
      };
      if (sizesArray)  itemData.sizes  = sizesArray;
      if (colorsArray) itemData.colors = colorsArray;

      let result;
      if (isEditing) {
        result = await supabase.from('items').update(itemData).eq('id', id);
      } else {
        result = await supabase.from('items').insert([itemData]);
      }

      if (result.error) throw result.error;
      window.location.href = '/items';
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Error saving item: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-items">
        <NavBar activePage="items" />
        <div className="admin-content">
          <div className="admin-loading">Loading item…</div>
        </div>
      </div>
    );
  }

  const totalCount = existingImages.length + newImageFiles.length;

  return (
    <div className="admin-items">
      <NavBar activePage="items" />
      

      <div className="admin-content admin-form-page">

        <div className="admin-content__header">
          <div className="admin-page-header">
            <h1 className="admin-page-title">{isEditing ? 'Edit Item' : 'Add New Item'}</h1>
            <p className="admin-page-sub">
              {isEditing ? 'Update the item details below.' : 'Fill in the details and upload an image.'}
            </p>
          </div>
          <a href="/items" className="admin-btn admin-btn--secondary">← Back to Items</a>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">

          {/* Item Name */}
          <div className="admin-form__group">
            <label>Item Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Silk Evening Gown"
              required
            />
          </div>

          {/* Category */}
          <div className="admin-form__group">
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              <option value="">Select category</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Price */}
          <div className="admin-form__group">
            <label>Price (DA) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 12500"
              required
            />
          </div>

          {/* Description */}
          <div className="admin-form__group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Optional description…"
            />
          </div>

          {/* Sizes */}
          <div className="admin-form__group">
            <label>Sizes</label>
            <input
              type="text"
              value={sizesInput}
              onChange={e => setSizesInput(e.target.value)}
              placeholder="e.g. XS, S, M, L, XL"
            />
          </div>

          {/* Colors */}
          <div className="admin-form__group">
            <label>Colors</label>
            <input
              type="text"
              value={colorsInput}
              onChange={e => setColorsInput(e.target.value)}
              placeholder="e.g. Black, White, Beige"
            />
          </div>

          {/* Images — full width */}
          <div className="admin-form__group admin-form__group--full">
            <label>
              Item Photos {!isEditing && '*'}
              <span style={{ fontWeight: 300, marginLeft: '0.5rem', fontSize: '0.9em', color: '#aaa', textTransform: 'none', letterSpacing: 0 }}>
                ({totalCount} image{totalCount !== 1 ? 's' : ''} — first is the cover)
              </span>
            </label>

            {totalCount > 0 && (
              <div className="admin-form__image-grid">
                {existingImages.map((url, i) => (
                  <div key={`existing-${i}`} className="admin-form__image-thumb">
                    {i === 0 && <span className="admin-form__image-badge">Cover</span>}
                    <img src={url} alt={`Image ${i + 1}`} />
                    <button
                      type="button"
                      className="admin-form__image-remove"
                      onClick={() => removeExisting(i)}
                      aria-label="Remove"
                    >✕</button>
                  </div>
                ))}
                {newImagePreviews.map((src, i) => (
                  <div key={`new-${i}`} className="admin-form__image-thumb admin-form__image-thumb--new">
                    {existingImages.length === 0 && i === 0 && (
                      <span className="admin-form__image-badge">Cover</span>
                    )}
                    <span className="admin-form__image-pending">Pending</span>
                    <img src={src} alt={`New ${i + 1}`} />
                    <button
                      type="button"
                      className="admin-form__image-remove"
                      onClick={() => removeNew(i)}
                      aria-label="Remove"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            <label className="admin-form__upload-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Add Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                style={{ display: 'none' }}
              />
            </label>
            <p className="admin-form__hint">
              You can add multiple images. First image is used as the cover.
            </p>
          </div>

          {/* Actions */}
          <div className="admin-form__actions">
            <button
              type="submit"
              disabled={uploading}
              className="admin-btn admin-btn--primary"
            >
              {uploading
                ? 'Saving…'
                : isEditing ? 'Save Changes' : 'Add Item'
              }
            </button>
            <a href="/items" className="admin-btn admin-btn--secondary">Cancel</a>
          </div>

        </form>
      </div>
    </div>
  );
}
