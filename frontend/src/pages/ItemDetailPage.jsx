import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ItemDetailPage = () => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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
    return new Date(dateString).toLocaleDateString('it-IT', options);
  };

  // Colore del badge in base al tipo di oggetto
  const getBadgeVariant = (type) => {
    return type === 'lost' ? 'danger' : 'success';
  };

  // Gestire il corretto URL delle immagini
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}/${imagePath.replace(/^\//, '')}`;
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

  // Controlla se l'utente è il proprietario dell'item
  const isOwner = user && user._id === (item.user && item.user._id);

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col lg={7}>
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
        </Col>
        <Col lg={5} className="d-flex justify-content-lg-end align-items-center">
          <Button 
            as={Link} 
            to="/" 
            variant="outline-primary"
            className="me-2"
          >
            Torna agli annunci
          </Button>
          
          {isOwner && (
            <Button 
              as={Link} 
              to={`/items/edit/${item._id}`} 
              variant="outline-secondary"
            >
              Modifica
            </Button>
          )}
        </Col>
      </Row>

      <Row>
        <Col lg={7}>
          {/* Immagine principale */}
          <Card className="mb-4 overflow-hidden">
            <div style={{ height: "400px", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" }}>
              {item.images && item.images.length > 0 ? (
                <img 
                  src={getImageUrl(item.images[0])} 
                  alt={item.title} 
                  style={{ 
                    maxHeight: "100%", 
                    maxWidth: "100%", 
                    objectFit: "contain" 
                  }}
                />
              ) : (
                <div className="text-center text-muted">
                  <i className="bi bi-card-image" style={{ fontSize: "5rem" }}></i>
                  <p>Nessuna immagine disponibile</p>
                </div>
              )}
            </div>
          </Card>
          
          {/* Galleria immagini aggiuntive */}
          {item.images && item.images.length > 1 && (
            <Row className="mb-4">
              {item.images.slice(1).map((image, index) => (
                <Col xs={3} key={index} className="mb-2">
                  <img 
                    src={getImageUrl(image)} 
                    alt={`Vista aggiuntiva ${index + 1}`} 
                    className="img-thumbnail" 
                    style={{ height: '80px', width: '100%', objectFit: 'cover' }}
                  />
                </Col>
              ))}
            </Row>
          )}
          
          {/* Descrizione */}
          <Card className="mb-4">
            <Card.Body>
              <h5>Descrizione</h5>
              <p className="mb-0">{item.description}</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={5}>
          {/* Posizione - MODIFICATA per rimuovere "area" */}
          <Card className="mb-4">
            <Card.Body>
              <h5>Posizione</h5>
              <p className="mb-0">
                <strong>Indirizzo:</strong> {item.location.address}<br />
                {item.location.city}, {item.location.state}
              </p>
            </Card.Body>
          </Card>
          
          {/* Informazioni di contatto - MODIFICATE per includere email e telefono */}
          <Card className="mb-4">
            <Card.Body>
              <h5>Informazioni di contatto</h5>
              {item.user && (
                <>
                  <p className="mb-2">
                    <strong>Nome:</strong> {item.user.firstName} {item.user.lastName}
                  </p>
                  
                  {item.user.email && (
                    <p className="mb-2">
                      <strong>Email:</strong> <a href={`mailto:${item.user.email}`}>{item.user.email}</a>
                    </p>
                  )}
                  
                  {item.user.phone && (
                    <p className="mb-0">
                      <strong>Telefono:</strong> <a href={`tel:${item.user.phone}`}>{item.user.phone}</a>
                    </p>
                  )}
                </>
              )}
              {(!item.user || (!item.user.email && !item.user.phone)) && (
                <p className="text-muted mb-0">Informazioni di contatto non disponibili</p>
              )}
            </Card.Body>
          </Card>
          
          {/* Stato */}
          <Card>
            <Card.Body>
              <h5>Stato</h5>
              <Badge 
                bg={item.status === 'open' ? 'info' : 
                    item.status === 'claimed' ? 'warning' : 
                    item.status === 'resolved' ? 'success' : 'secondary'}
                className="p-2"
              >
                {item.status === 'open' ? 'Aperto' : 
                 item.status === 'claimed' ? 'Reclamato' : 
                 item.status === 'resolved' ? 'Risolto' : 'Scaduto'}
              </Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ItemDetailPage;