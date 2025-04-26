import React from 'react';
import { Navbar, Container, Nav, NavDropdown, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
    <Navbar  variant="dark" expand="lg" className="navbar-custom">
      <Container>
        <Navbar.Brand as={Link} to="/">Lost & Found</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {user && (
              <>
                <Nav.Link as={Link} to="/my-items">My Items</Nav.Link>
                <Nav.Link as={Link} to="/create-item">Post New Item</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {!user ? (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            ) : (
              <NavDropdown 
                title={
                  <span>
                    <Image 
                      src={getProfileImage()} 
                      roundedCircle 
                      width="30" 
                      height="30" 
                      className="me-2" 
                    />
                    {`${user.firstName} ${user.lastName}`}
                  </span>
                } 
                id="basic-nav-dropdown"
              >
                <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;