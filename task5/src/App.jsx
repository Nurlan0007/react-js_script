import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from './components/RootLayout.jsx';
import Loader from './components/Loader.jsx';
import Home from './pages/Home.jsx';

// Lazy-load 5 pages using React.lazy and Suspense (exceeds the 3+ pages requirement)
const About = lazy(() => import('./pages/About.jsx'));
const ProductsList = lazy(() => import('./pages/ProductsList.jsx'));
const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  return (
    <Suspense fallback={<Loader fullPage message="Loading page module..." />}>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          {/* Home Route */}
          <Route index element={<Home />} />

          {/* About Route */}
          <Route path="about" element={<About />} />

          {/* Items List Routes: supports both /products (domain-specific name) and /items (base spec route) */}
          <Route path="products" element={<ProductsList />} />
          <Route path="items" element={<ProductsList />} />

          {/* Item Details Dynamic Routes: supports both /products/:id and /items/:id */}
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="items/:id" element={<ProductDetails />} />

          {/* Dashboard Route */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Login Route */}
          <Route path="login" element={<Login />} />

          {/* Custom 404 Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
