import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from './components/RootLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Loader from './components/Loader.jsx';
import Home from './pages/Home.jsx';

// Lazy-loaded route modules
const About = lazy(() => import('./pages/About.jsx'));
const ProductsList = lazy(() => import('./pages/ProductsList.jsx'));
const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Signup = lazy(() => import('./pages/Signup.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  return (
    <Suspense fallback={<Loader fullPage message="Loading route module..." />}>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />

          {/* Catalog routes (supports both /products and /items) */}
          <Route path="products" element={<ProductsList />} />
          <Route path="items" element={<ProductsList />} />

          {/* Dynamic item detail routes */}
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="items/:id" element={<ProductDetails />} />

          {/* Analytics Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Authentication & Protected Profile routes */}
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Custom 404 catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
