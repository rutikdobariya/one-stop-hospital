import React, { useState } from 'react';
import { AppSidebar, AppFooter, AppHeader } from '../../../components/index';
import { CCard, CCardBody, CForm, CFormInput, CButton, CAlert, CInputGroup, CInputGroupText, CFormTextarea, CFormLabel } from '@coreui/react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import DoctorSidebar from '../../../components/DoctorSidebar';
import withDoctorAuth from './withDoctorAuth';

const CreateAllergies = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validationSchema = Yup.object().shape({
    allergiename: Yup.string()
      .min(3, 'allergiename must be at least 3 characters long')
      .required('allergiename is required'),
    description: Yup.string()
      .required('Description is required'),
  });

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      allergiename: '',
      description: ''
    }
  });

  const onSubmit = async (formData) => {
    setError('');
    setMessage('');

    try {
      const patientData = JSON.parse(localStorage.getItem('patientSession'));
      
      if (!patientData || !patientData.id) {
        setError('No patient selected');
        return;
      }

      const response = await fetch('http://localhost:3001/createAllergies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allergiename: formData.allergiename,
          description: formData.description,
          pid: patientData.id
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Allergy created successfully');
        reset(); // Reset form after successful submission
      } else {
        setError(data.message || 'Failed to create allergy');
      }
    } catch (err) {
      setError('Error creating allergy');
    }
  };

  return (
    <div>
      <DoctorSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="container mt-4">
          {message && <CAlert color="success">{message}</CAlert>}
          {error && <CAlert color="danger">{error}</CAlert>}

          <CCard className="p-4">
            <CCardBody>
              <CForm onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="allergiename"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="allergiename">Allergie Name</CInputGroupText>
                        <CFormInput {...field} type="text" />
                      </CInputGroup>
                      {errors.allergiename && <div className="text-danger">{errors.allergiename.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CFormLabel htmlFor="description">Description</CFormLabel>
                      <CFormTextarea {...field} id="description" rows={3} />
                      {errors.description && <div className="text-danger">{errors.description.message}</div>}
                    </div>
                  )}
                />

                <CButton color="primary" className="px-4 d-block mx-auto" type="submit">
                  Add Allergie
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

export default withDoctorAuth(CreateAllergies);
