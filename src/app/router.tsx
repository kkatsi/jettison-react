// The browser router, and nothing else. The table it is built from is routes.tsx.

import { createBrowserRouter } from 'react-router';

import { routes } from './routes';

export const router = createBrowserRouter(routes);
