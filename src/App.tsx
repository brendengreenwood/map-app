import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/app-shell';
import MapPage from '@/pages/map-page';
import MapSelectionPage from '@/pages/map-selection-page';
import MapConfigurePage from '@/pages/map-configure-page';
import DashboardPage from '@/pages/dashboard-page';
import ProducersPage from '@/pages/producers-page';
import CompetitorsPage from '@/pages/competitors-page';
import SettingsPage from '@/pages/settings-page';
import AdminPage from '@/pages/admin-page';
import BidManagementPage from '@/pages/bid-management-page';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Map is immersive — no shell chrome */}
        <Route path="map" element={<MapPage />} />
        <Route path="map/selection" element={<MapSelectionPage />} />
        <Route path="map/configure" element={<MapConfigurePage />} />

        {/* Everything else gets sidebar + top bar */}
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="producers" element={<ProducersPage />} />
          <Route path="competitors" element={<CompetitorsPage />} />
          <Route path="bids" element={<BidManagementPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
