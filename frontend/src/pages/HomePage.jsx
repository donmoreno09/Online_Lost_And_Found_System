import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import ItemCard from '../components/ItemCard';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    search: ''
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      let queryParams = '?';
      
      if (filters.type) queryParams += `type=${filters.type}&`;
      if (filters.category) queryParams += `category=${filters.category}&`;
      
      // Aggiungi il filtro per lo stato
      queryParams += 'status=open&';
      
      if (filters.search) queryParams += `search=${filters.search}`;
      
      const response = await axios.get(`${API_URL}/items${queryParams}`);
      
      if (response.data.success) {
        setItems(response.data.data);
      } else {
        setError('Errore nel caricamento degli oggetti');
      }
    } catch (err) {
      console.error('Errore caricamento oggetti:', err);
      setError('Si è verificato un errore nel caricamento degli oggetti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleReset = () => {
    setFilters({
      type: '',
      category: '',
      search: ''
    });
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1>Sistema di oggetti smarriti e trovati</h1>
          <p className="lead">
            Hai perso qualcosa? O hai trovato un oggetto che appartiene a qualcun altro?
            Questo è il posto giusto per te!
          </p>
        </Col>
      </Row>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select 
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tutti</option>
                    <option value="lost">Oggetti smarriti</option>
                    <option value="found">Oggetti trovati</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select 
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tutte le categorie</option>
                    <option value="electronics">Elettronica</option>
                    <option value="jewelry">Gioielli</option>
                    <option value="clothing">Abbigliamento</option>
                    <option value="accessories">Accessori</option>
                    <option value="documents">Documenti</option>
                    <option value="other">Altro</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cerca</Form.Label>
                  <Form.Control
                    type="text" 
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Cerca per parole chiave..."
                  />
                </Form.Group>
              </Col>
              
              <Col md={2} className="d-flex align-items-end">
                <div className="d-grid gap-2 w-100 mb-3">
                  <Button variant="primary" type="submit">
                    Cerca
                  </Button>
                </div>
              </Col>
            </Row>
            
            <div className="text-end">
              <Button variant="link" onClick={handleReset}>
                Reimposta filtri
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
        </div>
      ) : (
        <Row>
          {items.length > 0 ? (
            items.map(item => (
              <Col key={item._id} lg={4} md={6} className="mb-4">
                <ItemCard item={item} />
              </Col>
            ))
          ) : (
            <Col>
              <div className="text-center py-5">
                <p className="mb-0">Nessun oggetto trovato con i filtri selezionati.</p>
              </div>
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
};

export default HomePage;