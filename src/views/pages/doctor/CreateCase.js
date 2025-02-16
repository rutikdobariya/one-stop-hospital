import React, { useState } from 'react';
import { AppSidebar, AppFooter, AppHeader } from '../../../components/index';
import { 
  CCard, 
  CCardBody, 
  CForm, 
  CFormInput, 
  CButton, 
  CAlert, 
  CInputGroup, 
  CInputGroupText, 
  CFormTextarea, 
  CFormLabel,
  CRow,
  CCol 
} from '@coreui/react';
import { CDatePicker } from '@coreui/react-pro';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import DoctorSidebar from '../../../components/DoctorSidebar';
import withDoctorAuth from './withDoctorAuth';

const CreateCase = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const today = new Date();

  const validationSchema = Yup.object().shape({
    disease: Yup.string()
      .min(3, 'Disease name must be at least 3 characters long')
      .required('Disease name is required'),
    description: Yup.string()
      .min(10, 'Description must be at least 10 characters long')
      .required('Description is required'),
    date: Yup.date()
      .required('Date is required')
      .max(today, 'Date cannot be in the future')
  });

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      disease: '',
      description: '',
      date: today
    }
  });

  const onSubmit = async (formData) => {
    setError('');
    setMessage('');

    try {
      const patientData = JSON.parse(localStorage.getItem('patientSession'));
      const doctorData = JSON.parse(localStorage.getItem('doctorSession'));
      
      if (!patientData || !patientData.id) {
        setError('No patient selected');
        return;
      }

      if (!doctorData || !doctorData.id) {
        setError('Doctor session expired');
        return;
      }

      const response = await fetch('http://localhost:3001/createCase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disease: formData.disease,
          description: formData.description,
          date: formData.date,
          pid: patientData.id,
          did: doctorData.id
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store case_id in session storage
        localStorage.setItem('caseSession', JSON.stringify({
          id: data.id,
          disease: data.disease,
          date: data.date
        }));

        
        setMessage('Case created successfully');
        reset();
      } else {
        setError(data.message || 'Failed to create case');
      }
    } catch (err) {
      console.error('Error creating case:', err);
      setError('Error creating case');
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
              <h4 className="mb-4">Create New Case</h4>
              <CForm onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="disease"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="disease">Disease Name</CInputGroupText>
                        <CFormInput {...field} type="text" placeholder="Enter disease name" />
                      </CInputGroup>
                      {errors.disease && <div className="text-danger">{errors.disease.message}</div>}
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
                        placeholder="Enter detailed description"
                      />
                      {errors.description && <div className="text-danger">{errors.description.message}</div>}
                    </div>
                  )}
                />

                
                
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                        <CRow>
                            <CCol className="mb-3 mb-sm-0" sm={6} lg={5}>
                                <CDatePicker
                                    label="Case Date"
                                    locale="en-US"
                                    date={field.value}
                                    onDateChange={(date) => field.onChange(date)}
                                    className="form-control"
                                />
                            </CCol>
                        </CRow>
                      {errors.date && <div className="text-danger">{errors.date.message}</div>}
                    </div>
                  )}
                />

                <CButton color="primary" className="px-4 d-block mx-auto mt-4" type="submit">
                  Create Case
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

export default withDoctorAuth(CreateCase);
