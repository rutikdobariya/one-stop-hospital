import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const withDoctorAuth = (WrappedComponent) => {
  return (props) => {
    const navigate = useNavigate();

    useEffect(() => {
      // Try to get and parse the doctor session
      try {
        const doctorSession = localStorage.getItem('doctorSession');
        if (!doctorSession) {
          navigate('/Doctorlogin');
          return;
        }

        // Verify the session data is valid JSON
        const doctorData = JSON.parse(doctorSession);
        if (!doctorData || !doctorData.id) {
          localStorage.removeItem('doctorSession');
          navigate('/Doctorlogin');
        }
      } catch (error) {
        // If JSON parsing fails, clear invalid session and redirect
        localStorage.removeItem('doctorSession');
        navigate('/Doctorlogin');
      }
    }, [navigate]);

    return <WrappedComponent {...props} />;
  };
};

export default withDoctorAuth;