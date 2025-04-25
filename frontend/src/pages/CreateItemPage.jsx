import React, { useState } from 'react';
import { Form, Button, Container, Alert, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CreateItemPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Stato per i dati del form
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
  
  // Stato per le immagini
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  
  // Stato per errori e loading
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Gestione dei cambiamenti nei campi del form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Gestione del caricamento delle immagini
  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Controlla il limite di immagini (max 5)
      if (images.length + filesArray.length > 5) {
        setError('Puoi caricare al massimo 5 immagini');
        return;
      }
      
      setImages([...images, ...filesArray]);
      
      // Crea anteprime
      const previewArray = filesArray.map(file => URL.createObjectURL(file));
      setImagePreview([...imagePreview, ...previewArray]);
      
      // Resetta eventuali errori
      setError('');
    }
  };
  
  // Rimuove un'immagine dall'anteprima
  const removeImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
    
    const updatedPreviews = [...imagePreview];
    URL.revokeObjectURL(updatedPreviews[index]); // Pulisce l'URL
    updatedPreviews.splice(index, 1);
    setImagePreview(updatedPreviews);
  };
  
  // Invio del form con location corretta
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log("DEBUG: Form submission started - NEW APPROACH");
    
    // Validazione base
    if (!formData.title || !formData.description || !formData.category || !formData.date) {
      setError('Per favore, compila tutti i campi obbligatori');
      return;
    }
    
    try {
      setLoading(true);
      
      // NUOVO APPROCCIO: Prima carichiamo solo le immagini, poi i dati del form
      let imageUrls = [];
      
      // Step 1: Carica le immagini se presenti
      if (images.length > 0) {
        console.log("DEBUG: Uploading images first");
        
        // Crea un FormData solo per le immagini
        const imageFormData = new FormData();
        images.forEach(image => {
          imageFormData.append('images', image);
        });
        
        // Aggiungi il token
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        };
        
        // Carica le immagini
        try {
          const imageResponse = await axios.post(
            `${API_URL}/upload`, 
            imageFormData,
            { headers }
          );
          
          if (imageResponse.data && imageResponse.data.success) {
            imageUrls = imageResponse.data.urls || [];
            console.log("DEBUG: Images uploaded successfully:", imageUrls);
          }
        } catch (imageError) {
          console.error("DEBUG: Error uploading images:", imageError);
          // Continuiamo anche senza immagini
        }
      }
      
      // Step 2: Invia i dati del form come JSON
      console.log("DEBUG: Sending form data as JSON");
      
      // Prepara i dati come oggetto JSON
      const itemData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        date: formData.date,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state
        },
        images: imageUrls
      };
      
      console.log("DEBUG: Item data:", itemData);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/items`, itemData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("DEBUG: Response received:", response.status);
      console.log("DEBUG: Response data:", response.data);
      
      if (response.data && response.data.success) {
        navigate(`/items/${response.data.data._id}`);
      } else {
        setError('Errore nel salvataggio dell\'oggetto');
      }
    } catch (err) {
      console.error('DEBUG: Error details:', err);
      
      let errorMessage = 'Si è verificato un errore durante la pubblicazione dell\'annuncio';
      if (err.response) {
        console.error('DEBUG: Error response status:', err.response.status);
        console.error('DEBUG: Error response data:', err.response.data);
        
        if (err.response.status === 401) {
          errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
          setTimeout(() => navigate('/login'), 2000);
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">
        {formData.type === 'lost' ? 'Segnala un oggetto smarrito' : 'Segnala un oggetto trovato'}
      </h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Tipo di segnalazione</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  id="lost"
                  label="Ho smarrito un oggetto"
                  name="type"
                  value="lost"
                  checked={formData.type === 'lost'}
                  onChange={handleChange}
                />
                <Form.Check
                  inline
                  type="radio"
                  id="found"
                  label="Ho trovato un oggetto"
                  name="type"
                  value="found"
                  checked={formData.type === 'found'}
                  onChange={handleChange}
                />
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Titolo*</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="es. Portafoglio rosso smarrito"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Categoria*</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Seleziona una categoria</option>
                <option value="electronics">Elettronica</option>
                <option value="jewelry">Gioielli</option>
                <option value="clothing">Abbigliamento</option>
                <option value="accessories">Accessori</option>
                <option value="documents">Documenti</option>
                <option value="other">Altro</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descrizione*</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Fornisci dettagli sull'oggetto..."
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data {formData.type === 'lost' ? 'di smarrimento' : 'di ritrovamento'}*</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <h5 className="mt-4">Informazioni sulla posizione</h5>
            
            <Form.Group className="mb-3">
              <Form.Label>Indirizzo*</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Nome della via o descrizione del luogo"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Città*</Form.Label>
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
                  <Form.Label>Stato/Provincia*</Form.Label>
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
            
            <h5 className="mt-4">Immagini (opzionali, massimo 5)</h5>
            
            <Form.Group className="mb-3">
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              <Form.Text muted>
                Carica immagini dell'oggetto per aiutare nell'identificazione.
              </Form.Text>
            </Form.Group>
            
            {/* Anteprima immagini */}
            {imagePreview.length > 0 && (
              <Row className="mb-4">
                {imagePreview.map((preview, index) => (
                  <Col key={index} xs={6} md={3} className="mb-3">
                    <div className="position-relative">
                      <img
                        src={preview}
                        alt={`Anteprima ${index + 1}`}
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
              <Button variant="secondary" onClick={() => navigate('/')}>
                Annulla
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Salvataggio...' : 'Pubblica'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateItemPage;