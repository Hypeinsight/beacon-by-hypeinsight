import { useEffect, useState } from 'react';
import { Users, Building2, TrendingUp, Clock, MousePointer, FileText, ExternalLink } from 'lucide-react';
import axios from 'axios';

export default function Overview() {
  const [stats, setStats] = useState({
    totalVisitors: 0,
    pageViews: 0,
    clicks: 0,
    forms: 0
  });
  const [topPages, setTopPages] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${API_URL}/api/debug/events`);
      setStats({
        totalVisitors: response.data.visitors || 0,
        pageViews: response.data.pageViews || 0,
        clicks: response.data.clicks || 0,
        forms: response.data.forms || 0
      });

      // Aggregate top pages from events
      const events = response.data.events || [];
      const pageMap = {};
      events.forEach(e => {
        if (e.page_title) {
          pageMap[e.page_title] = (pageMap[e.page_title] || 0) + 1;
        }
      });
      const pages = Object.entries(pageMap)
        .map(([title, views]) => ({ title, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
      setTopPages(pages);

      // Aggregate top companies
      const companyMap = {};
      events.forEach(e => {
        if (e.ip_company_name) {
          companyMap[e.ip_company_name] = (companyMap[e.ip_company_name] || 0) + 1;
        }
      });
      const companies = Object.entries(companyMap)
        .map(([name, visits]) => ({ name, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5);
      setTopCompanies(companies);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Visitors', value: stats.totalVisitors, icon: Users, color: '#46B646' },
    { label: 'Page Views', value: stats.pageViews, icon: FileText, color: '#00A9BA' },
    { label: 'Clicks', value: stats.clicks, icon: MousePointer, color: '#FFCB2B' },
    { label: 'Form Submits', value: stats.forms, icon: TrendingUp, color: '#46B646' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading analytics...</div>
    </div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Overview</h1>
        <p className="mt-2 text-gray-600">Aggregate visitor behavior and site performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="p-6 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="mt-2 text-4xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${stat.color}20` }}>
                <stat.icon className="w-7 h-7" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" style={{ color: '#46B646' }} />
              Top Pages
            </h2>
          </div>
          <div className="p-6">
            {topPages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No page data yet</p>
            ) : (
              <div className="space-y-4">
                {topPages.map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{page.title}</p>
                      <p className="text-sm text-gray-500">{page.views} views</p>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(page.views / topPages[0].views) * 100}%`,
                          backgroundColor: '#46B646'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Companies (B2B Visitors) */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2" style={{ color: '#00A9BA' }} />
              Top Companies
            </h2>
          </div>
          <div className="p-6">
            {topCompanies.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No company data yet<br/>
                <span className="text-xs">Requires IPinfo API with company identification</span>
              </p>
            ) : (
              <div className="space-y-4">
                {topCompanies.map((company, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00A9BA20' }}>
                        <span className="font-bold" style={{ color: '#00A9BA' }}>#{idx + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{company.name}</p>
                        <p className="text-sm text-gray-500">{company.visits} visits</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Traffic Sources & Technology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" style={{ color: '#FFCB2B' }} />
              Traffic Sources
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#46B646' }} />
                <span className="text-sm font-medium text-gray-900">Direct Traffic</span>
              </div>
              <span className="text-sm text-gray-600">Track UTM parameters</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00A9BA' }} />
                <span className="text-sm font-medium text-gray-900">Referrals</span>
              </div>
              <span className="text-sm text-gray-600">External links</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFCB2B' }} />
                <span className="text-sm font-medium text-gray-900">Social Media</span>
              </div>
              <span className="text-sm text-gray-600">Facebook, LinkedIn, etc.</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#666' }} />
                <span className="text-sm font-medium text-gray-900">Google Ads</span>
              </div>
              <span className="text-sm text-gray-600">Track gclid, fbclid</span>
            </div>
            <p className="text-xs text-gray-400 mt-4">💡 Real traffic breakdown coming soon</p>
          </div>
        </div>

        {/* Visitor Technology */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Visitor Technology</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Browsers</p>
                <p className="text-sm text-gray-500">Chrome • Firefox • Safari • Edge</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Devices</p>
                <p className="text-sm text-gray-500">Desktop • Mobile • Tablet</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Operating Systems</p>
                <p className="text-sm text-gray-500">Windows • macOS • Linux • iOS • Android</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">💡 Detailed breakdowns coming in next update</p>
          </div>
        </div>

      </div>

    </div>
  );
}
