import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EditItemPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    type: 'lost',
    title: '',
    description: '',
    category: '',
    address: '',
    city: '',
    state: '',
    date: '',
  });
  
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setFetchLoading(true);
        const response = await axios.get(`${API_URL}/items/${id}`);
        
        if (response.data.success) {
          const item = response.data.data;
          
          // Check if user has permission to edit this item
          if (user && item.user && item.user._id !== user._id) {
            setError("You don't have permission to edit this item");
            return;
          }
          
          // Populate form data
          setFormData({
            type: item.type || 'lost',
            title: item.title || '',
            description: item.description || '',
            category: item.category || '',
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
            address: item.location?.address || '',
            city: item.location?.city || '',
            state: item.location?.state || '',
          });
          
          // Set images
          if (item.images && item.images.length > 0) {
            setImagePreview(item.images);
          }
        } else {
          setError('Failed to load item');
        }
      } catch (err) {
        setError('Error loading item details');
        console.error(err);
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchItem();
  }, [id, user]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle image selection
  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages([...images, ...filesArray]);
      
      // Create preview URLs
      const previewArray = filesArray.map(file => URL.createObjectURL(file));
      setImagePreview([...imagePreview, ...previewArray]);
    }
  };
  
  // Remove an image from the preview
  const removeImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
    
    const updatedPreviews = [...imagePreview];
    URL.revokeObjectURL(updatedPreviews[index]); // Clean up the URL
    updatedPreviews.splice(index, 1);
    setImagePreview(updatedPreviews);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      // Prepara i dati per l'invio
      const formDataToSend = new FormData();
      
      // Aggiungi i campi del form
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('date', formData.date);
      
      // MODIFICATO: Location con formato adattato alla nuova struttura
      formDataToSend.append('location[address]', formData.address);
      formDataToSend.append('location[city]', formData.city);
      formDataToSend.append('location[state]', formData.state);
      
      // Aggiungi le immagini esistenti
      if (imagePreview.length > 0) {
        imagePreview.forEach(img => {
          formDataToSend.append('images', img);
        });
      }
      
      // Aggiungi le nuove immagini
      images.forEach(image => {
        formDataToSend.append('images', image);
      });
      
      // Invia la richiesta
      const response = await axios.put(`${API_URL}/items/${id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        navigate(`/items/${id}`);
      } else {
        setError('Errore nell\'aggiornamento dell\'oggetto');
      }
    } catch (err) {
      console.error('Errore:', err);
      setError('Si è verificato un errore durante l\'aggiornamento');
    } finally {
      setLoading(false);
    }
  };
  
  if (fetchLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">Edit Item</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Item Type</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  id="lost"
                  label="I lost an item"
                  name="type"
                  value="lost"
                  checked={formData.type === 'lost'}
                  onChange={handleChange}
                />
                <Form.Check
                  inline
                  type="radio"
                  id="found"
                  label="I found an item"
                  name="type"
                  value="found"
                  checked={formData.type === 'found'}
                  onChange={handleChange}
                />
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Title*</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Lost Red Backpack"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Category*</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                <option value="electronics">Electronics</option>
                <option value="jewelry">Jewelry</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="documents">Documents</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description*</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Provide details about the item..."
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date {formData.type === 'lost' ? 'Lost' : 'Found'}*</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]} // Can't select future dates
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <h5 className="mt-4">Location Information</h5>
            
            <Form.Group className="mb-3">
              <Form.Label>Address*</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Street address or location name"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City*</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State*</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <h5 className="mt-4">Images</h5>
            <p className="text-muted">Adding new images will replace the existing ones.</p>
            
            <Form.Group className="mb-3">
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
            </Form.Group>
            
            {imagePreview.length > 0 && (
              <Row className="mb-4">
                {imagePreview.map((preview, index) => (
                  <Col key={index} xs={6} md={3} className="mb-3">
                    <div className="position-relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="img-thumbnail"
                        style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
            
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
              <Button variant="secondary" onClick={() => navigate('/my-items')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditItemPage;