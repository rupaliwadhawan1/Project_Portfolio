import React, { Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { Intro } from './components/Intro';
import Dashboard from './components/Dashboard';

// Lazy loaded components
const Map = React.lazy(() => import('./pages/Map'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Forecast = React.lazy(() => import('./pages/Forecast'));
const Settings = React.lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

function App() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        {showIntro ? (
          <Intro onComplete={() => setShowIntro(false)} />
        ) : (
          <BrowserRouter>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/map" element={<Map />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/forecast" element={<Forecast />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Layout>
          </BrowserRouter>
        )}
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;