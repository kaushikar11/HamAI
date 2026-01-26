import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { Plus, X, ArrowLeft, Calendar, Save } from 'lucide-react';
import './AddEntry.css';

const AddEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Month/Year state - default to current month/year or from URL params
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const defaultMonth = 8; // August
  const defaultYear = 2025; // Default year is 2025
  
  const [selectedMonth, setSelectedMonth] = useState(
    parseInt(searchParams.get('month')) || defaultMonth
  );
  const [selectedYear, setSelectedYear] = useState(
    parseInt(searchParams.get('year')) || defaultYear
  );
  
  const isEditMode = searchParams.get('edit') === 'true';
  const editEntryId = searchParams.get('id');
  
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  // Manual entry state - support multiple entries
  const [entries, setEntries] = useState([{
    receiver: '',
    items: [{ name: '', amount: '' }],
    tax: '',
    category: '',
    notes: ''
  }]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [receivers, setReceivers] = useState([]);
  const [newReceiver, setNewReceiver] = useState('');
  const [showNewReceiver, setShowNewReceiver] = useState(false);

  // Get available months/years
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  // Generate years from 2000 to 2100 (or current year if later)
  const years = [];
  const minYear = 2000;
  const maxYear = Math.max(2100, currentYear + 10); // Allow future years too
  for (let y = minYear; y <= maxYear; y++) {
    years.push(y);
  }

  // Load categories and receivers
  useEffect(() => {
    loadCategories();
    loadReceivers();
  }, []);

  // Prefill when editing a transaction
  useEffect(() => {
    const loadEditEntry = async () => {
      if (!isEditMode || !editEntryId) return;

      setEditLoading(true);
      try {
        const stored = sessionStorage.getItem('editEntry');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (String(parsed.id || parsed._id || parsed.entryId) === String(editEntryId)) {
            const month = parsed.month || selectedMonth;
            const year = parsed.year || selectedYear;
            setSelectedMonth(month);
            setSelectedYear(year);

            setEntries([{
              receiver: parsed.receiver || parsed.store || '',
              items: Array.isArray(parsed.items) && parsed.items.length
                ? parsed.items.map((i) => ({
                    name: i?.name || '',
                    amount: i?.amount !== undefined && i?.amount !== null ? String(i.amount) : ''
                  }))
                : [{ name: '', amount: '' }],
              tax: parsed.tax !== undefined && parsed.tax !== null ? String(parsed.tax) : '',
              category: parsed.category || '',
              notes: parsed.notes || ''
            }]);
            return;
          }
        }

        // Fallback: fetch from API if sessionStorage is missing/stale
        const response = await api.get(`/budget/${editEntryId}?month=${selectedMonth}&year=${selectedYear}`);
        const e = response.data;
        setSelectedMonth(e.month || selectedMonth);
        setSelectedYear(e.year || selectedYear);
        setEntries([{
          receiver: e.receiver || e.store || '',
          items: Array.isArray(e.items) && e.items.length
            ? e.items.map((i) => ({
                name: i?.name || '',
                amount: i?.amount !== undefined && i?.amount !== null ? String(i.amount) : ''
              }))
            : [{ name: '', amount: '' }],
          tax: e.tax !== undefined && e.tax !== null ? String(e.tax) : '',
          category: e.category || '',
          notes: e.notes || ''
        }]);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load transaction for editing');
      } finally {
        setEditLoading(false);
      }
    };

    loadEditEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editEntryId]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/budget/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadReceivers = async () => {
    try {
      const response = await api.get('/budget/receivers');
      setReceivers(response.data.receivers || []);
    } catch (error) {
      console.error('Failed to load receivers:', error);
    }
  };


  const handleAiParse = async () => {
    if (!aiText.trim()) {
      toast.error('Please enter some text to parse');
      return;
    }

    if (aiText.length > 2000) {
      toast.error('Text is too long. Please keep it under 2000 characters.');
      return;
    }

    setAiLoading(true);
    try {
      const response = await api.post('/budget/parse', { text: aiText });
      const data = response.data;

      // Auto-fill the right-side "Add transaction" form (no redirect)
      const receiver = data.receiver || data.store || '';
      const items = Array.isArray(data.items) && data.items.length
        ? data.items.map((i) => ({
            name: i?.name || '',
            amount: i?.amount !== undefined && i?.amount !== null ? String(i.amount) : ''
          }))
        : [{ name: '', amount: '' }];

      setEntries([{
        receiver,
        items,
        tax: data.tax !== undefined && data.tax !== null ? String(data.tax) : '',
        category: data.category || '',
        notes: data.notes || ''
      }]);

      // Keep the user on this page and clear the textarea for next use
      setAiText('');
      toast.success('Auto-filled. Review and save on the right.');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to parse text';
      toast.error(errorMessage);
      console.error('Parse error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/dashboard?month=${selectedMonth}&year=${selectedYear}`);
  };

  const addEntry = () => {
    setEntries([...entries, {
      receiver: '',
      items: [{ name: '', amount: '' }],
      tax: '',
      category: '',
      notes: ''
    }]);
  };

  const removeEntry = (index) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index, field, value) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const addItem = (entryIndex) => {
    const updated = [...entries];
    updated[entryIndex].items.push({ name: '', amount: '' });
    setEntries(updated);
  };

  const removeItem = (entryIndex, itemIndex) => {
    const updated = [...entries];
    if (updated[entryIndex].items.length > 1) {
      updated[entryIndex].items = updated[entryIndex].items.filter((_, i) => i !== itemIndex);
      setEntries(updated);
    }
  };

  const updateItem = (entryIndex, itemIndex, field, value) => {
    const updated = [...entries];
    updated[entryIndex].items[itemIndex][field] = value;
    setEntries(updated);
  };

  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const handleSaveAll = async () => {
    // If in edit mode, update the existing entry
    if (isEditMode && editEntryId) {
      const entry = entries[0];
      if (!entry.receiver) {
        toast.error('Please fill in receiver information');
        return;
      }
      if (!entry.category) {
        toast.error('Please select a category');
        return;
      }
      if (!entry.items || entry.items.length === 0 || !entry.items[0].name) {
        toast.error('Please add at least one item');
        return;
      }
      
      const subtotal = entry.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const tax = parseFloat(entry.tax) || 0;
      const total = subtotal + tax;
      
      try {
        await api.put(`/budget/${editEntryId}?month=${selectedMonth}&year=${selectedYear}`, {
          receiver: entry.receiver,
          items: entry.items.map(item => ({
            name: item.name,
            amount: parseFloat(item.amount) || 0
          })),
          subtotal,
          tax,
          total,
          category: entry.category,
          notes: entry.notes || '',
          month: selectedMonth,
          year: selectedYear
        });
        toast.success('Entry updated successfully');
        sessionStorage.removeItem('editEntry');
        navigate(`/dashboard?month=${selectedMonth}&year=${selectedYear}`);
        return;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update entry');
        return;
      }
    }
    
    // Otherwise, create new entries
    // Validate all entries
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      // Check receiver name
      if (!entry.receiver || entry.receiver.trim() === '') {
        toast.error(`Entry ${i + 1}: Please enter a receiver name`);
        return;
      }
      
      // Check category
      if (!entry.category || entry.category.trim() === '') {
        toast.error(`Entry ${i + 1}: Please select a category`);
        return;
      }
      
      // Check items
      const validItems = entry.items.filter(item => item.name && item.name.trim() && item.amount);
      if (validItems.length === 0) {
        toast.error(`Entry ${i + 1}: Please add at least one item with name and amount`);
        return;
      }
    }

    try {
      // Save all entries
      const promises = entries.map(entry => {
        const subtotal = calculateSubtotal(entry.items);
        const tax = parseFloat(entry.tax) || 0;
        const total = subtotal + tax;

        return api.post('/budget', {
          receiver: entry.receiver,
          items: entry.items.filter(item => item.name && item.amount).map(item => ({
            name: item.name,
            amount: parseFloat(item.amount) || 0
          })),
          subtotal,
          tax,
          total,
          category: entry.category,
          notes: entry.notes || '',
          month: selectedMonth,
          year: selectedYear
        });
      });

      await Promise.all(promises);
      toast.success(`Successfully saved ${entries.length} ${entries.length === 1 ? 'transaction' : 'transactions'}!`);
      navigate(`/dashboard?month=${selectedMonth}&year=${selectedYear}`);
    } catch (error) {
      toast.error('Failed to save transactions: ' + (error.response?.data?.message || error.message));
    }
  };

  const addNewCategory = async () => {
    if (!newCategory.trim()) return;
    
    const category = newCategory.trim();
    if (categories.includes(category)) {
      toast.error('Category already exists');
      return;
    }
    
    try {
      const response = await api.post('/budget/categories', { category });
      setCategories(response.data.categories || []);
      setNewCategory('');
      setShowNewCategory(false);
      
      // Auto-select the new category for current entry
      const updated = [...entries];
      updated[0].category = category;
      setEntries(updated);
      
      toast.success('Category added!');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const addNewReceiver = async () => {
    if (!newReceiver.trim()) return;
    
    const receiver = newReceiver.trim();
    if (receivers.includes(receiver)) {
      toast.error('Receiver already exists');
      return;
    }
    
    try {
      const response = await api.post('/budget/receivers', { receiver });
      setReceivers(response.data.receivers || []);
      setNewReceiver('');
      setShowNewReceiver(false);
      
      // Auto-select the new receiver for current entry
      const updated = [...entries];
      updated[0].receiver = receiver;
      setEntries(updated);
      
      toast.success('Receiver added!');
    } catch (error) {
      toast.error('Failed to add receiver');
    }
  };


  if (editLoading) {
    return (
      <div className="add-entry">
        <div className="add-entry-container">
          <div className="add-entry-loading">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-entry">
      <div className="add-entry-container">
        <div className="add-entry-topbar">
          <button className="back-link" onClick={handleBack} type="button">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="add-entry-title">
            <h1>{isEditMode ? 'Edit transaction' : 'Add transaction'}</h1>
          </div>
          <div className="topbar-spacer" />
        </div>

        {/* Month/Year Selector */}
        <div className="month-year-selector">
          <div className="selector-group">
            <Calendar className="selector-icon" />
            <label>Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="month-select"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="selector-group">
            <label>Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="year-select"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="entry-two-column">
          {/* Left: Auto-entry */}
          <div className="ai-entry-card">
            <h2>Auto-entry</h2>
            <p className="subtitle">Paste a receipt or transaction text to auto-fill</p>
            <div className="ai-textarea-container">
              <textarea
                className="ai-textarea"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="Paste your receipt text here...&#10;Example:&#10;Walmart&#10;Milk $3.50&#10;Bread $2.00&#10;Total: $5.50"
                rows={10}
              />
            </div>
            <button
              className="parse-button"
              onClick={handleAiParse}
              disabled={aiLoading || !aiText.trim()}
            >
              {aiLoading ? 'Parsing...' : 'Auto-fill'}
            </button>
          </div>

          {/* Right: Add / Edit transaction */}
          <div className="manual-entry-card">
            <div className="entries-header">
              <h2>{isEditMode ? 'Edit transaction' : 'Add transaction'}</h2>
              {!isEditMode && (
                <button className="add-entry-button" onClick={addEntry} type="button">
                  <Plus size={20} /> Add another transaction
                </button>
              )}
            </div>
            <p className="subtitle">For {months[selectedMonth - 1].label} {selectedYear}</p>

            {entries.map((entry, entryIndex) => (
              <div key={entryIndex} className="entry-form-group">
                <div className="entry-header">
                  <h3>Transaction {entryIndex + 1}</h3>
                  {!isEditMode && entries.length > 1 && (
                    <button
                      className="remove-entry-button"
                      onClick={() => removeEntry(entryIndex)}
                      type="button"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Receiver Name</label>
                  <div className="receiver-select-wrapper">
                    <select
                      value={entry.receiver}
                      onChange={(e) => updateEntry(entryIndex, 'receiver', e.target.value)}
                      className="receiver-select"
                      required
                    >
                      <option value="">Select receiver</option>
                      {receivers.map(rec => (
                        <option key={rec} value={rec}>{rec}</option>
                      ))}
                    </select>
                    {!showNewReceiver && (
                      <button
                        type="button"
                        className="new-receiver-button"
                        onClick={() => setShowNewReceiver(true)}
                      >
                        <Plus size={16} /> New
                      </button>
                    )}
                  </div>
                  {showNewReceiver && (
                    <div className="new-receiver-input">
                      <input
                        type="text"
                        value={newReceiver}
                        onChange={(e) => setNewReceiver(e.target.value)}
                        placeholder="Receiver name"
                        onKeyPress={(e) => e.key === 'Enter' && addNewReceiver()}
                        autoFocus
                      />
                      <button onClick={addNewReceiver}>Add</button>
                      <button onClick={() => { setShowNewReceiver(false); setNewReceiver(''); }}>Cancel</button>
                    </div>
                  )}
                </div>

                <div className="items-section">
                  <label>Items</label>
                  {entry.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="item-row">
                      <input
                        type="text"
                        className="item-name"
                        value={item.name}
                        onChange={(e) => updateItem(entryIndex, itemIndex, 'name', e.target.value)}
                        placeholder="Item name"
                      />
                      <input
                        type="number"
                        className="item-amount"
                        value={item.amount}
                        onChange={(e) => updateItem(entryIndex, itemIndex, 'amount', e.target.value)}
                        placeholder="Amount"
                        step="0.01"
                        min="0"
                      />
                      {entry.items.length > 1 && (
                        <button
                          className="remove-item-button"
                          onClick={() => removeItem(entryIndex, itemIndex)}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button className="add-item-button" onClick={() => addItem(entryIndex)}>
                    <Plus size={16} /> Add Item
                  </button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tax (optional)</label>
                    <input
                      type="number"
                      value={entry.tax}
                      onChange={(e) => updateEntry(entryIndex, 'tax', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <div className="category-select-wrapper">
                      <select
                        value={entry.category}
                        onChange={(e) => updateEntry(entryIndex, 'category', e.target.value)}
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {!showNewCategory && (
                        <button
                          type="button"
                          className="new-category-button"
                          onClick={() => setShowNewCategory(true)}
                        >
                          <Plus size={16} /> New
                        </button>
                      )}
                    </div>
                    {showNewCategory && (
                      <div className="new-category-input">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Category name"
                        onKeyPress={(e) => e.key === 'Enter' && addNewCategory()}
                      />
                        <button onClick={addNewCategory}>Add</button>
                        <button onClick={() => { setShowNewCategory(false); setNewCategory(''); }}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea
                    value={entry.notes}
                    onChange={(e) => updateEntry(entryIndex, 'notes', e.target.value)}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                <div className="entry-summary">
                  <p>Subtotal: ${calculateSubtotal(entry.items).toFixed(2)}</p>
                  <p>Tax: ${(parseFloat(entry.tax) || 0).toFixed(2)}</p>
                  <p className="total">Total: ${(calculateSubtotal(entry.items) + (parseFloat(entry.tax) || 0)).toFixed(2)}</p>
                </div>
              </div>
            ))}

            <div className="save-all-section">
              <button className="save-all-button" onClick={handleSaveAll}>
                <Save size={20} /> {isEditMode ? 'Save changes' : `Save (${entries.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEntry;
