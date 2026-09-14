/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBrowserRouter, RouterProvider, ScrollRestoration } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { RealityDetail } from './pages/RealityDetail';
import { MyRealities } from './pages/MyRealities';
import { Search } from './pages/Search';
import { Settings } from './pages/Settings';
import { Upgrade } from './pages/Upgrade';
import { storage } from './services/storage';
import { AuthProvider } from './contexts/AuthContext';
import { analytics } from './lib/analytics';
import { initReferral } from './lib/referral';

// Initialize local storage
storage.init();
analytics.track('app_opened');
initReferral();

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <ScrollRestoration />
        <Layout />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "explore", element: <Explore /> },
      { path: "reality/:id", element: <RealityDetail /> },
      { path: "my-realities", element: <MyRealities /> },
      { path: "search", element: <Search /> },
      { path: "settings", element: <Settings /> },
      { path: "upgrade", element: <Upgrade /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
