/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { ProjectsScreen } from './components/screens/ProjectsScreen';
import { ProjectDetailScreen } from './components/screens/ProjectDetailScreen';
import { ScheduleScreen } from './components/screens/ScheduleScreen';
import { BudgetScreen } from './components/screens/BudgetScreen';
import { MaterialsScreen } from './components/screens/MaterialsScreen';
import { ProcurementScreen } from './components/screens/ProcurementScreen';
import { FieldReportsScreen } from './components/screens/FieldReportsScreen';
import { TeamScreen } from './components/screens/TeamScreen';
import { ReportsScreen } from './components/screens/ReportsScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';

const MainScreenRouter: React.FC = () => {
  const { currentScreen } = useApp();

  switch (currentScreen) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'projects':
      return <ProjectsScreen />;
    case 'project-detail':
      return <ProjectDetailScreen />;
    case 'schedule':
      return <ScheduleScreen />;
    case 'budget':
      return <BudgetScreen />;
    case 'materials':
      return <MaterialsScreen />;
    case 'procurement':
      return <ProcurementScreen />;
    case 'field-reports':
      return <FieldReportsScreen />;
    case 'team':
      return <TeamScreen />;
    case 'reports':
      return <ReportsScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <DashboardScreen />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppShell>
          <MainScreenRouter />
        </AppShell>
      </AppProvider>
    </AuthProvider>
  );
}
