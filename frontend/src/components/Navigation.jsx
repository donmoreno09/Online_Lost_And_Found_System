import React, { useEffect } from 'react';
import { Navbar, Container, Nav, NavDropdown, Image, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navigation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Debug del tema
  console.log('Current theme:', theme);
  useEffect(() => {
    console.log('Theme changed to:', theme);
    console.log('Dark theme class present:', document.body.classList.contains('dark-theme'));
  }, [theme]);

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
    <Navbar bg="primary" variant="dark" expand="lg" className="navbar-custom">
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
            
            {/* Theme Switcher Dropdown */}
            <NavDropdown 
              title={
                <span>
                  {theme === 'light' ? (
                    <i className="bi bi-brightness-high"></i>
                  ) : theme === 'dark' ? (
                    <i className="bi bi-moon-fill"></i>
                  ) : (
                    <i className="bi bi-circle-half"></i>
                  )}
                </span>
              }
              id="theme-dropdown"
              className="theme-toggle-dropdown"
            >
              <NavDropdown.Item onClick={() => setTheme('light')}>
                <i className="bi bi-brightness-high me-2"></i> Light
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => setTheme('dark')}>
                <i className="bi bi-moon-fill me-2"></i> Dark
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => setTheme('system')}>
                <i className="bi bi-circle-half me-2"></i> System
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;