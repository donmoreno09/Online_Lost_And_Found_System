import React, { useState, useEffect } from 'react';
import { Container, Alert, Button, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ClaimRefusedPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const refuseClaim = async () => {
      try {
        setLoading(true);
        const response = await axios.put(`${API_URL}/items/claim/reject/${token}`);
        
        if (response.data.success) {
          setSuccess(true);
        } else {
          setError('Si è verificato un errore durante il rifiuto della richiesta.');
        }
      } catch (err) {
        console.error('Errore rifiuto richiesta:', err);
        setError(err.response?.data?.message || 'Si è verificato un errore durante il rifiuto della richiesta.');
      } finally {
        setLoading(false);
      }
    };

    refuseClaim();
  }, [token]);

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
      <Alert variant="info" className="mb-4">
        <Alert.Heading>Richiesta rifiutata</Alert.Heading>
        <p>
          Hai rifiutato la richiesta per il tuo oggetto. 
          Abbiamo inviato un'email alla persona che ha reclamato l'oggetto per informarla.
          L'oggetto è stato riportato allo stato "Disponibile" e può essere reclamato da altri utenti.
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

export default ClaimRefusedPage;