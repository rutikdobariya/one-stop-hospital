import React, { useState } from 'react';
import { AppSidebar, AppFooter, AppHeader } from '../../../components/index';
import { CCard, CCardBody, CForm, CFormInput, CButton, CAlert, CInputGroup, CInputGroupText, CFormTextarea, CFormLabel } from '@coreui/react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import AdminSidebar from '../../../components/AdminSidebar';
import withAdminAuth from './withAdminAuth';

const CreateMedicine = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validationSchema = Yup.object().shape({
    medicinename: Yup.string()
      .min(3, 'Medicine name must be at least 3 characters long')
      .required('Medicine name is required'),
    medicineprice: Yup.number()
      .typeError('Price must be a number')
      .positive('Price must be greater than 0')
      .required('Price is required'),
    description: Yup.string()
      .min(10, 'Description must be at least 10 characters')
      .required('Description is required'),
  });

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      medicinename: '',
      medicineprice: '',
      description: ''
    }
  });

  const handleFormSubmit = async (data) => {
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:3001/CreateMedicine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicinename: data.medicinename.trim(),
          medicineprice: parseFloat(data.medicineprice),
          description: data.description.trim()
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Medicine added successfully!');
        // Reset form fields after successful submission
        setValue('medicinename', '');
        setValue('medicineprice', '');
        setValue('description', '');
      } else {
        setError(result.message || 'Medicine creation failed!');
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
              <h4 className="mb-4">Add New Medicine</h4>
              <CForm onSubmit={handleSubmit(handleFormSubmit)}>
                <Controller
                  name="medicinename"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="medicinename">Medicine Name</CInputGroupText>
                        <CFormInput 
                          {...field} 
                          type="text" 
                          placeholder="Enter medicine name"
                          aria-label="Medicine name" 
                          aria-describedby="medicinename" 
                        />
                      </CInputGroup>
                      {errors.medicinename && <div className="text-danger">{errors.medicinename.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="medicineprice"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="medicineprice">₹</CInputGroupText>
                        <CFormInput 
                          {...field} 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="Enter medicine price"
                          aria-label="Medicine price" 
                          aria-describedby="medicineprice" 
                        />
                      </CInputGroup>
                      {errors.medicineprice && <div className="text-danger">{errors.medicineprice.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CFormLabel htmlFor="description">Description</CFormLabel>
                      <CFormTextarea 
                        {...field} 
                        id="description" 
                        rows={3}
                        placeholder="Enter medicine description"
                      />
                      {errors.description && <div className="text-danger">{errors.description.message}</div>}
                    </div>
                  )}
                />

                <CButton color="primary" className="px-4 d-block mx-auto" type="submit" disabled={isSubmitting}>
                  Add Medicine
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

export default withAdminAuth(CreateMedicine);
