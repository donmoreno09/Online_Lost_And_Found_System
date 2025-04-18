import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav, Form, Button } from 'react-bootstrap';
import { getItems } from '../services/api';
import ItemCard from './ItemCard';

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    type: '',
    category: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await getItems(filter);
      setItems(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load items. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#">Lost & Found System</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#" active>Home</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="py-5">
        <Row className="mb-4">
          <Col>
            <h1>Lost and Found Items</h1>
            <p className="lead">Browse through items that have been lost or found.</p>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col xs={12}>
            <Form onSubmit={applyFilters} className="bg-light p-3 rounded">
              <Row>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select 
                      name="type" 
                      value={filter.type}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Items</option>
                      <option value="lost">Lost Items</option>
                      <option value="found">Found Items</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select 
                      name="category" 
                      value={filter.category}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Categories</option>
                      <option value="electronics">Electronics</option>
                      <option value="jewelry">Jewelry</option>
                      <option value="clothing">Clothing</option>
                      <option value="accessories">Accessories</option>
                      <option value="documents">Documents</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button type="submit" variant="primary" className="w-100 mb-3">
                    Filter
                  </Button>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <Row>
            {items.length > 0 ? (
              items.map(item => (
                <Col key={item._id} md={6} lg={4} className="mb-4">
                  <ItemCard item={item} />
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <div className="alert alert-info">
                  No items found. Try adjusting your filters.
                </div>
              </Col>
            )}
          </Row>
        )}
      </Container>

      <footer className="bg-dark text-white py-4 mt-5">
        <Container>
          <p className="text-center mb-0">
            &copy; {new Date().getFullYear()} Lost & Found System
          </p>
        </Container>
      </footer>
    </>
  );
};

export default HomePage;