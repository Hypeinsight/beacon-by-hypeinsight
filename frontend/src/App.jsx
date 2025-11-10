import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Overview';
import Visitors from './pages/Visitors';
import VisitorDetail from './pages/VisitorDetail';
import Companies from './pages/Companies';
import Setup from './pages/Setup';

function App() {  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="visitors" element={<Visitors />} />
          <Route path="visitors/:clientId" element={<VisitorDetail />} />
          <Route path="companies" element={<Companies />} />
          <Route path="setup" element={<Setup />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
