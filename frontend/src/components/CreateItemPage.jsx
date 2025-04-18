import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const CreateItemPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'lost',
    title: '',
    description: '',
    category: '',
    address: '',
    city: '',
    state: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
  });
  
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
    
    // Basic validation
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare the data for submission
      const itemData = {
        ...formData,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          coordinate: {
            lat: 0, // In a real app, you would use geolocation or a maps API
            lng: 0
          }
        }
      };
      
      // Remove the flattened location fields
      delete itemData.address;
      delete itemData.city;
      delete itemData.state;
      
      console.log('Item data to submit:', itemData);
      console.log('Images to upload:', images);
      
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        navigate('/my-items');
      }, 1500);
      
    } catch (err) {
      console.error(err);
      setError('Failed to create item. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">
        {formData.type === 'lost' ? 'Report a Lost Item' : 'Report a Found Item'}
      </h1>
      
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
            <p className="text-muted">Adding images helps others identify your item.</p>
            
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
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateItemPage;