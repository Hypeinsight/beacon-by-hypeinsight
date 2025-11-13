import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import axios from '../lib/axios';

export default function EventBuilder() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [customEvents, setCustomEvents] = useState([]);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadEventConfigs();
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

  const loadEventConfigs = async () => {
    try {
      const site = sites.find(s => s.id === selectedSiteId);
      if (site && site.config && site.config.customEvents) {
        setCustomEvents(site.config.customEvents);
      } else {
        setCustomEvents([]);
      }
    } catch (error) {
      console.error('Error loading event configs:', error);
    }
  };

  const addEvent = () => {
    setCustomEvents([
      ...customEvents,
      {
        id: Date.now().toString(),
        type: 'click',
        selector: '',
        eventName: '',
        properties: {}
      }
    ]);
  };

  const updateEvent = (id, field, value) => {
    setCustomEvents(customEvents.map(event =>
      event.id === id ? { ...event, [field]: value } : event
    ));
  };

  const deleteEvent = (id) => {
    setCustomEvents(customEvents.filter(event => event.id !== id));
  };

  const saveEvents = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await axios.put(`/api/sites/${selectedSiteId}/custom-events`, {
        customEvents
      });

      await loadSites();
      setMessage({ type: 'success', text: 'Event configurations saved successfully!' });
    } catch (error) {
      console.error('Error saving events:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save events' });
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
            <Zap className="w-6 h-6" style={{ color: '#00A9BA' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Builder</h1>
            <p className="mt-2 text-gray-600">Define custom events to track without code - fills gaps in dataLayer tracking</p>
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How Event Builder Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Listens to dataLayer:</strong> Beacon automatically captures existing dataLayer events</li>
          <li>• <strong>Fills the gaps:</strong> Use Event Builder to track events NOT in dataLayer (forms, buttons, etc.)</li>
          <li>• <strong>Pushes back to dataLayer:</strong> Events you define here are pushed to dataLayer for GTM and other tools</li>
          <li>• <strong>No code needed:</strong> Just enter a CSS selector and event name - Beacon handles the rest</li>
        </ul>
      </div>

      {/* Event List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Custom Events</h2>
          <button
            onClick={addEvent}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#46B646' }}
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>

        {customEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No custom events configured yet</p>
            <p className="text-sm mt-1">Click "Add Event" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customEvents.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Event Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    <select
                      value={event.type}
                      onChange={(e) => updateEvent(event.id, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="click">Button/Link Click</option>
                      <option value="submit">Form Submit</option>
                      <option value="pageview">Page View (URL match)</option>
                    </select>
                  </div>

                  {/* Event Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                    <input
                      type="text"
                      value={event.eventName}
                      onChange={(e) => updateEvent(event.id, 'eventName', e.target.value)}
                      placeholder="e.g., contact_form_submit"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* CSS Selector */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {event.type === 'pageview' ? 'URL Pattern' : 'CSS Selector'}
                    </label>
                    <input
                      type="text"
                      value={event.selector}
                      onChange={(e) => updateEvent(event.id, 'selector', e.target.value)}
                      placeholder={
                        event.type === 'pageview' 
                          ? 'e.g., /thank-you or /checkout/*'
                          : 'e.g., #contact-form or .cta-button'
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {event.type === 'pageview' 
                        ? 'Use * as wildcard. Example: /product/* matches all product pages'
                        : 'Use browser DevTools to find selectors. Example: #myButton or button.submit'}
                    </p>
                  </div>
                </div>

                {/* Delete Button */}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveEvents}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#46B646' }}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Events'}
        </button>
      </div>
    </div>
  );
}
