import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Tabs, Tab, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MyItemsPage = () => {
  const [activeTab, setActiveTab] = useState('lost');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch degli oggetti dell'utente - CORRETTO per usare /my-items endpoint
  const fetchUserItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/items/my-items`);
      
      if (response.data.success) {
        setItems(response.data.data || []);
        setError(null);
      } else {
        setError('Errore nel caricamento dei tuoi oggetti');
      }
    } catch (err) {
      console.error('Errore nel caricamento degli oggetti:', err);
      setError('Impossibile caricare i tuoi oggetti. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserItems();
  }, [fetchUserItems]);

  // Filtra gli oggetti in base al tipo attivo
  const filteredItems = items.filter(item => item.type === activeTab);

  // Gestire l'eliminazione di un oggetto
  const handleDeleteItem = async (itemId) => {
    try {
      const response = await axios.delete(`${API_URL}/items/${itemId}`);
      
      if (response.data.success) {
        // Rimuovi l'oggetto dalla lista locale
        setItems(prevItems => prevItems.filter(item => item._id !== itemId));
      } else {
        setError('Errore nell\'eliminazione dell\'oggetto');
      }
    } catch (err) {
      console.error('Errore nell\'eliminazione dell\'oggetto:', err);
      setError('Impossibile eliminare l\'oggetto. Riprova più tardi.');
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>I miei oggetti</h1>
        <Button as={Link} to="/create-item" variant="primary">
          Segnala nuovo oggetto
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <Button variant="outline-danger" size="sm" onClick={fetchUserItems}>
            Riprova
          </Button>
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="lost" title="Oggetti smarriti">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </Spinner>
            </div>
          ) : filteredItems.length > 0 ? (
            <Row>
              {filteredItems.map(item => (
                <Col key={item._id} lg={4} md={6} className="mb-4">
                  <ItemCard 
                    item={item} 
                    showActions={true} 
                    onDelete={handleDeleteItem} 
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-4">
              <p>Non hai ancora segnalato oggetti smarriti.</p>
              <Button as={Link} to="/create-item" variant="outline-primary">
                Segnala un oggetto smarrito
              </Button>
            </div>
          )}
        </Tab>
        
        <Tab eventKey="found" title="Oggetti trovati">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </Spinner>
            </div>
          ) : filteredItems.length > 0 ? (
            <Row>
              {filteredItems.map(item => (
                <Col key={item._id} lg={4} md={6} className="mb-4">
                  <ItemCard 
                    item={item} 
                    showActions={true} 
                    onDelete={handleDeleteItem} 
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-4">
              <p>Non hai ancora segnalato oggetti trovati.</p>
              <Button as={Link} to="/create-item" variant="outline-primary">
                Segnala un oggetto trovato
              </Button>
            </div>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default MyItemsPage;