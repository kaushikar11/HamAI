import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
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
import { getCategoryColor as getCategoryColorUtil, initializeCategoryColorMap, ensureCategoryColors, colorPalette } from '../utils/categoryColors';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Month/Year state - default to current month (January 2026) or from URL
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const defaultMonth = currentMonth; // Current month
  const defaultYear = currentYear; // Current year
  
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
  const [activeTab, setActiveTab] = useState('table'); // 'table', 'analytics', or 'categories'
  const { logout, user } = useContext(AuthContext);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [detailsModal, setDetailsModal] = useState({ open: false, tx: null });
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [categoryColorMap, setCategoryColorMap] = useState(initializeCategoryColorMap);

  // Mr.Ham chatbot state
  const [mrHamOpen, setMrHamOpen] = useState(false);
  const [mrHamMessages, setMrHamMessages] = useState([
    {
      id: 'mrham-welcome',
      from: 'mrham',
      text:
        "Oink oink! I'm Mr. Ham, your little piggy budget buddy. I only look at the transactions you've saved here and turn them into simple insights. Try asking me things like: \"Which category is eating most of my money?\" or \"How much did I spend on groceries last month?\""
    }
  ]);
  const [mrHamInput, setMrHamInput] = useState('');
  const [mrHamLoading, setMrHamLoading] = useState(false);

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
    ensureCategoryColors(categories, setCategoryColorMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]); // Only depend on categories, not categoryColorMap

  // Also ensure categories from entries have colors assigned
  useEffect(() => {
    if (entries.length > 0) {
      const entryCategories = new Set();
      entries.forEach(entry => {
        if (entry.category) {
          entryCategories.add(entry.category.toLowerCase());
        }
      });
      if (entryCategories.size > 0) {
        ensureCategoryColors(Array.from(entryCategories), setCategoryColorMap);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

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
      const fetchedCategories = categoriesResponse.data.categories || [];
      const fetchedReceivers = receiversResponse.data.receivers || [];
      setCategories(fetchedCategories);
      setReceivers(fetchedReceivers);
      
      // Ensure all categories from entries also have colors
      const entryCategories = new Set();
      (statsResponse.data?.entries || []).forEach(entry => {
        if (entry.category) {
          entryCategories.add(entry.category.toLowerCase());
        }
      });
      
      // Merge entry categories with fetched categories
      const allCategories = Array.from(new Set([...fetchedCategories.map(c => c.toLowerCase()), ...Array.from(entryCategories)]));
      if (allCategories.length > 0) {
        // Pre-assign colors for all categories immediately
        setCategoryColorMap(prevMap => {
          const updatedMap = { ...prevMap };
          let mapUpdated = false;
          
          allCategories.forEach(cat => {
            if (!updatedMap[cat]) {
              // Get color from utility (but don't trigger state update in callback)
              const color = getCategoryColorUtil(cat, updatedMap, null); // Pass null to avoid nested state update
              updatedMap[cat] = color;
              mapUpdated = true;
            }
          });
          
          if (mapUpdated) {
            localStorage.setItem('categoryColorMap', JSON.stringify(updatedMap));
            return updatedMap;
          }
          return prevMap;
        });
      }
      
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
    
    // Allow going backward from current month (no restriction)
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    
    // No restriction on going backward - allow any month/year
    
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

  // Get category color (wrapper to pass state)
  const getCategoryColor = useCallback((category) => {
    if (!category) return '#64748b';
    const catLower = (category || 'other').toLowerCase();
    // Check if we have the color in the map
    if (categoryColorMap[catLower]) {
      return categoryColorMap[catLower];
    }
    // Otherwise get it from the utility (which will assign and save)
    const color = getCategoryColorUtil(category, categoryColorMap, setCategoryColorMap);
    // Ensure we always return a valid color
    return color || '#64748b'; // Fallback to slate if somehow undefined
  }, [categoryColorMap]);

  const displayName = (() => {
    const backendName = user?.name;
    if (backendName && backendName !== 'User') return backendName;
    const firebaseName = auth.currentUser?.displayName;
    if (firebaseName && firebaseName.trim()) return firebaseName;
    return user?.email || 'User';
  })();

  const handleMrHamSend = async (e) => {
    e?.preventDefault?.();
    const trimmed = mrHamInput.trim();
    if (!trimmed) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      from: 'user',
      text: trimmed
    };
    setMrHamMessages((prev) => [...prev, userMessage]);
    setMrHamInput('');
    setMrHamLoading(true);

    try {
      const response = await api.post('/budget/chat', { question: trimmed });
      const answerText =
        response.data?.answer ||
        "I'm sorry, I couldn't find an answer about your data. Please try rephrasing your question.";

      const hamMessage = {
        id: `mrham-${Date.now()}`,
        from: 'mrham',
        text: answerText
      };
      setMrHamMessages((prev) => [...prev, hamMessage]);
    } catch (error) {
      console.error('Mr.Ham chat error:', error);
      toast.error('Mr. Ham could not answer right now. Please try again in a moment.');
      const hamMessage = {
        id: `mrham-error-${Date.now()}`,
        from: 'mrham',
        text:
          "I'm having trouble reaching your data right now. Please check your connection or try again shortly."
      };
      setMrHamMessages((prev) => [...prev, hamMessage]);
    } finally {
      setMrHamLoading(false);
    }
  };

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
              <button
                className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveTab('categories')}
              >
                Categories
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
                          {filteredEntries.map((entry) => {
                            const cat = entry.category || 'other';
                            const catLower = cat.toLowerCase();
                            // Get color directly from map or assign one
                            let categoryColor = categoryColorMap[catLower];
                            if (!categoryColor) {
                              // Find next available color
                              const usedColors = new Set(Object.values(categoryColorMap));
                              for (const color of colorPalette) {
                                if (!usedColors.has(color)) {
                                  categoryColor = color;
                                  break;
                                }
                              }
                              if (!categoryColor) {
                                // Generate random color
                                const hue = Math.floor(Math.random() * 360);
                                const saturation = 60 + Math.floor(Math.random() * 30);
                                const lightness = 45 + Math.floor(Math.random() * 15);
                                categoryColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                              }
                              // Update map immediately
                              const newMap = { ...categoryColorMap, [catLower]: categoryColor };
                              setCategoryColorMap(newMap);
                              localStorage.setItem('categoryColorMap', JSON.stringify(newMap));
                            }
                            return (
                            <tr
                              key={entry._id || entry.id}
                              className="transaction-row"
                              onClick={() => openDetails(entry)}
                            >
                              <td>{entry.receiver || entry.store || 'Unknown'}</td>
                              <td>
                                <span
                                  className="category-badge"
                                  data-category={cat}
                                  style={{
                                    backgroundColor: categoryColor,
                                    background: categoryColor,
                                    color: 'white',
                                    border: 'none'
                                  }}
                                >
                                  <Tag size={14} /> {cat}
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
                          );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            ) : activeTab === 'analytics' ? (
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
              </div>
            ) : activeTab === 'categories' ? (
              <div className="categories-section">
                <div className="categories-content">
                  {/* Edit Categories Section */}
                  <div className="edit-section">
                    <h3>Edit Categories</h3>
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
                              <span 
                                className="category-color-indicator"
                                style={{ backgroundColor: getCategoryColor(cat) }}
                              />
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Edit Receiver Names Section */}
                  <div className="edit-section">
                    <h3>Edit Receiver Names</h3>
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
            ) : null}
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

      <footer className="app-footer">
        © {new Date().getFullYear()} Kaushik Alaguvadivel Ramya. All rights reserved.
      </footer>

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

      {/* Mr. Ham chatbot */}
      <button
        type="button"
        className="mrham-launcher"
        onClick={() => setMrHamOpen((prev) => !prev)}
        aria-label={mrHamOpen ? 'Close Mr. Ham chat' : 'Open Mr. Ham chat'}
      >
        <span className="mrham-avatar">
          <img
            src="/hamai-logo.png"
            alt="Mr. Ham"
            className="mrham-avatar-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </span>
        <span className="mrham-launcher-text">Mr. Ham</span>
      </button>

      {mrHamOpen && (
        <div className="mrham-chat">
          <div className="mrham-header">
            <div className="mrham-header-info">
              <span className="mrham-avatar large">
                <img
                  src="/hamai-logo.png"
                  alt="Mr. Ham"
                  className="mrham-avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </span>
              <div>
                <div className="mrham-name">Mr. Ham</div>
                <div className="mrham-subtitle">Your personal budget insights assistant</div>
              </div>
            </div>
            <button
              type="button"
              className="mrham-close"
              onClick={() => setMrHamOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="mrham-body">
            {mrHamMessages.map((msg) => (
              <div
                key={msg.id}
                className={`mrham-message ${
                  msg.from === 'mrham' ? 'mrham-message-assistant' : 'mrham-message-user'
                }`}
              >
                {msg.from === 'mrham' && <span className="mrham-message-label">Mr. Ham</span>}
                {msg.from === 'user' && <span className="mrham-message-label user">You</span>}
                <div className="mrham-message-text">
                  {msg.from === 'mrham' ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {mrHamLoading && (
              <div className="mrham-message mrham-message-assistant">
                <span className="mrham-message-label">Mr. Ham</span>
                <div className="mrham-message-text mrham-typing">
                  Thinking about your data...
                </div>
              </div>
            )}
          </div>
          <form className="mrham-input-bar" onSubmit={handleMrHamSend}>
            <input
              type="text"
              className="mrham-input"
              placeholder="Ask Mr. Ham about your spending..."
              value={mrHamInput}
              onChange={(e) => setMrHamInput(e.target.value)}
              disabled={mrHamLoading}
            />
            <button
              type="submit"
              className="mrham-send"
              disabled={mrHamLoading || !mrHamInput.trim()}
            >
              {mrHamLoading ? '...' : 'Ask'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
