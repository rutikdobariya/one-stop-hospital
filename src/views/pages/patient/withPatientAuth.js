import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const withPatientAuth = (WrappedComponent) => {
  return (props) => {
    const navigate = useNavigate();

    useEffect(() => {
      // Try to get and parse the patient session
      try {
        const patientSession = localStorage.getItem('patientSession');
        if (!patientSession) {
          navigate('/Patientlogin');
          return;
        }

        // Verify the session data is valid JSON
        const patientData = JSON.parse(patientSession);
        if (!patientData || !patientData.id) {
          localStorage.removeItem('patientSession');
          navigate('/Patientlogin');
        }
      } catch (error) {
        // If JSON parsing fails, clear invalid session and redirect
        localStorage.removeItem('patientSession');
        navigate('/Patientlogin');
      }
    }, [navigate]);

    return <WrappedComponent {...props} />;
  };
};

export default withPatientAuth;