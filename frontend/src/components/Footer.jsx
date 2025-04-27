import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="py-4 mt-auto" style={{ backgroundColor: 'slateblue', color: 'white' }}>
      <Container>
        <Row className="mb-3">
          <Col md={4} className="mb-3 mb-md-0">
            <h5>Lost & Found System</h5>
            <p className="text-white-50 mb-0">
              Aiutiamo le persone a ritrovare ciò che hanno perso.
            </p>
          </Col>
          
          <Col md={4} className="mb-3 mb-md-0">
            <h5>Link utili</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-decoration-none text-white-50">Home</Link></li>
              <li><Link to="/my-items" className="text-decoration-none text-white-50">I miei oggetti</Link></li>
              <li><Link to="/create-item" className="text-decoration-none text-white-50">Segnala un oggetto</Link></li>
            </ul>
          </Col>
          
          <Col md={4}>
            <h5>Contatti</h5>
            <p className="text-white-50 mb-0">
              <i className="bi bi-envelope-fill me-2"></i>info@lostandfound.com<br/>
              <i className="bi bi-telephone-fill me-2"></i>+39 123 456 7890
            </p>
          </Col>
        </Row>
        
        <Row>
          <Col className="text-center pt-2 border-top border-light">
            <p className="mb-0">&copy; {new Date().getFullYear()} Lost & Found System</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;