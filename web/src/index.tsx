import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';
import 'semantic-ui-css/semantic.min.css';
import App from './app';
import API from './models/API';

declare global {
  interface Window { dataLayer: any; }
}
window.dataLayer = window.dataLayer || [];

(async () => {
  try {
    await API.cache.init();

    ReactDOM.render(
      <BrowserRouter>
        <Route component={App} />
      </BrowserRouter>,
    document.querySelector('#container'));
    
    if (module && module.hot) {
      module.hot.accept();
    
      module.hot.addStatusHandler(status => {
        if (status === 'prepare') console.clear();
      });
    }
  } catch (e) {
      
  }
})();
