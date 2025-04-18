import React from 'react';
import { Card, Badge, Button, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const ItemCard = ({ item, showActions = false, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  
  const getBadgeVariant = (type) => {
    return type === 'lost' ? 'danger' : 'success';
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Default image if none provided
  const imageUrl = item.images && item.images.length > 0 
    ? item.images[0] 
    : 'https://via.placeholder.com/300x200?text=No+Image';

  const handleDelete = () => {
    setShowModal(false);
    if (onDelete) onDelete(item._id);
  };

  return (
    <>
      <Card className="h-100 shadow-sm mb-4">
        <Card.Img 
          variant="top" 
          src={imageUrl} 
          style={{ height: '180px', objectFit: 'cover' }}
        />
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Badge bg={getBadgeVariant(item.type)}>
              {item.type === 'lost' ? 'Lost' : 'Found'}
            </Badge>
            <small className="text-muted">{formatDate(item.date)}</small>
          </div>
          <Card.Title>{item.title}</Card.Title>
          <Card.Text className="mb-2">
            {item.description.substring(0, 100)}...
          </Card.Text>
          <div className="mb-3">
            <Badge bg="secondary" className="me-2">
              {item.category}
            </Badge>
            <small className="text-muted">
              {item.location.city}, {item.location.state}
            </small>
          </div>
          
          {showActions && (
            <div className="d-flex justify-content-between">
              <Button 
                as={Link} 
                to={`/edit-item/${item._id}`} 
                variant="outline-primary" 
                size="sm"
              >
                Edit
              </Button>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => setShowModal(true)}
              >
                Delete
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{item.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ItemCard;