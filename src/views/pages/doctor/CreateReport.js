import React, { useState, useEffect } from 'react';
import { AppFooter, AppHeader } from '../../../components/index';
import {
  CCard, CCardBody, CForm, CFormInput, CButton, CAlert, 
  CFormTextarea, CFormLabel, CFormSelect
} from '@coreui/react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import AdminSidebar from '../../../components/AdminSidebar';
import DoctorSidebar from '../../../components/DoctorSidebar';
import withDoctorAuth from './withDoctorAuth';

const CreateReport = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [caseData, setCaseData] = useState([]); 
  const [selectedCaseID, setSelectedCaseID] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('http://localhost:3001/getCase');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const text = await response.text();
        console.log('Response body:', text);

        const data = JSON.parse(text);
        setCaseData(data || []);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setError('Failed to fetch cases. Please try again later.');
        setCaseData([]);
      }
    };
    fetchCases();
  }, []);

  const validationSchema = Yup.object().shape({
    reportFile: Yup.mixed().required('Report file is required'),
    reportType: Yup.string().required('Report type is required'),
    description: Yup.string().required('Description is required'),
    caseID: Yup.string().required('Case selection is required'),
  });

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm({
    resolver: yupResolver(validationSchema),
    shouldUnregister: false,
    defaultValues: {
      // reportFile: null,
      reportType: '',
      description: '',
      caseID: ''
    }
  });

  const handleFormSubmit = async (data) => {
    setMessage('');
    setError('');

    console.log('Form Data Before Submission:', data);
    const formData = new FormData();
    formData.append('reportFile', data.reportFile[0]);
    formData.append('description', data.description);
    formData.append('caseID', data.caseID);

    // Log the form data
    console.log('Form Data:', {
        reportFile: data.reportFile[0],
        description: data.description,
        caseID: data.caseID
    });

    // Get session values from localStorage
    const doctorSession = localStorage.getItem('doctorSession');

    try {
        const response = await fetch('http://localhost:3001/CreateReport', {
            method: 'POST',
            body: formData,
            headers: {
                'Doctor-Session': doctorSession
            }
        });

        const result = await response.json();
        if (response.ok) {
            setMessage('Report added successfully!');
            setValue('reportFile', null);
            setValue('description', '');
            setValue('caseID', '');
            setSelectedCaseID('');
        } else {
            setError(result.message || 'Report creation failed!');
        }
    } catch (error) {
        setError('Error connecting to server');
        console.error('Error connecting to server', error);
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
              <CForm onSubmit={handleSubmit(handleFormSubmit)}>
                
                <Controller
                  name="reportFile"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CFormLabel htmlFor="reportFile">Select Report File</CFormLabel>
                      <CFormInput type="file" id="File" {...field} />
                      {errors.reportFile && <div className="text-danger">{errors.reportFile.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="reportType"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CFormLabel htmlFor="reportType">Report Type</CFormLabel>
                      <CFormSelect id="reportType" {...field}>
                        <option value="">Select Report Type</option>
                        <option value="Blood Test">Blood Test</option>
                        <option value="X-Ray">X-Ray</option>
                        <option value="MRI">MRI</option>
                        <option value="CT Scan">CT Scan</option>
                      </CFormSelect>
                      {errors.reportType && <div className="text-danger">{errors.reportType.message}</div>}
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

                <Controller
                  name="caseID"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CFormLabel htmlFor="caseID">Select Case</CFormLabel>
                      <CFormInput 
                        type="text"
                        value={selectedCaseID}
                        onChange={(e) => setSelectedCaseID(e.target.value)}
                        placeholder="Type to search for a case..."
                      />
                      <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {caseData.filter(caseItem => caseItem.disease.toLowerCase().includes(selectedCaseID.toLowerCase())).map(caseItem => (
                          <li key={caseItem.id} className="list-group-item" onClick={() => {
                            setSelectedCaseID(caseItem.disease);
                            setValue('caseID', caseItem.id);
                          }}>
                            {caseItem.disease}
                          </li>
                        ))}
                      </ul>
                      {errors.caseID && <div className="text-danger">{errors.caseID.message}</div>}
                    </div>
                  )}
                />

                <CButton 
                  color="primary" 
                  className="px-4 d-block mx-auto" 
                  type="submit"
                  disabled={isSubmitting} >
                  Add Report
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

export default withDoctorAuth(CreateReport);