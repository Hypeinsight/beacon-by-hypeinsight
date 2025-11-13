import { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle } from 'lucide-react';
import axios from '../lib/axios';

export default function Integrations() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // GA4 Config
  const [ga4Enabled, setGa4Enabled] = useState(false);
  const [ga4MeasurementId, setGa4MeasurementId] = useState('');
  const [ga4ApiSecret, setGa4ApiSecret] = useState('');
  const [ga4Events, setGa4Events] = useState(['page_view']);
  
  // Meta Config
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  
  // Google Ads Config
  const [googleAdsEnabled, setGoogleAdsEnabled] = useState(false);
  const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState('');
  const [googleAdsConversionId, setGoogleAdsConversionId] = useState('');

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadSiteConfig();
    }
  }, [selectedSiteId]);

  const loadSites = async () => {
    try {
      const response = await axios.get('/api/sites');
      setSites(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedSiteId(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSiteConfig = async () => {
    try {
      const site = sites.find(s => s.id === selectedSiteId);
      
      // Reset all fields first
      setGa4Enabled(false);
      setGa4MeasurementId('');
      setGa4ApiSecret('');
      setGa4Events(['page_view']);
      setMetaEnabled(false);
      setMetaPixelId('');
      setMetaAccessToken('');
      setGoogleAdsEnabled(false);
      setGoogleAdsCustomerId('');
      setGoogleAdsConversionId('');
      
      if (site && site.config && site.config.destinations) {
        const { destinations } = site.config;
        
        // GA4
        if (destinations.ga4) {
          setGa4Enabled(destinations.ga4.enabled || false);
          setGa4MeasurementId(destinations.ga4.measurementId || '');
          setGa4ApiSecret(destinations.ga4.apiSecret || '');
          setGa4Events(destinations.ga4.events || ['page_view']);
        }
        
        // Meta
        if (destinations.meta) {
          setMetaEnabled(destinations.meta.enabled || false);
          setMetaPixelId(destinations.meta.pixelId || '');
          setMetaAccessToken(destinations.meta.accessToken || '');
        }
        
        // Google Ads
        if (destinations.googleAds) {
          setGoogleAdsEnabled(destinations.googleAds.enabled || false);
          setGoogleAdsCustomerId(destinations.googleAds.customerId || '');
          setGoogleAdsConversionId(destinations.googleAds.conversionId || '');
        }
      }
    } catch (error) {
      console.error('Error loading site config:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const destinations = {
        ga4: {
          enabled: ga4Enabled,
          measurementId: ga4MeasurementId,
          apiSecret: ga4ApiSecret,
          events: ga4Events
        },
        meta: {
          enabled: metaEnabled,
          pixelId: metaPixelId,
          accessToken: metaAccessToken
        },
        googleAds: {
          enabled: googleAdsEnabled,
          customerId: googleAdsCustomerId,
          conversionId: googleAdsConversionId
        }
      };

      await axios.put(`/api/sites/${selectedSiteId}/destinations`, { destinations });
      
      // Reload sites to get updated config
      await loadSites();
      
      setMessage({ type: 'success', text: 'Integration settings saved successfully!' });
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full" style={{ backgroundColor: '#00A9BA20' }}>
            <Settings className="w-6 h-6" style={{ color: '#00A9BA' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
            <p className="mt-2 text-gray-600">Forward events to GA4, Meta, and Google Ads in real-time</p>
          </div>
        </div>
      </div>

      {/* Site Selector */}
      {sites.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Site</label>
          <select
            value={selectedSiteId || ''}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.domain})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        </div>
      )}


      {/* GA4 Integration */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Google Analytics 4</h3>
            <p className="text-sm text-gray-600">Send events to GA4 via Measurement Protocol</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={ga4Enabled}
              onChange={(e) => setGa4Enabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
        
        {ga4Enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Measurement ID</label>
              <input
                type="text"
                value={ga4MeasurementId}
                onChange={(e) => setGa4MeasurementId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Found in GA4 Admin → Data Streams → Stream details</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
              <input
                type="password"
                value={ga4ApiSecret}
                onChange={(e) => setGa4ApiSecret(e.target.value)}
                placeholder="Enter API Secret"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Found in GA4 Admin → Data Streams → Measurement Protocol API secrets</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Forwarding</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={ga4Events.includes('*')}
                    onChange={() => setGa4Events(['*'])}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Forward all events</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={ga4Events.includes('page_view') && !ga4Events.includes('*')}
                    onChange={() => setGa4Events(['page_view'])}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Only page views</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Events are prefixed with 'beacon_' in GA4 (e.g., beacon_page_view) to avoid conflicts with existing GA4 tracking.</p>
            </div>
          </div>
        )}
      </div>

      {/* Meta Integration */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Meta (Facebook) Pixel</h3>
            <p className="text-sm text-gray-600">Send events to Facebook/Instagram Ads via Conversions API</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={metaEnabled}
              onChange={(e) => setMetaEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
        
        {metaEnabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pixel ID</label>
              <input
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                placeholder="123456789012345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Found in Meta Events Manager</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
              <input
                type="password"
                value={metaAccessToken}
                onChange={(e) => setMetaAccessToken(e.target.value)}
                placeholder="Enter Access Token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Generate in Meta Events Manager → Settings → Conversions API</p>
            </div>
          </div>
        )}
      </div>

      {/* Google Ads Integration */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Google Ads Conversions</h3>
            <p className="text-sm text-gray-600">Track conversions in Google Ads</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={googleAdsEnabled}
              onChange={(e) => setGoogleAdsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
        
        {googleAdsEnabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
              <input
                type="text"
                value={googleAdsCustomerId}
                onChange={(e) => setGoogleAdsCustomerId(e.target.value)}
                placeholder="123-456-7890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Found in Google Ads account settings</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conversion ID</label>
              <input
                type="text"
                value={googleAdsConversionId}
                onChange={(e) => setGoogleAdsConversionId(e.target.value)}
                placeholder="AW-XXXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Found in Google Ads → Tools → Conversions</p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#46B646' }}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
