import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain="dev-m6frsjfbk7k258zu.us.auth0.com"
        clientId="gspmYIs2NIf4cASn3V998ddIj7yJKRDE"
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: "https://cms-api" 
        }}
      >
        <App />
      </Auth0Provider>
    </BrowserRouter>
  </React.StrictMode>
);