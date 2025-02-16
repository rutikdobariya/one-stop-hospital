import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const withAdminAuth = (WrappedComponent) => {
  return (props) => {
    const navigate = useNavigate();

    useEffect(() => {
      const adminSession = localStorage.getItem('adminSession');
      if (!adminSession) {
        navigate('/AdminLogin');
      }
    }, [navigate]);

    return <WrappedComponent {...props} />;
  };
};

export default withAdminAuth;