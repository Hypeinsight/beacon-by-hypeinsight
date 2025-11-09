import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Building2, TrendingUp, Clock } from 'lucide-react';
import axios from 'axios';

export default function Overview() {
  const [stats, setStats] = useState({
    totalVisitors: 0,
    totalCompanies: 0,
    conversions: 0,
    avgTime: '0s'
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/debug/events');
      setStats({
        totalVisitors: response.data.visitors || 0,
        totalCompanies: 0, // Would calculate from company data
        conversions: response.data.forms || 0,
        avgTime: '3m 24s' // Would calculate from engagement data
      });
      // Filter out useless user_engagement events
      const meaningfulEvents = response.data.events.filter(e => e.event_name !== 'user_engagement');
      setEvents(meaningfulEvents.slice(0, 10));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Visitors', value: stats.totalVisitors, icon: Users, change: '+12.4%', positive: true },
    { label: 'Companies', value: stats.totalCompanies, icon: Building2, change: '+8.3%', positive: true },
    { label: 'Conversions', value: stats.conversions, icon: TrendingUp, change: '+23.5%', positive: true },
    { label: 'Avg Time', value: stats.avgTime, icon: Clock, change: '-5.2%', positive: false },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading dashboard...</div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        <p className="mt-2 text-gray-600">Welcome to your Beacon analytics dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
                <p className={`mt-2 text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </p>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 rounded-full">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
        </div>
        <div className="p-6">
          {events.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No events yet. Start tracking to see data here!</p>
          ) : (
            <div className="space-y-3">
              {events.map((event, idx) => {
                const eventColors = {
                  click: 'bg-blue-100 text-blue-800',
                  scroll: 'bg-purple-100 text-purple-800',
                  form_submit: 'bg-green-100 text-green-800',
                  page_view: 'bg-orange-100 text-orange-800'
                };
                const colorClass = eventColors[event.event_name] || 'bg-gray-100 text-gray-800';
                
                return (
                  <div key={idx} className="p-4 hover:bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                            {event.event_name.replace('_', ' ')}
                          </span>
                          {event.element_text && (
                            <span className="text-xs text-gray-600">→ "{event.element_text}"</span>
                          )}
                          {event.scroll_depth && (
                            <span className="text-xs text-gray-600">→ {event.scroll_depth}% depth</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{event.page_title || 'Unknown Page'}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>🌐 {event.browser || 'Unknown'} • {event.operating_system || 'Unknown OS'}</span>
                          {(event.ip_city || event.ip_country) && (
                            <span>📍 {[event.ip_city, event.ip_country].filter(Boolean).join(', ')}</span>
                          )}
                          {event.time_on_page && (
                            <span>⏱️ {event.time_on_page}s on page</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500">{new Date(parseInt(event.event_timestamp)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
