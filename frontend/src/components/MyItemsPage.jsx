import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Tabs, Tab, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ItemCard from './ItemCard';

const MyItemsPage = () => {
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Fetch the user's items
    const fetchMyItems = async () => {
      try {
        setLoading(true);
        
        // Mock data - In a real app, this would be an API call
        // Simulate API delay
        setTimeout(() => {
          const mockItems = [
            {
              _id: '1',
              type: 'lost',
              title: 'Lost Keys',
              description: 'Lost my house keys with a red keychain near Central Park.',
              category: 'other',
              location: {
                address: 'Central Park',
                city: 'New York',
                state: 'NY',
                coordinate: {
                  lat: 40.785091,
                  lng: -73.968285
                }
              },
              date: new Date().toISOString(),
              images: ['https://via.placeholder.com/300x200?text=Keys'],
              status: 'open'
            },
            {
              _id: '2',
              type: 'found',
              title: 'Found Wallet',
              description: 'Found a black leather wallet near the library.',
              category: 'accessories',
              location: {
                address: 'Public Library',
                city: 'Boston',
                state: 'MA',
                coordinate: {
                  lat: 42.349964,
                  lng: -71.077717
                }
              },
              date: new Date().toISOString(),
              images: ['https://via.placeholder.com/300x200?text=Wallet'],
              status: 'open'
            }
          ];
          
          setMyItems(mockItems);
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error(err);
        setError('Failed to load your items. Please try again.');
        setLoading(false);
      }
    };
    
    fetchMyItems();
  }, []);
  
  // Filter items by type
  const lostItems = myItems.filter(item => item.type === 'lost');
  const foundItems = myItems.filter(item => item.type === 'found');
  
  const handleDelete = (id) => {
    // In a real app, this would make an API call to delete the item
    setMyItems(prevItems => prevItems.filter(item => item._id !== id));
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Items</h1>
        <Button as={Link} to="/create-item" variant="primary">
          Post New Item
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Tabs defaultActiveKey="all" className="mb-4">
        <Tab eventKey="all" title={`All (${myItems.length})`}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : myItems.length === 0 ? (
            <Alert variant="info">
              You haven't posted any items yet. Click "Post New Item" to get started.
            </Alert>
          ) : (
            <Row>
              {myItems.map(item => (
                <Col key={item._id} md={6} lg={4} className="mb-4">
                  <ItemCard 
                    item={item} 
                    showActions={true}
                    onDelete={() => handleDelete(item._id)}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Tab>
        <Tab eventKey="lost" title={`Lost (${lostItems.length})`}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : lostItems.length === 0 ? (
            <Alert variant="info">
              You haven't posted any lost items yet.
            </Alert>
          ) : (
            <Row>
              {lostItems.map(item => (
                <Col key={item._id} md={6} lg={4} className="mb-4">
                  <ItemCard 
                    item={item} 
                    showActions={true}
                    onDelete={() => handleDelete(item._id)}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Tab>
        <Tab eventKey="found" title={`Found (${foundItems.length})`}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : foundItems.length === 0 ? (
            <Alert variant="info">
              You haven't posted any found items yet.
            </Alert>
          ) : (
            <Row>
              {foundItems.map(item => (
                <Col key={item._id} md={6} lg={4} className="mb-4">
                  <ItemCard 
                    item={item} 
                    showActions={true}
                    onDelete={() => handleDelete(item._id)}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default MyItemsPage;