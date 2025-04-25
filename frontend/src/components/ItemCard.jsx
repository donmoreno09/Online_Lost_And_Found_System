import React, { useState } from 'react';
import { Card, Badge, Button, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ItemCard = ({ item, showActions = false, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Formatta la data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  };
  
  // Ottiene l'URL dell'immagine formattato correttamente
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}/${imagePath.replace(/^\//, '')}`;
  };
  
  // Traduzione delle categorie in italiano
  const getCategoryLabel = (category) => {
    const categories = {
      'electronics': 'Elettronica',
      'jewelry': 'Gioielli',
      'clothing': 'Abbigliamento',
      'accessories': 'Accessori',
      'documents': 'Documenti',
      'other': 'Altro'
    };
    return categories[category] || category;
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/items/${item._id}`);
      setShowModal(false);
      if (onDelete) onDelete(item._id);
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="h-100 shadow-sm mb-4">
        <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
          <Card.Img 
            variant="top" 
            src={getImageUrl(item.images && item.images[0])} 
            style={{ height: '100%', width: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-image.jpg';
            }}
          />
          <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
            <Badge bg={item.type === 'lost' ? 'danger' : 'success'}>
              {item.type === 'lost' ? 'Smarrito' : 'Trovato'}
            </Badge>
          </div>
        </div>
        
        <Card.Body>
          <Card.Title>{item.title}</Card.Title>
          
          <div className="mb-2">
            <Badge bg="secondary" className="me-2">
              {getCategoryLabel(item.category)}
            </Badge>
            <small className="text-muted">
              {formatDate(item.date)}
            </small>
          </div>
          
          <Card.Text className="mb-2 text-truncate">
            {item.description}
          </Card.Text>
          
          <p className="text-muted small mb-3">
            <i className="bi bi-geo-alt me-1"></i>
            {item.location && (
              <>
                {item.location.city || ''}
                {item.location.city && item.location.state ? ', ' : ''}
                {item.location.state || ''}
              </>
            )}
          </p>
          
          <div className="d-grid mb-2">
            <Button 
              as={Link} 
              to={`/items/${item._id}`} 
              variant="outline-primary" 
              size="sm"
            >
              Visualizza dettagli
            </Button>
          </div>
          
          {showActions && (
            <div className="d-flex justify-content-between">
              <Button 
                as={Link} 
                to={`/items/edit/${item._id}`} 
                variant="outline-secondary" 
                size="sm"
              >
                Modifica
              </Button>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => setShowModal(true)}
              >
                Elimina
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Finestra di conferma */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Conferma eliminazione</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Sei sicuro di voler eliminare "{item.title}"? Questa azione non può essere annullata.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annulla
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Eliminazione...' : 'Elimina'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ItemCard;