import React, { useState, useRef } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, Image } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validare tipo e dimensione del file
      if (!file.type.match('image.*')) {
        setError('Seleziona un\'immagine valida (JPEG, PNG)');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setError('La dimensione dell\'immagine deve essere inferiore a 2MB');
        return;
      }
      
      setAvatar(file);
      
      // Crea anteprima
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validazione
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('La password attuale è richiesta per impostarne una nuova');
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Le nuove password non corrispondono');
        return;
      }
      
      if (formData.newPassword.length < 6) {
        setError('La nuova password deve essere di almeno 6 caratteri');
        return;
      }
    }
    
    try {
      setLoading(true);
      
      const profileData = new FormData();
      profileData.append('firstName', formData.firstName);
      profileData.append('lastName', formData.lastName);
      profileData.append('phone', formData.phone || '');
      
      if (formData.currentPassword && formData.newPassword) {
        profileData.append('currentPassword', formData.currentPassword);
        profileData.append('newPassword', formData.newPassword);
      }
      
      if (avatar) {
        profileData.append('avatar', avatar);
      }
      
      const response = await axios.put(`${API_URL}/users/${user._id}`, profileData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setSuccess('Profilo aggiornato con successo');
        // Ricarica i dati dell'utente nell'AuthContext
        updateProfile(user._id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        });
        
        // Resetta i campi password
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(response.data.message || 'Errore nell\'aggiornamento del profilo');
      }
    } catch (err) {
      console.error('Errore nell\'aggiornamento del profilo:', err);
      setError(err.response?.data?.message || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  // Get profile image
  const getProfileImage = () => {
    if (avatarPreview) {
      return avatarPreview;
    } else if (user?.avatar) {
      return user.avatar;
    } else {
      return `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${formData.firstName}+${formData.lastName}`;
    }
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Il mio profilo</h1>
      
      <Row>
        <Col md={4} className="mb-4">
          <Card className="text-center p-3 shadow-sm">
            <div className="d-flex justify-content-center mb-3 position-relative">
              <Image 
                src={getProfileImage()}
                alt={`${user?.firstName || 'User'} ${user?.lastName || ''}`}
                roundedCircle
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <div 
                className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2"
                style={{ cursor: 'pointer', marginRight: '75px' }}
                onClick={triggerFileInput}
              >
                <i className="bi bi-pencil-fill text-white"></i>
              </div>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              accept="image/*"
            />
            
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={triggerFileInput}
              className="mt-2"
            >
              Cambia immagine profilo
            </Button>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nome</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cognome</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                  <Form.Text muted>L'email non può essere modificata</Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Telefono</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <hr className="my-4" />
                <h5>Cambio password</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Password attuale</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Inserisci la password attuale"
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nuova password</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Inserisci la nuova password"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Conferma nuova password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Conferma la nuova password"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-grid mt-4">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading}
                  >
                    {loading ? 'Salvataggio...' : 'Salva modifiche'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;