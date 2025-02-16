import React, { useEffect, useState } from 'react';
import { AppSidebar, AppFooter, AppHeader } from '../../../components/index';
import { CCard, CCardBody, CTable, CTableHead, CTableBody, CTableRow, CTableHeaderCell, CTableDataCell, CForm, CFormInput, CButton, CAlert, CInputGroup, CInputGroupText, CFormTextarea, CFormLabel } from '@coreui/react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import AdminSidebar from '../../../components/AdminSidebar';
import withAdminAuth from './withAdminAuth';

const AdminDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('http://localhost:3001/doctors');
        if (!response.ok) {
          console.log(response.json);
          
          throw new Error('Failed to fetch doctors');
        }
        const data = await response.json();
        setDoctors(data);
      } catch (err) {
        console.log(err);
        
        setError(err.message);
      }
    };

    fetchDoctors();
  }, []);

  return (
    <div>
      <AdminSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div>
          {error && <CAlert color="danger">{error}</CAlert>}

          <CCard>
            <CCardBody>
              <h4>Doctor Data</h4>
              <CTable striped>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Speciality</CTableHeaderCell>
                    <CTableHeaderCell>Hospital Name</CTableHeaderCell>
                    <CTableHeaderCell>Mobile</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Address</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {doctors.map((doctor) => (
                    <CTableRow key={doctor.id}>
                      <CTableDataCell>{doctor.id}</CTableDataCell>
                      <CTableDataCell>{doctor.doctorname}</CTableDataCell>
                      <CTableDataCell>{doctor.speciality}</CTableDataCell>
                      <CTableDataCell>{doctor.hospitalname}</CTableDataCell>
                      <CTableDataCell>{doctor.mobile}</CTableDataCell>
                      <CTableDataCell>{doctor.email}</CTableDataCell>
                      <CTableDataCell>{doctor.address}</CTableDataCell>
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

export default withAdminAuth(AdminDashboard);
