import React from 'react';
import SignUpForm from './components/SignUpForm';
import SignInForm from './components/SignInForm';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <SignUpForm />
      <hr />
      <SignInForm />
    </div>
  );
}

export default App;
