import React, { useEffect, useState } from 'react';
import { AppSidebar, AppFooter, AppHeader } from '../../../components/index';
import { 
  CCard, 
  CCardBody, 
  CRow, 
  CCol, 
  CWidgetStatsF, 
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CAlert,
  CBadge
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
  cilPeople,
  cilUserFollow,
  cilCalendar,
  cilMedicalCross
} from '@coreui/icons';
import DoctorSidebar from '../../../components/DoctorSidebar';
import withDoctorAuth from './withDoctorAuth';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayPatients: 0,
    totalCases: 0,
    activePrescriptions: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [error, setError] = useState('');
  const [doctorInfo, setDoctorInfo] = useState(null);

  useEffect(() => {
    const doctorData = JSON.parse(localStorage.getItem('doctorSession'));
    setDoctorInfo(doctorData);

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/doctor/dashboard/${doctorData.id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch dashboard data');
        }
        const data = await response.json();
        setStats(data.stats);
        setRecentPatients(data.recentPatients || []);
      } catch (err) {
        setError(err.message || 'Error loading dashboard data');
        console.error('Dashboard error:', err);
        // Set default values on error
        setStats({
          totalPatients: 0,
          todayPatients: 0,
          totalCases: 0,
          activePrescriptions: 0
        });
        setRecentPatients([]);
      }
    };

    if (doctorData?.id) {
      fetchDashboardData();
    } else {
      setError('No doctor session found');
    }
  }, []);

  return (
    <div>
      <DoctorSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1 px-3">
          {error && <CAlert color="danger">{error}</CAlert>}
          
          {/* Doctor Info Card */}
          <CCard className="mb-4">
            <CCardBody>
              <h4>Welcome Dr. {doctorInfo?.doctorname}</h4>
              <p>Specialty: {doctorInfo?.speciality}</p>
              <p>Hospital: {doctorInfo?.hospitalname}</p>
            </CCardBody>
          </CCard>

          {/* Statistics Widgets */}
          <CRow>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                icon={<CIcon icon={cilPeople} height={24} />}
                title="Total Patients"
                value={stats.totalPatients}
                color="primary"
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                icon={<CIcon icon={cilUserFollow} height={24} />}
                title="Today's Patients"
                value={stats.todayPatients}
                color="info"
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                icon={<CIcon icon={cilCalendar} height={24} />}
                title="Total Cases"
                value={stats.totalCases}
                color="warning"
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsF
                className="mb-3"
                icon={<CIcon icon={cilMedicalCross} height={24} />}
                title="Active Prescriptions"
                value={stats.activePrescriptions}
                color="success"
              />
            </CCol>
          </CRow>

          {/* Recent Patients Table */}
          <CCard className="mb-4">
            <CCardBody>
              <h4>Recent Patients</h4>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Patient Name</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Disease</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {recentPatients.map((patient) => (
                    <CTableRow key={patient.id}>
                      <CTableDataCell>{patient.patientname}</CTableDataCell>
                      <CTableDataCell>{new Date(patient.date).toLocaleDateString()}</CTableDataCell>
                      <CTableDataCell>{patient.disease}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={patient.status === 'Active' ? 'success' : 'secondary'}>
                          {patient.status}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default withDoctorAuth(DoctorDashboard);
