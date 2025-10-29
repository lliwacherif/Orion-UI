import React, { useState } from 'react';
import AuthLogin from './AuthLogin';
import Register from './Register';

const Auth: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);

  return showRegister ? (
    <Register onSwitchToLogin={() => setShowRegister(false)} />
  ) : (
    <AuthLogin onSwitchToRegister={() => setShowRegister(true)} />
  );
};

export default Auth;


