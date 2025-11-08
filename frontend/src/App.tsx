import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './adapters/ui/components/Layout';
import { Routes as RoutesPage } from './pages/Routes';
import { Compare } from './pages/Compare';
import { Banking } from './pages/Banking';
import { Pooling } from './pages/Pooling';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/routes" replace />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/banking" element={<Banking />} />
          <Route path="/pooling" element={<Pooling />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
