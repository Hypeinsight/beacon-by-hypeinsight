import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Settings, LogOut, Zap, Sparkles, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Overview', href: '/overview', icon: LayoutDashboard },
    { name: 'Visitors', href: '/visitors', icon: Users },
    { name: 'Companies', href: '/companies', icon: Building2 },
    { name: 'Scoring', href: '/scoring', icon: Award },
    { name: 'Event Builder', href: '/event-builder', icon: Sparkles },
    { name: 'Integrations', href: '/integrations', icon: Zap },
    { name: 'Setup', href: '/setup', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 border-r" style={{ backgroundColor: '#02202E', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center h-16 px-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <img src="/beacon-logo.png" alt="Beacon Logo" className="h-12 object-contain" />
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors`
              }
              style={({ isActive }) => isActive ? {
                backgroundColor: '#46B646',
                color: 'white',
                boxShadow: '0 4px 16px rgba(70,182,70,0.3)'
              } : {
                color: 'rgba(255,255,255,0.7)'
              }}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg"
            style={{ backgroundColor: '#0f2d3a', color: 'rgba(255,255,255,0.9)' }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#103645'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0f2d3a'; }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
