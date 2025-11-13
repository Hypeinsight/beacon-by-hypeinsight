import { useState, useEffect, useRef } from 'react';
import { Zap, Plus, Trash2, Save, AlertCircle, CheckCircle, Target, X } from 'lucide-react';
import axios from '../lib/axios';

export default function EventBuilder() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [customEvents, setCustomEvents] = useState([]);
  const [selectorHelperOpen, setSelectorHelperOpen] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [siteUrl, setSiteUrl] = useState('');

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

  const openSelectorHelper = (eventId) => {
    const site = sites.find(s => s.id === selectedSiteId);
    if (site) {
      setSiteUrl(`https://${site.domain}`);
      setCurrentEventId(eventId);
      setSelectorHelperOpen(true);
    }
  };

  const closeSelectorHelper = () => {
    setSelectorHelperOpen(false);
    setCurrentEventId(null);
    setSiteUrl('');
  };

  const handleSelectorSelected = (selector) => {
    if (currentEventId) {
      updateEvent(currentEventId, 'selector', selector);
      setMessage({ type: 'success', text: `Selector copied: ${selector}` });
      closeSelectorHelper();
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
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={event.selector}
                        onChange={(e) => updateEvent(event.id, 'selector', e.target.value)}
                        placeholder={
                          event.type === 'pageview' 
                            ? 'e.g., /thank-you or /checkout/*'
                            : 'e.g., #contact-form or .cta-button'
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      {event.type !== 'pageview' && (
                        <button
                          onClick={() => openSelectorHelper(event.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          type="button"
                        >
                          <Target className="w-4 h-4" />
                          Selector Helper
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.type === 'pageview' 
                        ? 'Use * as wildcard. Example: /product/* matches all product pages'
                        : 'Use browser DevTools or click "Selector Helper" to find selectors. Example: #myButton or button.submit'}
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

      {/* CSS Selector Helper Modal */}
      {selectorHelperOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">CSS Selector Helper</h3>
                <p className="text-sm text-gray-600 mt-1">Click on any element on your website to get its CSS selector</p>
              </div>
              <button
                onClick={closeSelectorHelper}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-yellow-50 border-b border-yellow-200">
              <p className="text-sm text-yellow-800 mb-3">
                <strong>⚠️ CORS Limitation:</strong> Due to browser security, the live selector tool may not work in the iframe below.
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Alternative method:</strong> Use this bookmarklet on your actual website:
              </p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 text-xs bg-white p-2 rounded border border-gray-300 overflow-x-auto">
                  {"javascript:(function(){const s=document.createElement('script');s.src='https://beacon-dashboard.onrender.com/selector-helper.js';document.body.appendChild(s);}})();"}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("javascript:(function(){const s=document.createElement('script');s.src='https://beacon-dashboard.onrender.com/selector-helper.js';document.body.appendChild(s);})()");
                    setMessage({ type: 'success', text: 'Bookmarklet copied! Drag to your bookmarks bar or paste in browser console.' });
                  }}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm whitespace-nowrap"
                >
                  Copy Bookmarklet
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                <strong>How to use:</strong> Copy the bookmarklet → Visit your website → Paste in browser console → Hover & click elements to see their selectors
              </p>
            </div>

            {/* iframe */}
            <div className="flex-1 overflow-hidden">
              <SelectorHelperIframe 
                url={siteUrl} 
                onSelectorSelected={handleSelectorSelected}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Selector Helper iframe Component
function SelectorHelperIframe({ url, onSelectorSelected }) {
  const iframeRef = useRef(null);

  const handleLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      console.log('Iframe loaded, injecting script...');
      
      // Inject selector detection script
      const script = iframeDoc.createElement('script');
      script.textContent = `
          (function() {
            let hoveredElement = null;
            let overlay = null;

            // Create overlay for highlighting
            function createOverlay() {
              overlay = document.createElement('div');
              overlay.style.position = 'absolute';
              overlay.style.border = '2px solid #9333EA';
              overlay.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
              overlay.style.pointerEvents = 'none';
              overlay.style.zIndex = '999999';
              overlay.style.display = 'none';
              document.body.appendChild(overlay);
            }

            // Generate CSS selector for element
            function getSelector(el) {
              // Prefer ID
              if (el.id) return '#' + el.id;
              
              // Try unique class
              if (el.className && typeof el.className === 'string') {
                const classes = el.className.trim().split(/\s+/).filter(c => c);
                if (classes.length > 0) {
                  const selector = el.tagName.toLowerCase() + '.' + classes.join('.');
                  if (document.querySelectorAll(selector).length === 1) {
                    return selector;
                  }
                }
              }
              
              // Fallback to tag with nth-child
              const parent = el.parentElement;
              if (parent) {
                const siblings = Array.from(parent.children).filter(e => e.tagName === el.tagName);
                if (siblings.length > 1) {
                  const index = siblings.indexOf(el) + 1;
                  return el.tagName.toLowerCase() + ':nth-of-type(' + index + ')';
                }
              }
              
              return el.tagName.toLowerCase();
            }

            // Highlight element on hover
            document.addEventListener('mouseover', function(e) {
              hoveredElement = e.target;
              const rect = hoveredElement.getBoundingClientRect();
              overlay.style.display = 'block';
              overlay.style.top = (rect.top + window.scrollY) + 'px';
              overlay.style.left = (rect.left + window.scrollX) + 'px';
              overlay.style.width = rect.width + 'px';
              overlay.style.height = rect.height + 'px';
            });

            // Select element on click
            document.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              const selector = getSelector(hoveredElement);
              window.parent.postMessage({ type: 'SELECTOR_SELECTED', selector }, '*');
            }, true);

            createOverlay();
          })();
        `;
        iframeDoc.body.appendChild(script);
        console.log('Script injected successfully!');
      } catch (error) {
        console.error('Cannot inject script (CORS blocked):', error);
        alert('Cannot access this website due to CORS restrictions. Please use the bookmarklet method above instead.');
      }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'SELECTOR_SELECTED') {
        console.log('Selector received:', event.data.selector);
        onSelectorSelected(event.data.selector);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectorSelected]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      onLoad={handleLoad}
      className="w-full h-full border-0"
      title="Website Preview"
    />
  );
}
