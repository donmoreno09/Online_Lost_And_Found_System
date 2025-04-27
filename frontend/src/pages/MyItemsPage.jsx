import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Tabs, Tab, Button, Alert, Spinner, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MyItemsPage = () => {
  const [activeTab, setActiveTab] = useState('lost');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 6;

  // Fetch degli oggetti dell'utente con paginazione
  const fetchUserItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/items/my-items?page=${currentPage}&limit=${itemsPerPage}`);
      
      if (response.data.success) {
        setItems(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
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
  }, [currentPage]);

  useEffect(() => {
    fetchUserItems();
  }, [fetchUserItems]);

  // Filtra gli oggetti in base al tipo attivo
  const filteredItems = items.filter(item => item.type === activeTab);

  // Quando si cambia tab, torniamo alla prima pagina
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
  };

  // Gestire l'eliminazione di un oggetto
  const handleDeleteItem = async (itemId) => {
    try {
      const response = await axios.delete(`${API_URL}/items/${itemId}`);
      
      if (response.data.success) {
        // Rimuovi l'oggetto dalla lista locale
        setItems(prevItems => prevItems.filter(item => item._id !== itemId));
        // Mostra un messaggio di successo temporaneo
        setError(null); // Rimuovi eventuali messaggi di errore esistenti
        setSuccessMessage('Oggetto eliminato con successo');
        
        // Controlla se dopo l'eliminazione la pagina corrente è ancora valida
        const remainingItems = items.filter(item => item._id !== itemId && item.type === activeTab);
        const remainingPages = Math.ceil(remainingItems.length / itemsPerPage);
        
        // Se la pagina corrente non è più valida e non siamo alla prima pagina, torna indietro di una pagina
        if (currentPage > 1 && remainingPages < currentPage) {
          setCurrentPage(prev => prev - 1);
        }
        
        // Rimuovi il messaggio dopo 3 secondi
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
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
      
      {successMessage && (
        <Alert variant="success" className="d-flex justify-content-between align-items-center">
          <span>{successMessage}</span>
          <Button variant="outline-success" size="sm" onClick={() => setSuccessMessage(null)}>
            Chiudi
          </Button>
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={handleTabChange}
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
            <div>
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
              
              {/* Controlli di paginazione */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    />
                    {[...Array(totalPages)].map((_, idx) => (
                      <Pagination.Item
                        key={idx + 1}
                        active={idx + 1 === currentPage}
                        onClick={() => setCurrentPage(idx + 1)}
                      >
                        {idx + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    />
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p>Non hai ancora segnalato oggetti smarriti.</p>
              <Button as={Link} to="/create-item?type=lost" variant="outline-primary">
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
            <div>
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
              
              {/* Controlli di paginazione */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    />
                    {[...Array(totalPages)].map((_, idx) => (
                      <Pagination.Item
                        key={idx + 1}
                        active={idx + 1 === currentPage}
                        onClick={() => setCurrentPage(idx + 1)}
                      >
                        {idx + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    />
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p>Non hai ancora segnalato oggetti trovati.</p>
              <Button as={Link} to="/create-item?type=found" variant="outline-primary">
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