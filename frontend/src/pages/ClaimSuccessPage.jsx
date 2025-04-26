import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ClaimSuccessPage = () => {
  const { id } = useParams();

  return (
    <Container className="py-5 text-center">
      <Alert variant="success" className="mb-4">
        <Alert.Heading>Richiesta inviata con successo!</Alert.Heading>
        <p>
          La tua richiesta è stata inviata al proprietario dell'oggetto. 
          Riceverai una notifica via email quando il proprietario risponderà.
        </p>
      </Alert>
      
      <div>
        <Button as={Link} to={`/items/${id}`} variant="outline-primary" className="me-2">
          Torna ai dettagli dell'oggetto
        </Button>
        <Button as={Link} to="/" variant="primary">
          Torna alla home
        </Button>
      </div>
    </Container>
  );
};

export default ClaimSuccessPage;