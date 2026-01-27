import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import { 
  Plus, LogOut, DollarSign, Calendar, Tag, Trash2, Edit2, 
  ChevronLeft, ChevronRight, Filter, PieChart,
  Search, TrendingUp
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import {
  PieChart as RechartsPieChart, Pie, Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

// Predefined palette of distinct colors (excluding pink as requested)
const colorPalette = [
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#0ea5e9', // Sky Blue
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#6366f1', // Indigo
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#64748b', // Slate
  '#14b8a6', // Turquoise
  '#f43f5e', // Rose
  '#0d9488', // Teal Dark
  '#7c3aed', // Purple Dark
  '#dc2626', // Red Dark
  '#059669', // Emerald Dark
  '#0284c7', // Sky Blue Dark
  '#c026d3', // Fuchsia
  '#ea580c', // Orange Dark
  '#65a30d', // Lime Dark
  '#0891b2', // Cyan Dark
  '#9333ea', // Purple Dark
  '#be123c'  // Rose Dark
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Month/Year state - default to August 2025 or from URL
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
  
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [editingItem, setEditingItem] = useState(null); // { type: 'category'|'receiver', oldValue: string, newValue: string }
  const [activeTab, setActiveTab] = useState('table'); // 'table' or 'analytics'
  const { logout, user } = useContext(AuthContext);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [detailsModal, setDetailsModal] = useState({ open: false, tx: null });
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [categoryColorMap, setCategoryColorMap] = useState(() => {
    // Load color mapping from localStorage or initialize with defaults
    const stored = localStorage.getItem('categoryColorMap');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse categoryColorMap from localStorage', e);
      }
    }
    // Default 3 categories with 3 default colors
    return {
      grocery: '#22c55e',      // Green
      utilities: '#3b82f6',     // Blue
      rent: '#f97316'           // Orange
    };
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years from 2000 to 2100 (or current year if later)
  const years = [];
  const minYear = 2000;
  const maxYear = Math.max(2100, currentYear + 10); // Allow future years too
  for (let y = minYear; y <= maxYear; y++) {
    years.push(y);
  }

  // Ensure all categories have colors assigned (runs when categories change)
  useEffect(() => {
    if (categories.length === 0) return;
    
    setCategoryColorMap(prevMap => {
      const updatedMap = { ...prevMap };
      let mapUpdated = false;
      
      categories.forEach(cat => {
        const catLower = cat.toLowerCase();
        if (!updatedMap[catLower]) {
          // Find next available color
          const usedColors = new Set(Object.values(updatedMap));
          for (const color of colorPalette) {
            if (!usedColors.has(color)) {
              updatedMap[catLower] = color;
              mapUpdated = true;
              break;
            }
          }
          // If all palette colors used, generate random color
          if (!updatedMap[catLower]) {
            const hue = Math.floor(Math.random() * 360);
            const saturation = 60 + Math.floor(Math.random() * 30);
            const lightness = 45 + Math.floor(Math.random() * 15);
            updatedMap[catLower] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            mapUpdated = true;
          }
        }
      });
      
      if (mapUpdated) {
        localStorage.setItem('categoryColorMap', JSON.stringify(updatedMap));
        return updatedMap;
      }
      
      return prevMap;
    });
  }, [categories]); // Only depend on categories, not categoryColorMap

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch stats and entries for the month
      const [statsResponse, categoriesResponse, receiversResponse] = await Promise.all([
        api.get(`/budget/stats/summary?month=${selectedMonth}&year=${selectedYear}`),
        api.get('/budget/categories'),
        api.get('/budget/receivers')
      ]);

      console.log('Stats response:', statsResponse.data);
      console.log('Entries count:', statsResponse.data?.entries?.length || 0);

      setStats(statsResponse.data);
      setCategories(categoriesResponse.data.categories || []);
      setReceivers(receiversResponse.data.receivers || []);
      
      // Filter entries by category if needed
      let filteredEntries = statsResponse.data.entries || [];
      console.log('Filtered entries before category filter:', filteredEntries.length);
      
      if (categoryFilter && categoryFilter !== 'all') {
        filteredEntries = filteredEntries.filter(e => e.category === categoryFilter);
      }
      
      console.log('Final entries to display:', filteredEntries.length);
      setEntries(filteredEntries);
    } catch (error) {
      console.error('Failed to load data:', error);
      setStats(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budget/${id}?month=${selectedMonth}&year=${selectedYear}`);
      toast.success('Transaction deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const requestDelete = (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
    await handleDelete(id);
  };

  const openDetails = (tx) => {
    setDetailsModal({ open: true, tx });
  };

  const closeDetails = () => {
    setDetailsModal({ open: false, tx: null });
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    
    // Allow any year, just update
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setSearchParams({ month: newMonth, year: newYear });
  };

  // Prepare chart data
  const categoryChartData = useMemo(() => {
    if (!stats?.categoryTotals) return [];
    return Object.entries(stats.categoryTotals).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      originalName: name.toLowerCase(), // Keep original for filtering
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [stats]);

  // Initialize selected categories when chart data changes (all selected by default)
  useEffect(() => {
    if (categoryChartData.length > 0) {
      const allCategoryNames = categoryChartData.map(cat => cat.originalName);
      // Always initialize all categories when data changes (new month/year)
      setSelectedCategories(new Set(allCategoryNames));
    } else {
      setSelectedCategories(new Set());
    }
  }, [categoryChartData]);

  // Filter chart data based on selected categories
  const filteredChartData = useMemo(() => {
    if (selectedCategories.size === 0) return categoryChartData;
    return categoryChartData.filter(cat => selectedCategories.has(cat.originalName));
  }, [categoryChartData, selectedCategories]);

  const toggleCategory = (categoryName) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryName)) {
      newSelected.delete(categoryName);
    } else {
      newSelected.add(categoryName);
    }
    setSelectedCategories(newSelected);
  };

  // Get or assign a unique color for a category
  const getCategoryColor = (category) => {
    const c = (category || 'other').toLowerCase();
    
    // If category already has a color, return it
    if (categoryColorMap[c]) {
      return categoryColorMap[c];
    }
    
    // Find the next available color that's not already used
    const usedColors = new Set(Object.values(categoryColorMap));
    let newColor = null;
    
    for (const color of colorPalette) {
      if (!usedColors.has(color)) {
        newColor = color;
        break;
      }
    }
    
    // If all colors are used, generate a random color
    if (!newColor) {
      // Generate a random color (avoid too light/dark colors)
      const hue = Math.floor(Math.random() * 360);
      const saturation = 60 + Math.floor(Math.random() * 30); // 60-90%
      const lightness = 45 + Math.floor(Math.random() * 15); // 45-60%
      newColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    // Assign the new color to this category and save to localStorage
    const newMap = { ...categoryColorMap, [c]: newColor };
    setCategoryColorMap(newMap);
    localStorage.setItem('categoryColorMap', JSON.stringify(newMap));
    
    return newColor;
  };

  const displayName = (() => {
    const backendName = user?.name;
    if (backendName && backendName !== 'User') return backendName;
    const firebaseName = auth.currentUser?.displayName;
    if (firebaseName && firebaseName.trim()) return firebaseName;
    return user?.email || 'User';
  })();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <a href="https://hamai.vercel.app" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
              <img 
                src="/hamai-logo.png" 
                alt="HamAI Logo" 
                className="nav-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <h1 className="nav-title">HamAI</h1>
            </a>
          </div>
          <div className="nav-actions">
            <div className="nav-user">
              Logged in as <strong>{displayName}</strong>
            </div>
            <ThemeToggle />
            <button className="nav-button secondary" onClick={() => setShowLogoutConfirm(true)}>
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Month/Year Navigation */}
        <div className="month-navigation">
          <button 
            className="month-nav-button"
            onClick={() => changeMonth(-1)}
            disabled={selectedYear === 2026 && selectedMonth === 1}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="month-display">
            <h2>{months[selectedMonth - 1]} {selectedYear}</h2>
            <p className="month-subtitle">Viewing transactions for this month</p>
          </div>
          <button 
            className="month-nav-button"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight size={20} />
          </button>
          <div className="month-jump-container">
            <select
              className="month-jump-select"
              value={`${selectedMonth}-${selectedYear}`}
              onChange={(e) => {
                const [month, year] = e.target.value.split('-').map(Number);
                setSelectedMonth(month);
                setSelectedYear(year);
                setSearchParams({ month, year });
              }}
            >
              {years.map(y => 
                months.map((m, idx) => (
                  <option key={`${idx + 1}-${y}`} value={`${idx + 1}-${y}`}>
                    {m} {y}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {!stats ? (
          <div className="empty-state">
            <p>No data for {months[selectedMonth - 1]} {selectedYear}</p>
            <button className="primary-button" onClick={() => navigate(`/add-entry?month=${selectedMonth}&year=${selectedYear}`)}>
              <Plus size={20} /> Add transaction for this month
            </button>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="stats-grid">
        <div className="stats-card">
          <div className="stat-item">
            <DollarSign size={32} />
                  <div className="stat-content">
              <p className="stat-label">Total Spent</p>
                    <p className="stat-value">${stats.totalSpent?.toFixed(2) || '0.00'}</p>
                  </div>
            </div>
          </div>
              <div className="stats-card">
          <div className="stat-item">
            <Calendar size={32} />
                  <div className="stat-content">
              <p className="stat-label">Total transactions</p>
                    <p className="stat-value">{stats.totalEntries || 0}</p>
                  </div>
                </div>
              </div>
              <div className="stats-card">
                <div className="stat-item">
                  <Tag size={32} />
                  <div className="stat-content">
                    <p className="stat-label">Categories</p>
                    <p className="stat-value">{stats.categories?.length || 0}</p>
                  </div>
                </div>
              </div>
              <div className="stats-card">
                <div className="stat-item">
                  <TrendingUp size={32} />
                  <div className="stat-content">
                    <p className="stat-label">Avg per Transaction</p>
                    <p className="stat-value">
                      ${stats.totalEntries > 0 ? (stats.totalSpent / stats.totalEntries).toFixed(2) : '0.00'}
                    </p>
                  </div>
            </div>
          </div>
        </div>

            {/* Tabs */}
            <div className="dashboard-tabs">
              <button
                className={`tab-button ${activeTab === 'table' ? 'active' : ''}`}
                onClick={() => setActiveTab('table')}
              >
                Table
              </button>
              <button
                className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics and Insights
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'table' ? (
              <div className="table-section">
                <div className="table-header">
                  <div className="table-title-row">
                    <h2>Transactions</h2>
                    <button
                      className="table-add-button"
                      onClick={() => navigate(`/add-entry?month=${selectedMonth}&year=${selectedYear}`)}
                      type="button"
                    >
                      <Plus size={18} /> Add transaction
                    </button>
                    <div className="search-container">
                      <Search size={18} className="search-icon" />
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="filter-controls">
                    <Filter size={18} />
                    <select
                      className="filter-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Entries Table */}
                {(() => {
                  // Filter entries by category
                  let filteredEntries = categoryFilter === 'all' 
                    ? entries 
                    : entries.filter(e => e.category === categoryFilter);
                  
                  // Filter by search query (searches all metadata)
                  if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase().trim();
                    filteredEntries = filteredEntries.filter(entry => {
                      // Search in receiver/store
                      const receiverMatch = (entry.receiver || entry.store || '').toLowerCase().includes(query);
                      // Search in category
                      const categoryMatch = (entry.category || '').toLowerCase().includes(query);
                      // Search in items
                      const itemsMatch = (entry.items || []).some(item => 
                        (item.name || '').toLowerCase().includes(query) ||
                        String(item.amount || '').includes(query)
                      );
                      // Search in notes
                      const notesMatch = (entry.notes || '').toLowerCase().includes(query);
                      // Search in amounts
                      const amountMatch = 
                        String(entry.subtotal || '').includes(query) ||
                        String(entry.tax || '').includes(query) ||
                        String(entry.total || '').includes(query);
                      
                      return receiverMatch || categoryMatch || itemsMatch || notesMatch || amountMatch;
                    });
                  }
                  
                  if (filteredEntries.length === 0) {
                    return (
                      <div className="empty-table-state">
                        <p>
                          {categoryFilter === 'all' 
                            ? `No transactions found for ${months[selectedMonth - 1]} ${selectedYear}`
                            : `No transactions found in category "${categoryFilter}" for ${months[selectedMonth - 1]} ${selectedYear}`
                          }
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="entries-table-container">
                      <table className="entries-table">
                        <thead>
                          <tr>
                          <th>Receiver</th>
                          <th>Category</th>
                            <th>Items</th>
                            <th>Subtotal</th>
                            <th>Tax</th>
                            <th>Total</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEntries.map((entry) => (
                          <tr
                            key={entry._id || entry.id}
                            className="transaction-row"
                            onClick={() => openDetails(entry)}
                          >
                            <td>{entry.receiver || entry.store || 'Unknown'}</td>
                            <td>
                              <span
                                className="category-badge"
                                style={{ backgroundColor: getCategoryColor(entry.category), color: 'white' }}
                              >
                                <Tag size={14} /> {entry.category || 'other'}
                              </span>
                            </td>
                            <td>
                              <div className="items-list">
                                {entry.items?.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="item-tag">
                                    {item.name} (${item.amount?.toFixed(2)})
                                  </div>
                                ))}
                                {entry.items?.length > 2 && (
                                  <div className="item-tag">+{entry.items.length - 2} more</div>
                                )}
                              </div>
                            </td>
                            <td>${entry.subtotal?.toFixed(2) || '0.00'}</td>
                            <td>${entry.tax?.toFixed(2) || '0.00'}</td>
                            <td className="total-cell">${entry.total?.toFixed(2) || '0.00'}</td>
                            <td>
                              <div className="table-actions">
                                <button
                                  className="table-edit-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Store entry data and navigate to add-entry page
                                    sessionStorage.setItem('editEntry', JSON.stringify({
                                      ...entry,
                                      id: entry._id || entry.id,
                                      month: entry.month || selectedMonth,
                                      year: entry.year || selectedYear
                                    }));
                                    navigate(`/add-entry?edit=true&id=${entry._id || entry.id}&month=${selectedMonth}&year=${selectedYear}`);
                                  }}
                                  title="Edit transaction"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  className="table-delete-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestDelete(entry._id || entry.id);
                                  }}
                                  title="Delete transaction"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="analytics-section">
                {/* Category Pie Chart with Filter */}
                {categoryChartData.length > 0 && (
                  <div className="chart-card-large">
                    <div className="chart-header">
                      <PieChart size={24} />
                      <h3>Spending by Category</h3>
                    </div>
                    <div className="chart-content-wrapper">
                      <div className="chart-checkboxes">
                        {categoryChartData.map((cat) => (
                          <label key={cat.originalName} className="category-checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedCategories.has(cat.originalName)}
                              onChange={() => toggleCategory(cat.originalName)}
                              className="category-checkbox"
                            />
                            <span 
                              className="category-checkbox-name"
                              style={{ 
                                color: getCategoryColor(cat.name),
                                fontWeight: selectedCategories.has(cat.originalName) ? 600 : 400
                              }}
                            >
                              {cat.name} (${cat.value.toFixed(2)})
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="chart-container">
                        {filteredChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <RechartsPieChart>
                              <Pie
                                data={filteredChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={140}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {filteredChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="chart-empty-state">
                            <p>Select at least one category to display the chart</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                  {/* Inline Editable Lists - Only in Analytics tab */}
                  <div className="editable-lists-section">
                    <div className="editable-list-group">
                      <h3>Categories</h3>
                      <div className="editable-list">
                        {categories.map(cat => (
                          <div key={cat} className="editable-list-item">
                            {editingItem?.type === 'category' && editingItem.oldValue === cat ? (
                              <input
                                type="text"
                                value={editingItem.newValue}
                                onChange={(e) => setEditingItem({ ...editingItem, newValue: e.target.value })}
                                onBlur={async () => {
                                  if (editingItem.newValue && editingItem.newValue !== editingItem.oldValue) {
                                    try {
                                      const entriesToUpdate = entries.filter(e => e.category === editingItem.oldValue);
                                      await Promise.all(entriesToUpdate.map(e => 
                                        api.put(`/budget/${e._id || e.id}`, { category: editingItem.newValue })
                                      ));
                                      setCategories(categories.map(c => c === editingItem.oldValue ? editingItem.newValue : c));
                                      toast.success('Category updated');
                                    } catch (error) {
                                      toast.error('Failed to update category');
                                    }
                                  }
                                  setEditingItem(null);
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.target.blur();
                                  }
                                }}
                                autoFocus
                                className="inline-edit-input"
                              />
                            ) : (
                              <span 
                                className="editable-text"
                                onClick={() => setEditingItem({ type: 'category', oldValue: cat, newValue: cat })}
                              >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                        </div>

                    <div className="editable-list-group">
                      <h3>Receivers</h3>
                      <div className="editable-list">
                        {receivers.map(rec => (
                          <div key={rec} className="editable-list-item">
                            {editingItem?.type === 'receiver' && editingItem.oldValue === rec ? (
                              <input
                                type="text"
                                value={editingItem.newValue}
                                onChange={(e) => setEditingItem({ ...editingItem, newValue: e.target.value })}
                                onBlur={async () => {
                                  if (editingItem.newValue && editingItem.newValue !== editingItem.oldValue) {
                                    try {
                                      const entriesToUpdate = entries.filter(e => (e.receiver || e.store) === editingItem.oldValue);
                                      await Promise.all(entriesToUpdate.map(e => 
                                        api.put(`/budget/${e._id || e.id}`, { receiver: editingItem.newValue, store: editingItem.newValue })
                                      ));
                                      setReceivers(receivers.map(r => r === editingItem.oldValue ? editingItem.newValue : r));
                                      toast.success('Receiver updated');
                                      fetchData();
                                    } catch (error) {
                                      toast.error('Failed to update receiver');
                                    }
                                  }
                                  setEditingItem(null);
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.target.blur();
                                  }
                                }}
                                autoFocus
                                className="inline-edit-input"
                              />
                            ) : (
                              <span 
                                className="editable-text"
                                onClick={() => setEditingItem({ type: 'receiver', oldValue: rec, newValue: rec })}
                              >
                                {rec}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
            )}
          </>
        )}
      </div>

      {/* Confirm dialogs */}
      {showLogoutConfirm && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal">
            <h3>Log out?</h3>
            <p>You’ll need to log in again to access your dashboard.</p>
            <div className="confirm-actions">
              <button className="confirm-secondary" onClick={() => setShowLogoutConfirm(false)} type="button">
                Cancel
              </button>
              <button className="confirm-danger" onClick={confirmLogout} type="button">
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal">
            <h3>Delete this transaction?</h3>
            <p>This action can’t be undone.</p>
            <div className="confirm-actions">
              <button className="confirm-secondary" onClick={() => setDeleteConfirm({ open: false, id: null })} type="button">
                Cancel
              </button>
              <button className="confirm-danger" onClick={confirmDelete} type="button">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsModal.open && detailsModal.tx && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" onClick={closeDetails}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-header">
              <h3>Transaction details</h3>
              <button className="details-close" onClick={closeDetails} type="button">×</button>
            </div>
            <div className="details-body">
              <div className="details-row">
                <span className="details-label">Receiver</span>
                <span className="details-value">{detailsModal.tx.receiver || detailsModal.tx.store || 'Unknown'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Category</span>
                <span className="details-value">
                  <span
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(detailsModal.tx.category), color: 'white' }}
                  >
                    <Tag size={14} /> {detailsModal.tx.category || 'other'}
                  </span>
                </span>
              </div>
              <div className="details-items">
                <div className="details-label">Items</div>
                <div className="details-items-list">
                  {(detailsModal.tx.items || []).map((it, idx) => (
                    <div key={idx} className="details-item">
                      <span>{it.name}</span>
                      <span>${Number(it.amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {detailsModal.tx.notes ? (
                <div className="details-row">
                  <span className="details-label">Notes</span>
                  <span className="details-value">{detailsModal.tx.notes}</span>
                </div>
              ) : null}
              <div className="details-totals">
                <div className="details-item">
                  <span>Subtotal</span>
                  <span>${Number(detailsModal.tx.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="details-item">
                  <span>Tax</span>
                  <span>${Number(detailsModal.tx.tax || 0).toFixed(2)}</span>
                </div>
                <div className="details-item details-total">
                  <span>Total</span>
                  <span>${Number(detailsModal.tx.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
