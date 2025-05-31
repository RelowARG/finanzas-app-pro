import React from 'react';
import AppRouter from './router';
import Layout from './components/Layout/Layout';

function App() {
  return (
    <Layout>
      <AppRouter />
    </Layout>
  );
}

export default App;