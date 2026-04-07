/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ProviderProvider } from './contexts/ProviderContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProviderProvider>
      <App />
    </ProviderProvider>
  </StrictMode>,
);
