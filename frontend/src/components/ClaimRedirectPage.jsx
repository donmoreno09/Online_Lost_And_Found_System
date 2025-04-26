import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import ClaimSuccessPage from '../pages/ClaimSuccessPage';

// Definisci API_URL qui, come negli altri file
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ClaimRedirectPage = ({ action }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [itemId, setItemId] = useState(null);
  
  useEffect(() => {
    const processToken = async () => {
      try {
        // Fai una richiesta al backend
        const endpoint = action === 'accept' 
          ? `/items/claim/accept/${token}` 
          : `/items/claim/reject/${token}`;
          
        const response = await axios.get(`${API_URL}${endpoint}`);
        
        if (response.data.success) {
          // Imposta il successo e l'ID dell'item
          setItemId(response.data.itemId);
          setSuccess(true);
          
          // Non facciamo il navigate direttamente, mostriamo il componente di successo
          // navigate(`/claim/success/${response.data.itemId}`);
        } else {
          setError(response.data.message || 'Token non valido');
        }
      } catch (err) {
        console.error('Errore elaborazione token:', err);
        setError(err.response?.data?.message || 'Si è verificato un errore');
      } finally {
        setLoading(false);
      }
    };
    
    processToken();
  }, [token, action, navigate]);
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Stiamo elaborando la tua richiesta...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Si è verificato un errore</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }
  
  // Se l'operazione ha avuto successo, mostra il componente di successo
  if (success && itemId) {
    return <ClaimSuccessPage id={itemId} />;
  }
  
  return null;
};

export default ClaimRedirectPage;