import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="py-4 mt-5" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
      <Container>
        <p className="text-center mb-0">
          &copy; {new Date().getFullYear()} Lost & Found System
        </p>
      </Container>
    </footer>
  );
};

export default Footer;