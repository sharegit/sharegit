import ReactDOM from 'react-dom';
import React from 'react';

import App from './components/App';

import 'semantic-ui-css/semantic.min.css';
import { BrowserRouter, Route } from 'react-router-dom';

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
