import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from 'react-bootstrap';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
      </div>
    );
  }

  // Reindirizza a login se non autenticato
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

/* 
    Spiegazione di questo componente: 
        Questo componente serve per proteggere le rotte dell'applicazione. 
        Se l'utente non è autenticato, verrà reindirizzato alla pagina di login.  

*/

export default ProtectedRoute;