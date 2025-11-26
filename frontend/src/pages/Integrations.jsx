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
  const [detectedEvents, setDetectedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // Meta Config
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [metaDatasetId, setMetaDatasetId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaActionSource, setMetaActionSource] = useState('website');
  
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
      loadDetectedEvents();
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
      setMetaDatasetId('');
      setMetaAccessToken('');
      setMetaActionSource('website');
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
          setMetaDatasetId(destinations.meta.datasetId || destinations.meta.pixelId || '');
          setMetaAccessToken(destinations.meta.accessToken || '');
          setMetaActionSource(destinations.meta.actionSource || 'website');
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

  const loadDetectedEvents = async () => {
    if (!selectedSiteId) return;
    
    setLoadingEvents(true);
    try {
      const response = await axios.get(`/api/sites/${selectedSiteId}/detected-events`);
      setDetectedEvents(response.data.data || []);
    } catch (error) {
      console.error('Error loading detected events:', error);
      setDetectedEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const toggleEventSelection = (eventName) => {
    if (ga4Events.includes('*')) {
      // If "all events" is selected, switch to selecting individual events
      setGa4Events(detectedEvents.map(e => e.name).filter(name => name !== eventName));
    } else if (ga4Events.includes(eventName)) {
      setGa4Events(ga4Events.filter(name => name !== eventName));
    } else {
      setGa4Events([...ga4Events, eventName]);
    }
  };

  const selectAllEvents = () => {
    setGa4Events(['*']);
  };

  const deselectAllEvents = () => {
    setGa4Events([]);
  };

  const isEventSelected = (eventName) => {
    return ga4Events.includes('*') || ga4Events.includes(eventName);
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
          datasetId: metaDatasetId,
          pixelId: metaDatasetId, // Keep pixelId for backward compatibility
          accessToken: metaAccessToken,
          actionSource: metaActionSource
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Event Forwarding</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllEvents}
                    className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllEvents}
                    className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              {loadingEvents ? (
                <div className="text-sm text-gray-500 py-4">Loading detected events...</div>
              ) : detectedEvents.length === 0 ? (
                <div className="text-sm text-gray-500 py-4">No events detected yet. Events will appear here once tracking starts.</div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                  {detectedEvents.map((event) => (
                    <label key={event.name} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isEventSelected(event.name)}
                          onChange={() => toggleEventSelection(event.name)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">{event.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{event.count.toLocaleString()} events</span>
                    </label>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                {ga4Events.includes('*') 
                  ? 'All events will be forwarded to GA4.' 
                  : `${ga4Events.length} event${ga4Events.length !== 1 ? 's' : ''} selected.`
                } Events are prefixed with 'beacon_' in GA4 to avoid conflicts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Meta Integration */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Meta Conversions API</h3>
            <p className="text-sm text-gray-600">Send events to Facebook/Instagram Ads via Datasets</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Dataset ID</label>
              <input
                type="text"
                value={metaDatasetId}
                onChange={(e) => setMetaDatasetId(e.target.value)}
                placeholder="123456789012345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Found in Meta Events Manager → Data Sources. In most cases, Dataset ID = Pixel ID.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Source</label>
              <select
                value={metaActionSource}
                onChange={(e) => setMetaActionSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="website">Website</option>
                <option value="app">Mobile App</option>
                <option value="offline">Offline (Store/Phone)</option>
                <option value="email">Email</option>
                <option value="chat">Chat</option>
                <option value="phone_call">Phone Call</option>
                <option value="physical_store">Physical Store</option>
                <option value="system_generated">System Generated</option>
                <option value="other">Other</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Where the conversion event occurred. Select 'Website' for online tracking, 'Offline' for in-store/phone events.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Token (Optional)</label>
              <input
                type="password"
                value={metaAccessToken}
                onChange={(e) => setMetaAccessToken(e.target.value)}
                placeholder="Leave blank to use agency System User token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Generate in Meta Events Manager → Settings → Conversions API. Leave blank to use agency-level System User token.</p>
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
