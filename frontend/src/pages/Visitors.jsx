import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Globe, Monitor, MapPin, Clock, Activity } from 'lucide-react';
import axios from 'axios';

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${API_URL}/api/debug/events`);
      const events = response.data.events || [];
      
      // Group events by client_id to create visitor profiles
      const visitorMap = {};
      events.forEach(event => {
        const clientId = event.client_id || 'anonymous';
        if (!visitorMap[clientId]) {
          visitorMap[clientId] = {
            clientId,
            firstSeen: event.event_timestamp,
            lastSeen: event.event_timestamp,
            events: [],
            browser: event.browser,
            os: event.operating_system,
            country: event.ip_country,
            city: event.ip_city,
            company: event.ip_company_name,
          };
        }
        visitorMap[clientId].events.push(event);
        visitorMap[clientId].lastSeen = Math.max(visitorMap[clientId].lastSeen, event.event_timestamp);
        visitorMap[clientId].firstSeen = Math.min(visitorMap[clientId].firstSeen, event.event_timestamp);
      });

      const visitorList = Object.values(visitorMap)
        .sort((a, b) => b.lastSeen - a.lastSeen);
      
      setVisitors(visitorList);
    } catch (error) {
      console.error('Error loading visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp)).toLocaleString();
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - parseInt(timestamp)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading visitors...</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visitors</h1>
          <p className="mt-2 text-gray-600">{visitors.length} unique visitors tracked</p>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: '#02202E' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Visitor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Last Seen
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visitors.map((visitor, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {/* Navigate to visitor detail */}}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#46B64620' }}>
                        <Users className="w-5 h-5" style={{ color: '#46B646' }} />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {visitor.company || 'Anonymous Visitor'}
                        </p>
                        <p className="text-xs text-gray-500">ID: {visitor.clientId.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {visitor.city || visitor.country || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900 flex items-center">
                        <Monitor className="w-4 h-4 mr-1 text-gray-400" />
                        {visitor.browser || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">{visitor.os || 'Unknown OS'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-sm font-semibold rounded-full" style={{ backgroundColor: '#00A9BA20', color: '#00A9BA' }}>
                      {visitor.events.length} events
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{getTimeAgo(visitor.lastSeen)}</p>
                      <p className="text-xs text-gray-500">{formatDate(visitor.lastSeen)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/visitors/${visitor.clientId}`);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                      style={{ backgroundColor: '#46B646' }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#3da03d'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#46B646'}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visitors.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No visitors yet. Start tracking to see data here!
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Click "View Details" on any visitor to see their complete session timeline with every click, scroll, and page view.
        </p>
      </div>
    </div>
  );
}
