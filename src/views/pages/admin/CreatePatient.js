import React, { useState } from 'react';
import { AppSidebar, AppFooter, AppHeader } from '../../../components/index';
import { CCard, CCardBody, CForm, CFormInput, CButton, CAlert, CInputGroup, CInputGroupText, CFormTextarea, CFormLabel } from '@coreui/react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import AdminSidebar from '../../../components/AdminSidebar';
import withAdminAuth from './withAdminAuth';



const CreatePatient = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, 'Patient must be at least 3 characters long')
      .required('Patient is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters long')
      .required('Password is required'),
    mobile: Yup.string()
      .matches(/^\d{10}$/, 'Mobile number must be exactly 10 digits')
      .required('Mobile number is required'),
    aadhar: Yup.string()
      .length(12, 'Aadhar number must be exactly 12 digits')
      .required('Aadhar number is required')
      .test('is-unique', 'Aadhar number must be unique', async (value) => {
        const response = await fetch(`http://localhost:3001/check-aadhar?number=${value}`);
        const data = await response.json();
        return data.isUnique; // Assuming the API returns { isUnique: true/false }
      }),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    address: Yup.string()
      .required('Address is required'),
  });

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const handleFormSubmit = async (data) => {
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:3001/CreatePatient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Patient added successfully!');
      } else {
        setError(result.message || 'Patient creation failed!');
      }
    } catch (error) {
      setError('Error connecting to server');
      console.error('Error connecting to server', error);
    }
  };

  return (
    <div>
      <AdminSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="container mt-4">
          {message && <CAlert color="success">{message}</CAlert>}
          {error && <CAlert color="danger">{error}</CAlert>}

          <CCard className="p-4">
            <CCardBody>
              <CForm onSubmit={handleSubmit(handleFormSubmit)}>
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="username">Patient Name</CInputGroupText>
                        <CFormInput {...field} type='text' aria-label="Username" aria-describedby="username" />
                      </CInputGroup>
                      {errors.username && <div className="text-danger">{errors.username.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="mobile"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="mobile">Mobile Number</CInputGroupText>
                        <CFormInput {...field} type='tel' aria-label="Mobile" aria-describedby="mobile" />
                      </CInputGroup>
                      {errors.mobile && <div className="text-danger">{errors.mobile.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="aadhar"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="aadhar">Aadhar Number</CInputGroupText>
                        <CFormInput {...field} type='text' aria-label="Aadhar" />
                      </CInputGroup>
                      {errors.aadhar && <div className="text-danger">{errors.aadhar.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="email">Email</CInputGroupText>
                        <CFormInput {...field} type='email' aria-label="Email" />
                      </CInputGroup>
                      {errors.email && <div className="text-danger">{errors.email.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CFormLabel htmlFor="address">Address</CFormLabel>
                      <CFormTextarea {...field} id="address" rows={3} />
                      {errors.address && <div className="text-danger">{errors.address.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="inputGroup-sizing-default">Password</CInputGroupText>
                        <CFormInput {...field} type='password' aria-label="Password" />
                      </CInputGroup>
                      {errors.password && <div className="text-danger">{errors.password.message}</div>}
                    </div>
                  )}
                />

                <CButton color="primary" className="px-4 d-block mx-auto" type="submit" disabled={isSubmitting}>
                  Add Patient
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default withAdminAuth(CreatePatient);
