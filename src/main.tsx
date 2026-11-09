import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL CLIENT ERROR CAUGHT BY BOUNDARY:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-xl w-full bg-slate-950 border border-rose-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-rose-400">Application Rendering Notice</h2>
            <p className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded-lg overflow-x-auto">
              {String(this.state.error?.message || this.state.error || 'Unknown runtime error')}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('leadsarrow_active_nav_view');
                    localStorage.removeItem('leadsarrow_user_filter_state');
                  } catch (e) {}
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Reset View & Reload Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
