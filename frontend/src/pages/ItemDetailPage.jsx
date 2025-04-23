import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ItemDetailPage = () => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const { user } = useAuth();

  const fetchItemDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/items/${id}`);
      
      if (response.data.success) {
        setItem(response.data.data);
        setError('');
      } else {
        setError('Impossibile caricare i dettagli dell\'oggetto');
      }
    } catch (err) {
      console.error('Errore caricamento dettagli oggetto:', err);
      setError('Oggetto non trovato o errore di caricamento');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);

  // Formatta la data
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Colore del badge in base al tipo di oggetto
  const getBadgeVariant = (type) => {
    return type === 'lost' ? 'danger' : 'success';
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to="/" variant="primary">Torna alla Home</Button>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Oggetto non trovato</Alert>
        <Button as={Link} to="/" variant="primary">Torna alla Home</Button>
      </Container>
    );
  }

  // Immagine di default se non ce ne sono
  const imageUrl = item.images && item.images.length > 0 
    ? item.images[0] 
    : 'https://via.placeholder.com/600x400?text=Nessuna+Immagine';

  return (
    <Container className="py-5">
      <Row>
        <Col lg={7}>
          <img 
            src={imageUrl} 
            alt={item.title} 
            className="img-fluid rounded" 
            style={{ maxHeight: '500px', width: '100%', objectFit: 'cover' }}
          />
          
          {/* Galleria immagini aggiuntive */}
          {item.images && item.images.length > 1 && (
            <Row className="mt-3">
              {item.images.slice(1).map((image, index) => (
                <Col xs={3} key={index}>
                  <img 
                    src={image} 
                    alt={`Vista aggiuntiva ${index + 1}`} 
                    className="img-fluid rounded" 
                    style={{ height: '100px', width: '100%', objectFit: 'cover', cursor: 'pointer' }}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Col>
        
        <Col lg={5}>
          <div className="d-flex align-items-center mb-3">
            <Badge bg={getBadgeVariant(item.type)} className="me-2 p-2">
              {item.type === 'lost' ? 'OGGETTO SMARRITO' : 'OGGETTO TROVATO'}
            </Badge>
            <Badge bg="secondary">{item.category}</Badge>
          </div>
          
          <h1 className="mb-3">{item.title}</h1>
          
          <p className="text-muted">
            {item.type === 'lost' ? 'Smarrito il' : 'Trovato il'}: {formatDate(item.date)}
          </p>
          
          <Card className="mb-4">
            <Card.Body>
              <h5>Descrizione</h5>
              <p>{item.description}</p>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Body>
              <h5>Posizione</h5>
              <p className="mb-1"><strong>Indirizzo:</strong> {item.location.address}</p>
              <p className="mb-0"><strong>Area:</strong> {item.location.city}, {item.location.state}</p>
            </Card.Body>
          </Card>
          
          {item.user && (
            <Card className="mb-4">
              <Card.Body>
                <h5>Informazioni di contatto</h5>
                <p className="mb-1"><strong>Pubblicato da:</strong> {item.user.firstName} {item.user.lastName}</p>
                
                {/* Mostra opzioni di modifica se l'utente è il proprietario */}
                {user && item.user._id === user._id && (
                  <div className="mt-3">
                    <Button 
                      as={Link} 
                      to={`/items/edit/${item._id}`} 
                      variant="outline-primary" 
                      className="me-2"
                    >
                      Modifica
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
          
          <Button 
            as={Link} 
            to="/" 
            variant="secondary"
          >
            Torna agli annunci
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default ItemDetailPage;