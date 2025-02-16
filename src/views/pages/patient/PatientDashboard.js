import React, { useEffect, useState } from 'react';
import { AppSidebar, AppFooter, AppHeader } from '../../../components/index';
import { CCard, CContainer, CRow, CCol, CCardBody, CCardText, CCardTitle, CAlert } from '@coreui/react';
import PatientSidebar from '../../../components/PatientSidebar';
import withPatientAuth from './withPatientAuth';

const PatientDashboard = () => {
  const [prediction, setPrediction] = useState('Loading...');
  const [healthScore, setHealthScore] = useState('Loading...');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        
        const response = await fetch('http://127.0.0.1:5000/future_prediction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patient_data: [
              { disease_history: ['Diabetes', 'Hypertension', 'Heart Disease'] },
              { disease_history: ['Obesity', 'Diabetes', 'Heart Disease'] },
            ],
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setPrediction(data.predicted_disease);
        } else {
          setError(data.message);
        }
      } catch (error) {
        setError('Error fetching prediction');
      }

      try {
        const response = await fetch('http://127.0.0.1:5000/predict_health', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            past_diseases: [
              { disease_name: 'Diabetes', date: '2023-01-15' },
              { disease_name: 'Hypertension', date: '2023-03-20' },
              { disease_name: 'Diabetes', date: '2025-01-15' },
              { disease_name: 'Hypertension', date: '2025-03-20' },
              
              
            ],
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setHealthScore(data.health_score);
        } else {
          setError(data.message);
        }
      } catch (error) {
        setError('Error fetching health score');
      }
    };

    fetchPrediction();
  }, []);

  return (
    <div>
      <PatientSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="flex-grow-1">
          <div className="container mt-4">
            {error && <CAlert color="danger">{error}</CAlert>}
            <CContainer>
              <CRow>
                <CCol sm="auto"></CCol>
                <CCard style={{ width: '18rem' }}>
                  <CCardBody>
                    <CCardTitle>Future Disease That you Might Suffer through is :</CCardTitle>
                    <CCardText>{prediction}</CCardText>
                  </CCardBody>
                </CCard>
                <CCol />
                <CCol sm="auto"></CCol>
                <CCard style={{ width: '18rem' }}>
                  <CCardBody>
                    <CCardTitle>Your Health Score is :</CCardTitle>
                    <CCardText>{healthScore}</CCardText>
                  </CCardBody>
                </CCard>
                <CCol />
              </CRow>
            </CContainer>
          </div>
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default withPatientAuth(PatientDashboard);