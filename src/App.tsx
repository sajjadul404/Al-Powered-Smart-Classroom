/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformProvider, ROLE_ALLOWED_PAGES, usePlatform } from './context/PlatformContext';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer } from './components/ui/ToastContainer';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { AIHandRaisePage } from './pages/AIHandRaisePage';
import { AttendanceAccessPage } from './pages/AttendanceAccessPage';
import { CameraMonitoringPage } from './pages/CameraMonitoringPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeviceManagementPage } from './pages/DeviceManagementPage';
import { HistoryReportsPage } from './pages/HistoryReportsPage';
import { LoginPage } from './pages/LoginPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { OfflineSyncPage } from './pages/OfflineSyncPage';
import { RemoteConfigOTAPage } from './pages/RemoteConfigOTAPage';
import { SafetyEmergencyPage } from './pages/SafetyEmergencyPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentManagementPage } from './pages/StudentManagementPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { WeatherAnalyticsPage } from './pages/WeatherAnalyticsPage';
import { WifiCsiPage } from './pages/WifiCsiPage';

function PlatformRouter() {
  const { currentUser, activePage } = usePlatform();

  if (!currentUser) {
    return <LoginPage />;
  }

  const allowed = ROLE_ALLOWED_PAGES[currentUser.role];
  const safePage = allowed.includes(activePage) ? activePage : 'dashboard';

  const renderPage = () => {
    switch (safePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'users':
        return <UserManagementPage />;
      case 'students':
        return <StudentManagementPage />;
      case 'attendance':
        return <AttendanceAccessPage />;
      case 'safety':
        return <SafetyEmergencyPage />;
      case 'devices':
        return <DeviceManagementPage />;
      case 'remote-config':
        return <RemoteConfigOTAPage key="config" initialSection="config" />;
      case 'ota-updates':
        return <RemoteConfigOTAPage key="ota" initialSection="ota" />;
      case 'camera':
        return <CameraMonitoringPage />;
      case 'hand-raise':
        return <AIHandRaisePage />;
      case 'wifi-csi':
        return <WifiCsiPage />;
      case 'weather-analytics':
        return <WeatherAnalyticsPage />;
      case 'history-reports':
        return <HistoryReportsPage />;
      case 'ai-assistant':
        return <AIAssistantPage />;
      case 'offline-sync':
        return <OfflineSyncPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <AppShell>{renderPage()}</AppShell>;
}

export default function App() {
  return (
    <PlatformProvider>
      <PlatformRouter />
      <ToastContainer />
    </PlatformProvider>
  );
}
