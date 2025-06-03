// Ruta: finanzas-app-pro/frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ModalProvider } from './contexts/ModalContext.jsx'; // *** NUEVO IMPORT ***
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider> {/* *** ENVOLVER CON MODALPROVIDER *** */}
          <App />
        </ModalProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)