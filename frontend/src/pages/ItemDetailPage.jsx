import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Importa il componente ClaimSuccessPage all'inizio del file
import ClaimSuccessPage from './ClaimSuccessPage';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ItemDetailPage = () => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const { user } = useAuth();
  
  // Stato per il modale delle immagini
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  // Aggiungi questi stati all'inizio del componente
  const [showClaimModal, setShowClaimModal] = useState(false);
  // Modifica la modalità in cui inizializziamo claimFormData
  const [claimFormData, setClaimFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // All'inizio del componente, aggiungi questo stato
  const [showSuccessPage, setShowSuccessPage] = useState(false);

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
  
  // Aggiungi questo useEffect per debug temporaneo
  useEffect(() => {
    if (item && item.user) {
      console.log('Dati utente ricevuti:', item.user);
    }
  }, [item]);

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
  
  // Funzione per aprire il modale con l'immagine selezionata
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowModal(true);
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

  // Correggi la tua funzione handleClaimItem esistente

  // Invece di:
  // const handleClaimItem = () => {
  //   setShowClaimModal(true);
  // };

  // Modifica con questa implementazione che include entrambe le funzionalità:
  const handleClaimItem = () => {
    if (!user) {
      // Se l'utente non è loggato, reindirizza alla pagina di login
      alert("Per reclamare un oggetto devi prima effettuare l'accesso.");
      return;
    }
    
    // Popola il form con i dati dell'utente dal contesto auth
    setClaimFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      message: ''
    });
    
    // Apri il modal con il form
    setShowClaimModal(true);
  };

  // Aggiungi questa funzione per gestire i cambiamenti nel form
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setClaimFormData({
      ...claimFormData,
      [name]: value
    });
  };

  // Aggiungi questa funzione per validare il form
  const validateForm = () => {
    const errors = {};
    
    if (!claimFormData.firstName.trim()) errors.firstName = "Il nome è richiesto";
    if (!claimFormData.lastName.trim()) errors.lastName = "Il cognome è richiesto";
    if (!claimFormData.email.trim()) errors.email = "L'email è richiesta";
    if (!claimFormData.email.includes('@')) errors.email = "Email non valida";
    if (!claimFormData.message.trim()) errors.message = "Per favore, inserisci un messaggio per il proprietario";
    
    return errors;
  };

  // Aggiungi questa funzione per gestire l'invio del form
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    
    // Validazione
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setLoading(true);
      
      // Log dei dati inviati (per debug)
      console.log('Invio dati reclamo:', claimFormData);
      
      const response = await axios.post(
        `${API_URL}/items/${item._id}/claim`,
        claimFormData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('Risposta server:', response.data);
      
      if (response.data.success) {
        setShowClaimModal(false);
        // Invece dell'alert, mostra il componente di successo
        setShowSuccessPage(true);
        // Aggiorna l'item per riflettere il nuovo stato
        fetchItemDetails();
      } else {
        alert(response.data.message || 'Si è verificato un errore durante la richiesta.');
      }
    } catch (err) {
      console.error('Errore durante la richiesta di reclamo:', err);
      alert(err.response?.data?.message || 'Si è verificato un errore. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Modifica il return statement per includere il componente ClaimSuccessPage
  // Aggiungi questa condizione prima del return principale
  if (showSuccessPage) {
    return <ClaimSuccessPage id={item._id} />;
  }

  // Il resto del return statement rimane invariato
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

              className="me-2"
            >
              Modifica
            </Button>
          )}
          
          {/* Bottone Reclama - visibile solo per utenti loggati che non sono proprietari e se l'annuncio è aperto */}
          {user && !isOwner && item.status === 'available' && (
            <Button 
              variant={item.type === 'lost' ? 'success' : 'info'}
              onClick={handleClaimItem}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Attendere...</span>
                </>
              ) : (
                item.type === 'lost' ? 'Ho trovato questo oggetto!' : 'Questo oggetto è mio!'
              )}
            </Button>
          )}
        </Col>
      </Row>

      <Row>
        <Col lg={7}>
          {/* Immagine principale - MODIFICATA PER ESSERE CLICCABILE */}
          <Card className="mb-4 overflow-hidden">
            <div 
              style={{ 
                height: "400px", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                backgroundColor: "#f8f9fa",
                cursor: item.images && item.images.length > 0 ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (item.images && item.images.length > 0) {
                  handleImageClick(getImageUrl(item.images[0]));
                }
              }}
            >
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
          
          {/* Galleria immagini aggiuntive - MODIFICATA PER ESSERE CLICCABILE */}
          {item.images && item.images.length > 1 && (
            <Row className="mb-4">
              {item.images.slice(1).map((image, index) => (
                <Col xs={3} key={index} className="mb-2">
                  <img 
                    src={getImageUrl(image)} 
                    alt={`Vista aggiuntiva ${index + 1}`} 
                    className="img-thumbnail" 
                    style={{ 
                      height: '80px', 
                      width: '100%', 
                      objectFit: 'cover',
                      cursor: 'pointer' 
                    }}
                    onClick={() => handleImageClick(getImageUrl(image))}
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
          {/* Posizione - Soluzione semplificata e definitiva */}
          <Card className="mb-4">
            <Card.Body>
              <h5>Posizione</h5>
              {(() => {
                // Debug per verificare i dati
                console.log("Location data:", item.location);
                
                if (item.location && (item.location.address || item.location.city || item.location.state)) {
                  return (
                    <>
                      {item.location.address && (
                        <p className="mb-2">
                          <strong>Indirizzo:</strong> {item.location.address}
                        </p>
                      )}
                      <p className="mb-0">
                        {item.location.city || ''}{item.location.city && item.location.state ? ', ' : ''}{item.location.state || ''}
                      </p>
                    </>
                  );
                } else {
                  return <p className="text-muted mb-0">Informazioni sulla posizione non disponibili</p>;
                }
              })()}
            </Card.Body>
          </Card>
          
          {/* Informazioni di contatto */}
          <Card className="mb-4">
            <Card.Body>
              <h5>Informazioni di contatto</h5>
              {item.user ? (
                <>
                  <p className="mb-2">
                    <strong>Nome:</strong> {item.user.firstName || ''} {item.user.lastName || ''}
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
              ) : (
                <p className="text-muted mb-0">Informazioni di contatto non disponibili</p>
              )}
            </Card.Body>
          </Card>
          
          {/* Stato */}
          <Card>
            <Card.Body>
              <h5>Stato</h5>
              <Badge 
                bg={item.status === 'available' ? 'info' : 
                    item.status === 'pending' ? 'warning' : 
                    item.status === 'claimed' ? 'success' : 
                    item.status === 'rejected' ? 'danger' : 'secondary'}
                className="p-2"
              >
                {item.status === 'available' ? 'Disponibile' : 
                 item.status === 'pending' ? 'Reclamato da qualcuno' : 
                 item.status === 'claimed' ? 'Restituito' : 
                 item.status === 'rejected' ? 'Reclamo rifiutato' : 'Sconosciuto'}
              </Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Modal per visualizzare le immagini ingrandite */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Immagine dettagliata</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          <img 
            src={selectedImage} 
            alt="Immagine dettagliata" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: 'calc(100vh - 200px)' 
            }} 
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal per il form di reclamo */}
      <Modal 
        show={showClaimModal} 
        onHide={() => setShowClaimModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {item.type === 'lost' ? 'Hai trovato questo oggetto?' : 'Questo oggetto è tuo?'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitClaim}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome*</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={claimFormData.firstName}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.firstName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.firstName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cognome*</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={claimFormData.lastName}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.lastName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.lastName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email*</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={claimFormData.email}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Telefono</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={claimFormData.phone}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.phone}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Messaggio per il proprietario*</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="message"
                value={claimFormData.message}
                onChange={handleFormChange}
                placeholder={item.type === 'lost' ? 
                  "Descrivi dove e quando hai trovato questo oggetto..." : 
                  "Fornisci dettagli che dimostrino che questo oggetto è tuo..."}
                isInvalid={!!formErrors.message}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.message}
              </Form.Control.Feedback>
            </Form.Group>
            
            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Attendere...</span>
                  </>
                ) : (
                  'Invia richiesta'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ItemDetailPage;