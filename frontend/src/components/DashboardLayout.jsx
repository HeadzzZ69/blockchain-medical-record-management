import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';

export default function DashboardLayout({ role, children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar role={role} />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          <ErrorBoundary isDashboardScope={true} dashboardPath={`/${role}`}>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
