import React, { useState, useEffect } from 'react';
import { AppSidebar, AppFooter, AppHeader } from '../../../components/index';
import {
  CCard, CCardBody, CForm, CFormInput, CButton, CAlert, 
  CInputGroup, CInputGroupText, CFormTextarea, CFormLabel 
} from '@coreui/react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import AdminSidebar from '../../../components/AdminSidebar';
import withAdminAuth from './withAdminAuth';

const CreateDoctor = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [hospitals, setHospitals] = useState([]); 
  const [filteredHospitals, setFilteredHospitals] = useState([]); 
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch('http://localhost:3001/hospitals');
        const data = await response.json();
        setHospitals(data || []);
        setFilteredHospitals(data || []);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        setHospitals([]);
        setFilteredHospitals([]);
      }
    };
    fetchHospitals();
  }, []);

  const handleHospitalSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setSelectedHospital(event.target.value);
    setFilteredHospitals(hospitals.filter(hospital => 
      hospital.hospitalname.toLowerCase().includes(searchTerm)
    ));
  };

  const handleHospitalSelect = (hospital) => {
    setSelectedHospital(hospital?.hospitalname || ''); 
    setSelectedHospitalId(hospital?.id || null);
    setFilteredHospitals([]);
    setValue('hospital', hospital?.hospitalname || ''); // Set the hospital name in the form
  };

  const validationSchema = Yup.object().shape({
    doctorname: Yup.string().min(3, 'Doctor name must be at least 3 characters long').required('Doctor name is required'),
    specialty: Yup.string().required('Specialty is required'),
    mobile: Yup.string().matches(/^\d{10}$/, 'Mobile number must be exactly 10 digits').required('Mobile number is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    address: Yup.string().required('Address is required'),
    hospital: Yup.string().required('Hospital selection is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters long')
      .required('Password is required'),
  });

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm({
    resolver: yupResolver(validationSchema),
    shouldUnregister: false,
    defaultValues: {
      doctorname: '',
      specialty: '',
      mobile: '',
      email: '',
      address: '',
      hospital: '',
      password: ''
    }
  });

  const handleFormSubmit = async (data) => {
    setMessage('');
    setError('');

    // Debugging: Log the data being submitted
    console.log('Submitting data:', { ...data, hospital_id: selectedHospitalId });

    try {
      const response = await fetch('http://localhost:3001/CreateDoctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...data, 
          hospital_id: selectedHospitalId 
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Doctor added successfully!');
        setValue('doctorname', '');
        setValue('specialty', '');
        setValue('mobile', '');
        setValue('email', '');
        setValue('address', '');
        setValue('hospital', '');
        setSelectedHospital('');
        setSelectedHospitalId(null);
        setFilteredHospitals(hospitals);
      } else {
        console.log(result);
        
        setError(result.message || 'Doctor creation failed!');
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
                  name="doctorname"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="doctorname">Doctor Name</CInputGroupText>
                        <CFormInput {...field} type='text' aria-label="Doctor Name" />
                      </CInputGroup>
                      {errors.doctorname && <div className="text-danger">{errors.doctorname.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="specialty"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="specialty">Specialty</CInputGroupText>
                        <CFormInput {...field} type='text' aria-label="Specialty" />
                      </CInputGroup>
                      {errors.specialty && <div className="text-danger">{errors.specialty.message}</div>}
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
                        <CFormInput {...field} type='tel' aria-label="Mobile" />
                      </CInputGroup>
                      {errors.mobile && <div className="text-danger">{errors.mobile.message}</div>}
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

                <Controller
                  name="hospital"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CFormLabel htmlFor="hospital">Select Hospital</CFormLabel>
                      <CFormInput 
                        type="text"
                        value={selectedHospital}  
                        onChange={handleHospitalSearch}
                        placeholder="Type to search for a hospital..."
                      />
                      <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredHospitals.map(hospital => (
                          <li key={hospital.id} className="list-group-item" onClick={() => handleHospitalSelect(hospital)}>
                            {hospital.hospitalname}
                          </li>
                        ))}
                      </ul>
                      {errors.hospital && <div className="text-danger">{errors.hospital.message}</div>}
                    </div>
                  )}
                />

                <CButton 
                  color="primary" 
                  className="px-4 d-block mx-auto" 
                  type="submit"
                  disabled={isSubmitting} >
                  Add Doctor
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

export default withAdminAuth(CreateDoctor);