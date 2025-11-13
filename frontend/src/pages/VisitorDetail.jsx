import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Globe, Monitor, MapPin, Clock, MousePointer, FileText, Scroll, FormInput, ExternalLink, Building2, AlertCircle, User } from 'lucide-react';
import axios from '../lib/axios';

export default function VisitorDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisitorData();
  }, [clientId]);

  const loadVisitorData = async () => {
    try {
      const response = await axios.get('/api/debug/events');
      const events = response.data.events || [];
      
      // Find all events for this visitor
      const visitorEvents = events.filter(e => e.client_id === clientId);
      
      if (visitorEvents.length > 0) {
        const first = visitorEvents[0];
        // Get traffic source from first page_view event
        const firstPageView = visitorEvents.find(e => e.event_name === 'page_view') || first;
        setVisitor({
          clientId,
          browser: first.browser,
          os: first.operating_system,
          country: first.ip_country,
          city: first.ip_city,
          company: first.ip_company_name,
          sessionNumber: first.session_number || 1,
          isFirstVisit: first.is_first_visit || false,
          // Last touch (current)
          utmSource: firstPageView.properties?.utm_source,
          utmMedium: firstPageView.properties?.utm_medium,
          utmCampaign: firstPageView.properties?.utm_campaign,
          referrer: firstPageView.properties?.page_referrer,
          // First touch (original)
          firstUtmSource: firstPageView.properties?.first_utm_source,
          firstUtmMedium: firstPageView.properties?.first_utm_medium,
          firstUtmCampaign: firstPageView.properties?.first_utm_campaign,
          firstReferrer: firstPageView.properties?.first_referrer,
          events: visitorEvents.sort((a, b) => a.event_timestamp - b.event_timestamp)
        });
      }
    } catch (error) {
      console.error('Error loading visitor:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventName) => {
    switch(eventName) {
      case 'click': return MousePointer;
      case 'scroll': return Scroll;
      case 'form_submit': return FormInput;
      case 'form_error': return AlertCircle;
      case 'page_view': return FileText;
      default: return Clock;
    }
  };

  const getEventColor = (eventName) => {
    switch(eventName) {
      case 'click': return '#46B646';
      case 'scroll': return '#00A9BA';
      case 'form_submit': return '#FFCB2B';
      case 'form_error': return '#ef4444';
      case 'page_view': return '#46B646';
      default: return '#666';
    }
  };

  const classifyTrafficSource = (utmSource, utmMedium, referrer, referrerHostname) => {
    // Paid campaigns (UTM with cpc, paid, or ad campaign)
    if (utmMedium && ['cpc', 'ppc', 'paid', 'paidsearch'].includes(utmMedium.toLowerCase())) {
      return { type: 'Paid Search', detail: utmSource || 'Unknown' };
    }
    if (utmMedium && ['display', 'banner', 'cpm'].includes(utmMedium.toLowerCase())) {
      return { type: 'Display Ads', detail: utmSource || 'Unknown' };
    }
    if (utmMedium && ['social', 'social-paid'].includes(utmMedium.toLowerCase())) {
      return { type: 'Paid Social', detail: utmSource || 'Unknown' };
    }
    
    // Organic with UTM (campaigns)
    if (utmSource && !utmMedium) {
      return { type: 'Campaign', detail: utmSource };
    }
    if (utmMedium && utmMedium.toLowerCase() === 'organic') {
      return { type: 'Organic Search', detail: utmSource || 'Unknown' };
    }
    if (utmMedium && ['email', 'newsletter'].includes(utmMedium.toLowerCase())) {
      return { type: 'Email', detail: utmSource || 'Unknown' };
    }
    
    // Referral traffic
    if (referrer && referrerHostname) {
      const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu'];
      if (searchEngines.some(engine => referrerHostname.includes(engine))) {
        return { type: 'Organic Search', detail: referrerHostname };
      }
      return { type: 'Referral', detail: referrerHostname };
    }
    
    // Direct traffic (no referrer, no UTMs)
    return { type: 'Direct', detail: 'Type-in or bookmark' };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading visitor data...</div>
    </div>;
  }

  if (!visitor) {
    return <div className="text-center py-12">
      <p className="text-gray-500">Visitor not found</p>
      <button onClick={() => navigate('/visitors')} className="mt-4 text-blue-600 hover:underline">
        Back to Visitors
      </button>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate('/visitors')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Visitors
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {visitor.company || 'Anonymous Visitor'}
            </h1>
            <p className="mt-2 text-gray-600">Client ID: {visitor.clientId}</p>
          </div>
        </div>
      </div>

      {/* Visitor Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Globe className="w-4 h-4 mr-2" />
            Location
          </div>
          <p className="font-medium text-gray-900">
            {[visitor.city, visitor.country].filter(Boolean).join(', ') || 'Unknown'}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Building2 className="w-4 h-4 mr-2" />
            Company
          </div>
          <p className="font-medium text-gray-900">{visitor.company || <span className="text-gray-400 italic">Unknown</span>}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Monitor className="w-4 h-4 mr-2" />
            Browser
          </div>
          <p className="font-medium text-gray-900">{visitor.browser || 'Unknown'}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Monitor className="w-4 h-4 mr-2" />
            OS
          </div>
          <p className="font-medium text-gray-900">{visitor.os || 'Unknown'}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Clock className="w-4 h-4 mr-2" />
            Total Events
          </div>
          <p className="font-medium text-gray-900">{visitor.events.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border-2" style={{ borderColor: visitor.sessionNumber === 1 ? '#46B646' : '#FFCB2B' }}>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <User className="w-4 h-4 mr-2" />
            Visitor Status
          </div>
          <p className="font-medium text-gray-900">
            {visitor.sessionNumber === 1 ? (
              <span style={{ color: '#46B646' }}>🆕 New Visitor</span>
            ) : (
              <span style={{ color: '#FFCB2B' }}>Session #{visitor.sessionNumber}</span>
            )}
          </p>
          {visitor.isFirstVisit && (
            <p className="text-xs text-gray-500">First visit ever</p>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg border-2" style={{ borderColor: visitor.utmSource ? '#FFCB2B' : '#e5e7eb' }}>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Traffic Source
          </div>
          {(() => {
            const source = classifyTrafficSource(visitor.utmSource, visitor.utmMedium, visitor.referrer, visitor.properties?.referrer_hostname);
            return (
              <>
                <p className="font-medium text-gray-900">{source.type}</p>
                <p className="text-xs text-gray-500">{source.detail}</p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Attribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Touch Attribution */}
        {(visitor.firstUtmSource || visitor.firstReferrer) && (() => {
          const source = classifyTrafficSource(visitor.firstUtmSource, visitor.firstUtmMedium, visitor.firstReferrer, visitor.firstReferrerHostname);
          return (
            <div className="bg-white p-6 rounded-lg border-2" style={{ borderColor: '#46B646' }}>
              <div className="flex items-center mb-3">
                <ExternalLink className="w-5 h-5 mr-2" style={{ color: '#46B646' }} />
                <h3 className="text-lg font-semibold text-gray-900">Original Source</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">How they first found you</p>
              <div className="mb-3">
                <p className="text-2xl font-bold" style={{ color: '#46B646' }}>{source.type}</p>
                <p className="text-sm text-gray-600">{source.detail}</p>
              </div>
              {visitor.firstUtmCampaign && (
                <p className="text-sm text-gray-600">
                  <strong>Campaign:</strong> {visitor.firstUtmCampaign}
                </p>
              )}
            </div>
          );
        })()}
        
        {/* Last Touch Attribution */}
        {(visitor.utmSource || visitor.utmMedium || visitor.utmCampaign || visitor.referrer) && (() => {
          const source = classifyTrafficSource(visitor.utmSource, visitor.utmMedium, visitor.referrer, visitor.properties?.referrer_hostname);
          return (
            <div className="bg-white p-6 rounded-lg border-2" style={{ borderColor: '#FFCB2B' }}>
              <div className="flex items-center mb-3">
                <ExternalLink className="w-5 h-5 mr-2" style={{ color: '#FFCB2B' }} />
                <h3 className="text-lg font-semibold text-gray-900">Current Source</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Most recent visit source</p>
              <div className="mb-3">
                <p className="text-2xl font-bold" style={{ color: '#FFCB2B' }}>{source.type}</p>
                <p className="text-sm text-gray-600">{source.detail}</p>
              </div>
              {visitor.utmCampaign && (
                <p className="text-sm text-gray-600">
                  <strong>Campaign:</strong> {visitor.utmCampaign}
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Session Timeline */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: '#02202E' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'white' }}>Session Timeline</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {visitor.events.map((event, idx) => {
              const Icon = getEventIcon(event.event_name);
              const color = getEventColor(event.event_name);
              const time = new Date(parseInt(event.event_timestamp)).toLocaleTimeString();
              
              return (
                <div key={idx} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    {idx < visitor.events.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 my-1" />
                    )}
                  </div>
                  
                  {/* Event details */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span 
                          className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {event.event_name.replace('_', ' ')}
                        </span>
                        <span className="ml-3 text-sm text-gray-500">{time}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="font-medium text-gray-900">{event.page_title || 'Unknown Page'}</p>
                      
                      {event.element_text && (
                        <p className="text-sm text-gray-600">
                          <strong>Clicked:</strong> "{event.element_text}"
                        </p>
                      )}
                      
                      {event.scroll_depth && (
                        <p className="text-sm text-gray-600">
                          <strong>Scroll Depth:</strong> {event.scroll_depth}%
                        </p>
                      )}
                      
                      {event.time_on_page && (
                        <p className="text-sm text-gray-600">
                          <strong>Time on Page:</strong> {event.time_on_page}s
                        </p>
                      )}
                      
                      {event.event_name === 'form_error' && event.properties?.error_messages && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-semibold text-red-800 mb-1">Form Validation Errors:</p>
                          <p className="text-sm text-red-700">{event.properties.error_messages}</p>
                          {event.properties.invalid_field_count && (
                            <p className="text-xs text-red-600 mt-1">
                              {event.properties.invalid_field_count} field(s) invalid
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
