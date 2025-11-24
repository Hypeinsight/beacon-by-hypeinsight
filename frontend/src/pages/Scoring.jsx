import { useState, useEffect } from 'react';
import { Award, Save, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import axios from '../lib/axios';

export default function Scoring() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [detectedEvents, setDetectedEvents] = useState([]);
  const [scoringRules, setScoringRules] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadDetectedEvents();
      loadScoringRules();
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

  const loadScoringRules = async () => {
    if (!selectedSiteId) return;
    
    try {
      const response = await axios.get(`/api/sites/${selectedSiteId}/scoring-rules`);
      const rules = response.data.data || [];
      
      // Convert to map for easier lookup
      const rulesMap = {};
      rules.forEach(rule => {
        rulesMap[rule.event_name] = {
          id: rule.id,
          scoreValue: rule.score_value,
          description: rule.description || '',
          active: rule.active
        };
      });
      
      setScoringRules(rulesMap);
    } catch (error) {
      console.error('Error loading scoring rules:', error);
      setScoringRules({});
    }
  };

  const updateEventScore = (eventName, field, value) => {
    setScoringRules({
      ...scoringRules,
      [eventName]: {
        ...scoringRules[eventName],
        [field]: value
      }
    });
  };

  const saveRules = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Convert rules map to array for API
      const rulesArray = Object.entries(scoringRules)
        .filter(([eventName, rule]) => rule.scoreValue !== undefined && rule.scoreValue !== '')
        .map(([eventName, rule]) => ({
          eventName,
          scoreValue: parseInt(rule.scoreValue, 10) || 0,
          description: rule.description || '',
          active: rule.active !== false
        }));

      await axios.put(`/api/sites/${selectedSiteId}/scoring-rules`, {
        rules: rulesArray
      });

      await loadScoringRules();
      setMessage({ type: 'success', text: 'Scoring rules saved successfully!' });
    } catch (error) {
      console.error('Error saving scoring rules:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save scoring rules' });
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
            <Award className="w-6 h-6" style={{ color: '#00A9BA' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Visitor Scoring</h1>
            <p className="mt-2 text-gray-600">Assign scores to events to identify high-value visitors</p>
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
        <h3 className="font-semibold text-blue-900 mb-2">How Visitor Scoring Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Assign scores:</strong> Give point values to different events (e.g., form_submit = 10 points)</li>
          <li>• <strong>Track engagement:</strong> Beacon automatically calculates visitor scores as they interact</li>
          <li>• <strong>Identify hot leads:</strong> High-scoring visitors are your most engaged prospects</li>
          <li>• <strong>Flexible scoring:</strong> Use positive scores for valuable actions, negative for undesired behavior</li>
        </ul>
      </div>

      {/* Scoring Rules */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Event Scores</h2>
        </div>

        {loadingEvents ? (
          <div className="text-center py-12 text-gray-500">Loading detected events...</div>
        ) : detectedEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No events detected yet</p>
            <p className="text-sm mt-1">Events will appear here once tracking starts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {detectedEvents.map((event) => {
              const rule = scoringRules[event.name] || { scoreValue: 0, description: '', active: true };
              
              return (
                <div key={event.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Event Name */}
                    <div className="md:col-span-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rule.active !== false}
                          onChange={(e) => updateEventScore(event.name, 'active', e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{event.name}</p>
                          <p className="text-xs text-gray-500">{event.count.toLocaleString()} occurrences</p>
                        </div>
                      </div>
                    </div>

                    {/* Score Value */}
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        value={rule.scoreValue || ''}
                        onChange={(e) => updateEventScore(event.name, 'scoreValue', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center font-semibold"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-6">
                      <input
                        type="text"
                        value={rule.description || ''}
                        onChange={(e) => updateEventScore(event.name, 'description', e.target.value)}
                        placeholder="Optional description..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      {detectedEvents.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={saveRules}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#46B646' }}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Scoring Rules'}
          </button>
        </div>
      )}
    </div>
  );
}
