import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/app-shell';
import MapPage from '@/pages/map-page';
import MapScenarioPage from '@/pages/map-scenario-page';
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
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="map/scenario" element={<MapScenarioPage />} />
          {/* Legacy routes redirect to the unified scenario screen */}
          <Route path="map/selection" element={<Navigate to="/map/scenario" replace />} />
          <Route path="map/configure" element={<Navigate to="/map/scenario" replace />} />
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
