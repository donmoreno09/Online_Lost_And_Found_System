import React, { useEffect, useState } from 'react';
import { Container, Alert, Button, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ClaimAcceptedPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [item, setItem] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se l'utente è autenticato
    if (!isAuthenticated) {
      // Salva il token nel localStorage per recuperarlo dopo il login
      localStorage.setItem('pendingClaimToken', token);
      localStorage.setItem('pendingClaimAction', 'accept');
      
      // Reindirizza alla pagina di login
      navigate(`/login?returnUrl=/claim/accept/${token}`);
      return;
    }
    
    const acceptClaim = async () => {
      try {
        setLoading(true);
        const response = await axios.put(`${API_URL}/items/claim/accept/${token}`);
        
        if (response.data.success) {
          setItem(response.data.item);
        } else {
          setError('Si è verificato un errore durante l\'accettazione della richiesta.');
        }
      } catch (err) {
        console.error('Errore accettazione richiesta:', err);
        setError(err.response?.data?.message || 'Si è verificato un errore durante l\'accettazione della richiesta.');
      } finally {
        setLoading(false);
      }
    };

    acceptClaim();
  }, [token, isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Non renderizzare nulla durante il reindirizzamento
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Stiamo elaborando la tua richiesta...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Errore</Alert.Heading>
          <p>{error}</p>
        </Alert>
        <Button as={Link} to="/" variant="primary">
          Torna alla home
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5 text-center">
      <Alert variant="success" className="mb-4">
        <Alert.Heading>Richiesta Accettata!</Alert.Heading>
        <p>
          Hai accettato la richiesta per il tuo oggetto.
          Abbiamo inviato un'email con i tuoi dati di contatto alla persona che ha reclamato l'oggetto.
        </p>
      </Alert>
      
      <div>
        <Button as={Link} to="/" variant="primary" className="me-2">
          Torna alla home
        </Button>
        <Button as={Link} to="/my-items" variant="outline-primary">
          I miei oggetti
        </Button>
      </div>
    </Container>
  );
};

export default ClaimAcceptedPage;