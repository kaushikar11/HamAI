import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { Check, X, Edit2, Save, Tag, Calendar } from 'lucide-react';
import './ReviewEntry.css';

const ReviewEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [entry, setEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [entryId, setEntryId] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  // Generate years from 2000 to 2100 (or current year if later)
  const years = [];
  const minYear = 2000;
  const maxYear = Math.max(2100, currentYear + 10); // Allow future years too
  for (let y = minYear; y <= maxYear; y++) {
    years.push(y);
  }


  useEffect(() => {
    // Check if we're editing an existing entry
    const editMode = searchParams.get('edit') === 'true';
    setIsEditMode(editMode);

    const pendingEntry = sessionStorage.getItem('pendingEntry');
    if (!pendingEntry) {
      toast.error('No entry to review');
      navigate('/dashboard');
      return;
    }

    const parsed = JSON.parse(pendingEntry);
    
    // Get month/year from URL or use from entry or current date
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : (parsed.month || new Date().getMonth() + 1);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : (parsed.year || new Date().getFullYear());
    
    // Ensure month/year is in the entry
    const entryWithMonth = {
      ...parsed,
      month,
      year
    };
    
    setEntry(entryWithMonth);
    setEditedEntry({ ...entryWithMonth });
    
    // If editing existing entry, store the ID
    if (parsed._id || parsed.id) {
      setEntryId(parsed._id || parsed.id);
    }
  }, [navigate, searchParams]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedEntry({ ...entry });
    setIsEditing(false);
  };

  const updateField = (field, value) => {
    setEditedEntry({ ...editedEntry, [field]: value });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...editedEntry.items];
    newItems[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setEditedEntry({ ...editedEntry, items: newItems });
  };

  const addItem = () => {
    setEditedEntry({
      ...editedEntry,
      items: [...editedEntry.items, { name: '', amount: 0 }]
    });
  };

  const removeItem = (index) => {
    if (editedEntry.items.length > 1) {
      const newItems = editedEntry.items.filter((_, i) => i !== index);
      const subtotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      setEditedEntry({
        ...editedEntry,
        items: newItems,
        subtotal,
        total: subtotal + (editedEntry.tax || 0)
      });
    }
  };

  const recalculateTotals = () => {
    const subtotal = editedEntry.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const total = subtotal + (editedEntry.tax || 0);
    setEditedEntry({ ...editedEntry, subtotal, total });
  };

  useEffect(() => {
    if (isEditing && editedEntry) {
      recalculateTotals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedEntry?.items, editedEntry?.tax]);

  const handleSave = async () => {
    const receiver = editedEntry.receiver || editedEntry.store;
    if (!receiver || !receiver.trim() || editedEntry.items.some(item => !item.name.trim())) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Get month/year from URL or use current
      const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : (editedEntry.month || new Date().getMonth() + 1);
      const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : (editedEntry.year || new Date().getFullYear());
      
      // Explicitly drop receiverType (not used anywhere)
      // eslint-disable-next-line no-unused-vars
      const { receiverType, ...entryToSave } = {
        ...editedEntry,
        month,
        year
      };
      
      if (isEditMode && entryId) {
        // Update existing entry
        await api.put(`/budget/${entryId}`, entryToSave);
        toast.success('Entry updated successfully!');
      } else {
        // Create new entry
        await api.post('/budget', entryToSave);
        toast.success('Entry saved successfully!');
      }
      sessionStorage.removeItem('pendingEntry');
      navigate(`/dashboard?month=${month}&year=${year}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  if (!entry) {
    return (
      <div className="review-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const categories = ['grocery', 'utility', 'restaurant', 'shopping', 'entertainment', 'transport', 'healthcare', 'education', 'other'];

  const getCategoryColor = (category) => {
    const colors = {
      grocery: '#4CAF50',
      utility: '#2196F3',
      restaurant: '#FF9800',
      shopping: '#9C27B0',
      entertainment: '#E91E63',
      transport: '#00BCD4',
      healthcare: '#F44336',
      education: '#3F51B5',
      other: '#757575'
    };
    return colors[category] || colors.other;
  };

  const displayEntry = isEditing ? editedEntry : entry;

  return (
    <div className="review-entry">
      <div className="review-container">
        <div className="review-header">
          <h1>Review Entry</h1>
          <p>Review and edit your budget entry before saving</p>
        </div>

        <div className="review-card">
          {!isEditing ? (
            <>
              <div className="review-actions">
                <button className="edit-button" onClick={handleEdit}>
                  <Edit2 size={18} /> Edit
                </button>
              </div>

              <div className="review-section">
                <label>Month & Year</label>
                <div className="review-value month-year-display">
                  <Calendar size={16} />
                  {displayEntry.month && displayEntry.year 
                    ? `${months[displayEntry.month - 1]} ${displayEntry.year}`
                    : 'Not set'
                  }
                </div>
              </div>

              <div className="review-section">
                <label>Receiver</label>
                <div className="review-value">
                  {displayEntry.receiver || displayEntry.store}
                </div>
              </div>

              <div className="review-section">
                <label>Items</label>
                <div className="items-list">
                  {displayEntry.items.map((item, index) => (
                    <div key={index} className="item-display">
                      <span className="item-name">{item.name}</span>
                      <span className="item-amount">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="review-section">
                <label>Category</label>
                <span
                  className="category-badge"
                  style={{ backgroundColor: getCategoryColor(displayEntry.category) }}
                >
                  <Tag size={14} /> {displayEntry.category}
                </span>
              </div>

              {displayEntry.notes && (
                <div className="review-section">
                  <label>Notes</label>
                  <div className="review-value notes">{displayEntry.notes}</div>
                </div>
              )}

              <div className="review-section">
                <label>Tax</label>
                <div className="review-value">${displayEntry.tax.toFixed(2)}</div>
              </div>

              <div className="totals-section">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>${displayEntry.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-line main">
                  <span>Total:</span>
                  <span>${displayEntry.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="review-footer">
                <button className="cancel-button" onClick={() => navigate('/add-entry')}>
                  <X size={18} /> Cancel
                </button>
                <button className="save-button" onClick={handleSave} disabled={saving}>
                  <Check size={18} /> {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="edit-section">
                <label>Month & Year</label>
                <div className="month-year-edit">
                  <select
                    value={displayEntry.month || currentMonth}
                    onChange={(e) => updateField('month', parseInt(e.target.value))}
                    className="edit-select"
                  >
                    {months.map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={displayEntry.year || currentYear}
                    onChange={(e) => updateField('year', parseInt(e.target.value))}
                    className="edit-select"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="edit-section">
                <label>Receiver Name</label>
                <input
                  type="text"
                  value={displayEntry.receiver || displayEntry.store || ''}
                  onChange={(e) => {
                    updateField('receiver', e.target.value);
                    updateField('store', e.target.value); // Keep for backward compatibility
                  }}
                  className="edit-input"
                  placeholder="Receiver name"
                />
              </div>

              <div className="edit-section">
                <label>Items</label>
                {displayEntry.items.map((item, index) => (
                  <div key={index} className="edit-item-row">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Item name"
                      className="edit-item-name"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateItem(index, 'amount', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="edit-item-amount"
                    />
                    {displayEntry.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="remove-item-btn"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addItem} className="add-item-btn">
                  + Add Item
                </button>
              </div>

              <div className="edit-section">
                <label>Category</label>
                <select
                  value={displayEntry.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="edit-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="edit-section">
                <label>Notes (optional)</label>
                <textarea
                  value={displayEntry.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Add any notes..."
                  className="edit-textarea"
                  rows={3}
                />
              </div>

              <div className="edit-section">
                <label>Tax</label>
                <input
                  type="number"
                  value={displayEntry.tax}
                  onChange={(e) => {
                    const tax = parseFloat(e.target.value) || 0;
                    updateField('tax', tax);
                  }}
                  step="0.01"
                  min="0"
                  className="edit-input"
                />
              </div>

              <div className="totals-section">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>${displayEntry.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-line main">
                  <span>Total:</span>
                  <span>${displayEntry.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="review-footer">
                <button className="cancel-button" onClick={handleCancel}>
                  <X size={18} /> Cancel Edit
                </button>
                <button className="save-button" onClick={handleSave} disabled={saving}>
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewEntry;
