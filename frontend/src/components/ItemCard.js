import React from 'react';
import { Card, Badge } from 'react-bootstrap';

const ItemCard = ({ item }) => {
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

  return (
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
        <div>
          <Badge bg="secondary" className="me-2">
            {item.category}
          </Badge>
          <small className="text-muted">
            {item.location.city}, {item.location.state}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ItemCard;