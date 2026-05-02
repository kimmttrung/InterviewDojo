import '../global.css';

import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { App } from './App';

const queryClient = new QueryClient();

const Root = () => (
  <BrowserRouter>
    <App queryClient={queryClient} />
  </BrowserRouter>
);

createRoot(document.getElementById('root')!).render(<Root />);
