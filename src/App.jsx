/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformProvider, ROLE_ALLOWED_PAGES, usePlatform } from './context/PlatformContext.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { ToastContainer } from './components/ui/ToastContainer.jsx';
import { AIAssistantPage } from './pages/AIAssistantPage.jsx';
import { AIHandRaisePage } from './pages/AIHandRaisePage.jsx';
import { AttendanceAccessPage } from './pages/AttendanceAccessPage.jsx';
import { CameraMonitoringPage } from './pages/CameraMonitoringPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { DeviceManagementPage } from './pages/DeviceManagementPage.jsx';
import { HistoryReportsPage } from './pages/HistoryReportsPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { OfflineSyncPage } from './pages/OfflineSyncPage.jsx';
import { RemoteConfigOTAPage } from './pages/RemoteConfigOTAPage.jsx';
import { SafetyEmergencyPage } from './pages/SafetyEmergencyPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { StudentManagementPage } from './pages/StudentManagementPage.jsx';
import { UserManagementPage } from './pages/UserManagementPage.jsx';
import { WeatherAnalyticsPage } from './pages/WeatherAnalyticsPage.jsx';
import { WifiCsiPage } from './pages/WifiCsiPage.jsx';

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
