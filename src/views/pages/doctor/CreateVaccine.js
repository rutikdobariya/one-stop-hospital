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

const CreateVaccine = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const today = new Date(); // Current date (without time)
  today.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues

  const validationSchema = Yup.object().shape({
    vaccinename: Yup.string()
      .matches(/^[a-zA-Z0-9\s]+$/, 'Vaccine name can only contain letters, numbers and spaces')
      .min(2, 'Vaccine name must be at least 2 characters long')
      .max(50, 'Vaccine name must not exceed 50 characters')
      .required('Vaccine name is required'),
    description: Yup.string()
      .min(10, 'Description must be at least 10 characters long')
      .max(500, 'Description must not exceed 500 characters')
      .required('Description is required'),
    date: Yup.date()
      .required('Date is required')
      .typeError('Please enter a valid date')
  });

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      vaccinename: '',
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
      
      if (!patientData?.id) {
        setError('No patient selected');
        return;
      }

      if (!doctorData?.id) {
        setError('Doctor session expired');
        return;
      }

      const response = await fetch('http://localhost:3001/createVaccine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vaccinename: formData.vaccinename.trim(),
          description: formData.description.trim(),
          date: formData.date,
          pid: patientData.id,
          did: doctorData.id
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Vaccine record created successfully');
        reset();
      } else {
        setError(data.message || 'Failed to create vaccine record');
      }
    } catch (err) {
      console.error('Error creating vaccine record:', err);
      setError('Error creating vaccine record. Please try again.');
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
              <h4 className="mb-4">Create New Vaccine Record</h4>
              <CForm onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="vaccinename"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="vaccinename">Vaccine Name</CInputGroupText>
                        <CFormInput 
                          {...field} 
                          type="text" 
                          placeholder="Enter vaccine name"
                          aria-label="Vaccine name"
                          aria-describedby="vaccinename-help"
                        />
                      </CInputGroup>
                      {errors.vaccinename && 
                        <div className="text-danger mt-1">{errors.vaccinename.message}</div>
                      }
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
                        placeholder="Enter detailed description of the vaccination"
                        aria-describedby="description-help"
                      />
                      {errors.description && 
                        <div className="text-danger mt-1">{errors.description.message}</div>
                      }
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
                            label="Vaccination Date"
                            locale="en-US"
                            date={field.value}
                            onDateChange={(date) => field.onChange(date)}
                            className="form-control"
                            />
                        </CCol>
                      </CRow>
                      {errors.date && 
                        <div className="text-danger mt-1">{errors.date.message}</div>
                      }
                    </div>
                  )}
                />

                <CButton 
                  color="primary" 
                  className="px-4 d-block mx-auto mt-4" 
                  type="submit"
                >
                  Create Vaccine Record
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

export default withDoctorAuth(CreateVaccine);
