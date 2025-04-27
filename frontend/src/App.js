import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MyItemsPage from './pages/MyItemsPage';
import CreateItemPage from './pages/CreateItemPage';
import ItemDetailPage from './pages/ItemDetailPage';
import EditItemPage from './pages/EditItemPage';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import ClaimSuccessPage from './pages/ClaimSuccessPage';
import ClaimAcceptedPage from './pages/ClaimAcceptedPage';
import ClaimRefusedPage from './pages/ClaimRefusedPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Container className="main-content py-4">
          <Routes>
            {/* Route pubbliche */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            
            {/* Route per le pagine di reclamo */}
            <Route path="/claim/success/:id" element={<ClaimSuccessPage />} />
            <Route path="/claim/accept/:token" element={<ClaimAcceptedPage />} />
            <Route path="/claim/reject/:token" element={<ClaimRefusedPage />} />
            
            {/* Route protette */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-items" element={<MyItemsPage />} />
              <Route path="/create-item" element={<CreateItemPage />} />
              <Route path="/items/edit/:id" element={<EditItemPage />} />
            </Route>
          </Routes>
        </Container>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;