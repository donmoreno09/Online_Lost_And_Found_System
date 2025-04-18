import React from 'react';
import { Navbar, Container, Nav, NavDropdown, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const Navigation = ({ user, logout }) => {
  const navigate = useNavigate();
  
  // Function to generate default avatar if user has no image
  const getProfileImage = () => {
    if (user?.avatar) {
      return user.avatar;
    } else {
      return `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${user?.firstName || 'User'}+${user?.lastName || ''}`;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Lost & Found System</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {user && <Nav.Link as={Link} to="/my-items">My Items</Nav.Link>}
            {user && <Nav.Link as={Link} to="/create-item">Post New Item</Nav.Link>}
          </Nav>
          
          <Nav>
            {user ? (
              <div className="d-flex align-items-center">
                <Image 
                  src={getProfileImage()}
                  alt={`${user.firstName || 'User'} ${user.lastName || ''}`}
                  roundedCircle 
                  width={40} 
                  height={40} 
                  className="me-2"
                  style={{ objectFit: 'cover' }}
                />
                <NavDropdown title={`Hello, ${user.firstName || 'User'}`} id="user-dropdown" align="end">
                  <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                </NavDropdown>
              </div>
            ) : (
              // Show these links only when user is NOT logged in
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;