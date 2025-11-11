import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [siteName, setSiteName] = useState('');
  const [siteDomain, setSiteDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleCreateSite = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Create the first site
      const response = await axios.post(
        `${API_URL}/api/sites`,
        {
          name: siteName,
          domain: siteDomain,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Redirect to Overview after successful site creation
        navigate('/overview');
      } else {
        setError(response.data.error || 'Failed to create site');
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to create site. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Beacon, {user?.name}!
            </h1>
            <p className="text-gray-600 text-lg">
              Let's set up your first site to start tracking your visitors.
            </p>
          </div>

          {/* Onboarding Steps */}
          <div className="mb-8 space-y-4">
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white font-bold mr-4 flex-shrink-0">
                ✓
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Account Created</h3>
                <p className="text-sm text-gray-600">You're all set!</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-400 text-white font-bold mr-4 flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create Your First Site</h3>
                <p className="text-sm text-gray-600">Set up a site to track visitors</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-400 text-white font-bold mr-4 flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Install Tracking Code</h3>
                <p className="text-sm text-gray-600">Add script to your website</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-400 text-white font-bold mr-4 flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-600">Start seeing visitor data</p>
              </div>
            </div>
          </div>

          {/* Create Site Form */}
          <form onSubmit={handleCreateSite} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                id="siteName"
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g., My E-commerce Store"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">What would you like to call this site?</p>
            </div>

            <div>
              <label htmlFor="siteDomain" className="block text-sm font-medium text-gray-700 mb-1">
                Site Domain
              </label>
              <input
                id="siteDomain"
                type="text"
                value={siteDomain}
                onChange={(e) => setSiteDomain(e.target.value)}
                placeholder="e.g., example.com"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Your website's domain (without https://)</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition mt-6"
            >
              {loading ? 'Creating Site...' : (
                <>
                  Create Site
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> You can create additional sites and manage them all from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
