import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [returnUrl, setReturnUrl] = useState('/');

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Controlla se c'è un token nell'URL (da Google OAuth)
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (token) {
            // Salva il token e naviga alla home
            localStorage.setItem('token', token);
            window.location.href = '/'; // Reload completo per aggiornare lo stato dell'autenticazione
        }

        // Controlla se c'è un URL di ritorno specificato
        const returnPath = params.get('returnUrl');
        if (returnPath) {
            setReturnUrl(returnPath);
        }
    }, [location]);

    // Gestisci il reindirizzamento se l'utente è già autenticato
    useEffect(() => {
        if (isAuthenticated) {
            // Controlla se c'è un'azione di reclamo pendente
            const pendingToken = localStorage.getItem('pendingClaimToken');
            const pendingAction = localStorage.getItem('pendingClaimAction');
            
            if (pendingToken && pendingAction) {
                // Pulisci i dati pendenti
                localStorage.removeItem('pendingClaimToken');
                localStorage.removeItem('pendingClaimAction');
                
                // Reindirizza alla pagina corrispondente
                navigate(`/claim/${pendingAction}/${pendingToken}`);
            } else {
                // Altrimenti reindirizza all'URL di ritorno
                navigate(returnUrl);
            }
        }
    }, [isAuthenticated, navigate, returnUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.email || !formData.password) {
            setError('Inserisci email e password');
            return;
        }
        
        try {
            setLoading(true);
            const result = await login(formData);
            
            if (result.success) {
                // Il reindirizzamento viene gestito dall'useEffect sopra
            } else {
                setError(result.error || 'Login fallito');
            }
        } catch (err) {
            console.error('Errore durante il login:', err);
            setError('Si è verificato un errore durante il login');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Salva l'URL di ritorno per dopo l'autenticazione con Google
        if (returnUrl !== '/') {
            localStorage.setItem('postLoginRedirect', returnUrl);
        }
        window.location.href = `${API_URL}/auths/login-google`;
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">Accedi</Card.Title>
                            
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        placeholder="Inserisci la tua email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        placeholder="Inserisci la tua password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                
                                <Button 
                                    variant="primary" 
                                    type="submit" 
                                    className="w-100 mb-3" 
                                    disabled={loading}
                                >
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Accedi'}
                                </Button>
                            </Form>
                            
                            <div className="text-center my-3">
                                <span>oppure</span>
                            </div>
                            
                            <Button 
                                variant="danger" 
                                className="w-100"
                                onClick={handleGoogleLogin}
                            >
                                Accedi con Google
                            </Button>
                            
                            <div className="text-center mt-3">
                                <p>
                                    Non hai un account?{' '}
                                    <Link to="/register">Registrati</Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginPage;