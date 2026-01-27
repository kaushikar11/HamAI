# HamAI Frontend

A modern, production-ready React application for personal budget management with AI-powered transaction parsing, comprehensive analytics, and an intuitive user interface.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [Key Features Explained](#key-features-explained)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Performance Optimization](#performance-optimization)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

HamAI Frontend is a single-page application (SPA) built with React that provides a comprehensive budgeting solution. It features AI-powered transaction parsing, real-time analytics, customizable categories, and a beautiful, responsive user interface with dark mode support.

## ✨ Features

### 🔐 Authentication
- **Firebase Authentication**: Secure email/password authentication
- **User Profile Management**: Display name and profile updates
- **Session Persistence**: Automatic login state management
- **Protected Routes**: Secure navigation with authentication guards

### 💰 Transaction Management
- **Add Transactions**: Manual entry with full transaction form
- **Edit Transactions**: Inline editing with pre-filled data
- **Delete Transactions**: Confirmation modals for safe deletion
- **Transaction Details**: Click to view full transaction details
- **Monthly Organization**: Transactions organized by month and year

### 🤖 AI-Powered Auto-Entry
- **Intelligent Parsing**: Google Gemini AI integration for receipt parsing
- **Fallback Parser**: Robust local parsing when AI is unavailable
- **Real-time Preview**: Instant form population from parsed text
- **Multi-format Support**: Handles various receipt and transaction formats
- **Automatic Categorization**: Smart category assignment

### 📊 Analytics & Insights
- **Monthly Dashboard**: Comprehensive overview of spending
- **Interactive Pie Chart**: Category-wise spending visualization
- **Category Filtering**: Toggle categories on/off for custom views
- **Summary Statistics**: Total, subtotal, tax breakdowns
- **Search Functionality**: Filter transactions by metadata

### 🎨 Customization
- **Category Management**: Create, edit, and organize custom categories
- **Receiver Management**: Manage store and receiver names
- **Color Coding**: Unique colors for each category
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### 🎯 User Experience
- **Intuitive Navigation**: Easy-to-use interface
- **Real-time Updates**: Instant feedback on actions
- **Toast Notifications**: User-friendly success/error messages
- **Loading States**: Clear indicators during data fetching
- **Error Handling**: Graceful error messages and recovery

## 🛠 Tech Stack

### Core Framework
- **React** (v18.2.0) - UI library
- **React DOM** (v18.2.0) - DOM rendering
- **React Router DOM** (v6.20.1) - Client-side routing

### UI & Styling
- **CSS3** - Custom styling with CSS variables
- **Lucide React** (v0.294.0) - Modern icon library
- **Recharts** (v3.7.0) - Chart library for analytics

### State Management & Data
- **React Context API** - Global state management (AuthContext)
- **React Hooks** - useState, useEffect, useCallback, useMemo
- **Axios** (v1.6.2) - HTTP client with interceptors

### Authentication & Backend
- **Firebase** (v12.8.0) - Authentication client SDK
- **Axios Interceptors** - Automatic token injection

### User Experience
- **React Hot Toast** (v2.4.1) - Toast notifications
- **LocalStorage** - Persistent user preferences and color mappings
- **SessionStorage** - Temporary data storage

### Build Tools
- **Create React App** (v5.0.1) - Build tooling and development server
- **React Scripts** - Zero-configuration build setup

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn**
- **Backend API** running (see [Backend README](../backend/README.md))
- **Firebase Project** configured with:
  - Authentication enabled (Email/Password)
  - Firestore database initialized

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BudgetAI/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install All Dependencies (Frontend + Backend)

From the `backend/` directory:

```bash
cd ../backend
npm run install-all
```

This installs dependencies for both frontend and backend.

## ⚙️ Configuration

### Environment Variables

The frontend `.env` file is **auto-generated** from `backend/.env` during `npm start` or `npm run build`. You should not manually edit `frontend/.env`.

### Required Environment Variables (in `backend/.env`)

```env
# Frontend API URLs
REACT_APP_API_URL_LOCAL=http://localhost:5001/api
REACT_APP_API_URL_PROD=https://your-backend-url.vercel.app/api

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Manual Environment Sync

If needed, manually sync environment variables:

```bash
node sync-env.cjs
```

Or from the backend directory:

```bash
cd ../backend
npm run sync-env
```

## 🏃 Running Locally

### Development Mode (Frontend Only)

```bash
npm start
```

The app will open at `http://localhost:3000` (browser auto-open is disabled).

### Development Mode (Frontend + Backend)

From the `backend/` directory:

```bash
cd ../backend
npm run dev:all
```

This starts both:
- **Backend**: `http://localhost:5001`
- **Frontend**: `http://localhost:3000`

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Serve Production Build Locally

```bash
npm install -g serve
serve -s build
```

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html            # HTML template
│   └── *.png, *.svg          # Logo assets
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.js  # Error boundary component
│   │   ├── PrivateRoute.js   # Protected route wrapper
│   │   └── ThemeToggle.js    # Dark/light mode toggle
│   ├── context/
│   │   └── AuthContext.js    # Authentication context provider
│   ├── pages/
│   │   ├── Dashboard.js      # Main dashboard page
│   │   ├── Dashboard.css     # Dashboard styles
│   │   ├── AddEntry.js       # Add/Edit transaction page
│   │   ├── AddEntry.css      # Add entry styles
│   │   ├── Login.js          # Login page
│   │   ├── Register.js        # Registration page
│   │   ├── Auth.css          # Auth page styles
│   │   └── ReviewEntry.js    # Transaction review (legacy)
│   ├── utils/
│   │   ├── axios.js          # Axios configuration
│   │   ├── categoryColors.js # Category color management
│   │   └── navigation.js     # Navigation utilities
│   ├── App.js                # Main app component
│   ├── App.css               # Global app styles
│   ├── index.js              # React entry point
│   ├── index.css             # Global styles and CSS variables
│   └── firebase.js            # Firebase configuration
├── sync-env.cjs              # Environment variable sync script
├── vercel.json                # Vercel deployment configuration
├── package.json
└── .env                       # Auto-generated (do not edit manually)
```

## 🔍 Key Features Explained

### Authentication Flow

1. User signs up/logs in via Firebase Authentication
2. Firebase ID token is obtained
3. Token is sent to backend `/api/auth/verify` for verification
4. User profile is loaded and stored in AuthContext
5. Protected routes check authentication state

### Transaction Management

- **Adding**: Use the "Add Entry" page with AI parsing or manual entry
- **Editing**: Click "Edit" on any transaction to modify it
- **Deleting**: Click "Delete" and confirm in the modal
- **Viewing**: Click any transaction row to see full details

### AI Auto-Entry Feature

1. Paste receipt/transaction text in the left panel
2. Click "Auto-fill" to parse with AI
3. Parsed data automatically populates the right-side form
4. Review and edit before saving

### Category Colors

- Each category gets a unique color from a predefined palette
- Colors are stored in localStorage for persistence
- New categories automatically get assigned colors
- Colors are used consistently across badges, charts, and lists

### Analytics

- **Pie Chart**: Visual representation of category spending
- **Category Filters**: Checkboxes to show/hide categories
- **Search**: Filter transactions by any metadata
- **Monthly Navigation**: Navigate between months

## 🌐 Environment Variables

### Public Variables (REACT_APP_*)

All `REACT_APP_*` variables are **public** and bundled into the JavaScript bundle. They are safe to expose to the browser.

### Available Variables

- `REACT_APP_API_URL_LOCAL` - Local backend URL
- `REACT_APP_API_URL_PROD` - Production backend URL
- `REACT_APP_FIREBASE_API_KEY` - Firebase API key
- `REACT_APP_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `REACT_APP_FIREBASE_PROJECT_ID` - Firebase project ID
- `REACT_APP_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `REACT_APP_FIREBASE_APP_ID` - Firebase app ID

## 🚢 Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
cd frontend
vercel
```

3. **Set Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all `REACT_APP_*` variables from `backend/.env`

4. **Deploy to Production**:
```bash
vercel --prod
```

### Build Configuration

The `vercel.json` file configures:
- Output directory: `build`
- Build command: `npm run build`

### Environment Variables on Vercel

Ensure all `REACT_APP_*` variables are set in Vercel:
- `REACT_APP_API_URL_PROD` (your backend URL)
- All Firebase configuration variables

## ⚡ Performance Optimization

### Implemented Optimizations

1. **React.memo**: Prevents unnecessary re-renders
2. **useMemo**: Memoizes expensive calculations
3. **useCallback**: Memoizes callback functions
4. **Code Splitting**: React Router lazy loading (can be added)
5. **Image Optimization**: Optimized logo assets
6. **CSS Variables**: Efficient theming system

### Further Optimizations

- Implement React.lazy() for route-based code splitting
- Add service worker for offline support
- Optimize bundle size with tree shaking
- Implement virtual scrolling for large transaction lists

## 🌍 Browser Support

- **Chrome** (latest)
- **Firefox** (latest)
- **Safari** (latest)
- **Edge** (latest)

### Minimum Versions

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Common Issues

#### Environment Variables Not Loading
**Error**: `REACT_APP_*` variables are undefined

**Solution**: 
1. Ensure variables are in `backend/.env`
2. Run `npm run sync-env` or restart dev server
3. Check that variable names start with `REACT_APP_`

#### CORS Errors
**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**: 
- Ensure backend `FRONTEND_URL` matches your frontend URL
- Check backend CORS configuration

#### Firebase Authentication Errors
**Error**: `Firebase: Error (auth/invalid-api-key)`

**Solution**:
- Verify `REACT_APP_FIREBASE_API_KEY` is correct
- Check Firebase project settings
- Ensure Firebase Authentication is enabled

#### Build Failures
**Error**: `Failed to compile`

**Solution**:
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf build`
- Check for syntax errors in console

#### Category Colors Not Showing
**Solution**:
- Clear browser cache and localStorage
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Check browser console for errors

## 🧪 Testing

### Manual Testing

1. **Authentication**: Test login, signup, logout
2. **Transactions**: Add, edit, delete transactions
3. **AI Parsing**: Test with various receipt formats
4. **Analytics**: Verify charts and statistics
5. **Responsive Design**: Test on different screen sizes

### Automated Testing (To Be Added)

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop**: Full feature set with optimal layout
- **Tablet**: Adapted layout with touch-friendly controls
- **Mobile**: Mobile-optimized interface

### Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🎨 Theming

### Light Mode
- Clean, bright interface
- High contrast for readability
- Pink accent colors

### Dark Mode
- Dark background for reduced eye strain
- Maintained contrast ratios
- Consistent color scheme

### Customization

Theme colors are defined in `src/index.css` using CSS variables:
- `--pink-primary`, `--pink-secondary`
- `--bg-primary`, `--bg-secondary`
- `--text-primary`, `--text-secondary`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use meaningful component and variable names
- Add comments for complex logic
- Keep components small and focused

### Component Guidelines

- One component per file
- Use PropTypes or TypeScript for type checking (if added)
- Extract reusable logic into custom hooks
- Use CSS modules or styled-components for component-specific styles

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

## 🔗 Related Documentation

- [Backend API Documentation](../backend/README.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev/)
- [React Router Documentation](https://reactrouter.com/)

---

**Built with ❤️ for modern budgeting**