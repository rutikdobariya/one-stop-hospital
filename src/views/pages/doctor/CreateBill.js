import React, { useState, useEffect } from 'react';
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
  CCol,
  CFormSelect,
  CFormCheck
} from '@coreui/react';
import { CDatePicker } from '@coreui/react-pro';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import DoctorSidebar from '../../../components/DoctorSidebar';
import withDoctorAuth from './withDoctorAuth';
import Select from 'react-select';

const CreateBill = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicinePrice, setSelectedMedicinePrice] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [timing, setTiming] = useState({
    morning: false,
    afternoon: false,
    night: false
  });
  const [total, setTotal] = useState(0);

  const validationSchema = Yup.object().shape({
    medicine: Yup.string()
      .required('Medicine is required'),
    quantity: Yup.number()
      .required('Quantity is required')
      .min(1, 'Quantity must be at least 1'),
    from_date: Yup.date()
      .required('Start date is required')
      .max(Yup.ref('to_date'), 'Start date must be before end date'),
    to_date: Yup.date()
      .required('End date is required')
      .min(Yup.ref('from_date'), 'End date must be after start date')
  });

  const { control, handleSubmit, formState: { errors }, reset, setValue, getValues } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      medicine: '',
      quantity: 1,
      from_date: new Date(),
      to_date: new Date()
    }
  });

  // Fetch medicines on component mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch('http://localhost:3001/medicines');
        if (response.ok) {
          const data = await response.json();
          setMedicines(data); // Store the raw medicine data
        }
      } catch (err) {
        console.error('Error fetching medicines:', err);
        setError('Error loading medicines');
      }
    };

    fetchMedicines();
  }, []);

  // Handle medicine selection
  const handleMedicineChange = (selectedOption) => {
    if (selectedOption) {
      setValue('medicine', selectedOption.value);
      setSelectedMedicinePrice(selectedOption.price);
    } else {
      setValue('medicine', '');
      setSelectedMedicinePrice(0);
    }
  };

  // Calculate total amount when quantity, price, or dates change
  const calculateTotalAmount = (quantity, price, fromDate, toDate) => {
    if (!quantity || !price || !fromDate || !toDate) return 0;
    
    const days = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;
    const dosesPerDay = Object.values(timing).filter(Boolean).length;
    const totalQuantity = days * dosesPerDay * quantity;
    return totalQuantity * price;
  };

  // Handle timing changes
  const handleTimingChange = (time) => {
    const newTiming = { ...timing, [time]: !timing[time] };
    setTiming(newTiming);
    
    // Recalculate total amount
    const formValues = getValues();
    const newAmount = calculateTotalAmount(
      formValues.quantity,
      selectedMedicinePrice,
      formValues.from_date,
      formValues.to_date
    );
    setTotalAmount(newAmount);
  };

  // Calculate total whenever quantity, price, or timing changes
  useEffect(() => {
    const calculateTotal = () => {
      const formValues = getValues();
      const quantity = formValues.quantity || 0;
      const dosesPerDay = Object.values(timing).filter(Boolean).length;
      
      if (selectedMedicinePrice && quantity && dosesPerDay) {
        const fromDate = formValues.from_date;
        const toDate = formValues.to_date;
        
        if (fromDate && toDate) {
          const diffTime = Math.abs(new Date(toDate) - new Date(fromDate));
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          const newTotal = selectedMedicinePrice * quantity * dosesPerDay * days;
          setTotal(newTotal);
        }
      } else {
        setTotal(0);
      }
    };

    calculateTotal();
  }, [timing, selectedMedicinePrice, getValues]);

  const onSubmit = async (formData) => {
    setError('');
    setMessage('');

    if (total <= 0) {
      setError('Please ensure all fields are filled correctly to calculate total');
      return;
    }

    try {
      const patientData = JSON.parse(localStorage.getItem('patientSession'));
      const doctorData = JSON.parse(localStorage.getItem('doctorSession'));
      const caseData = JSON.parse(localStorage.getItem('caseSession'));
      
      if (!patientData || !patientData.id) {
        setError('No patient selected');
        return;
      }

      if (!doctorData || !doctorData.id) {
        setError('Doctor session expired');
        return;
      }

      if (!caseData || !caseData.id) {
        setError('No case selected');
        return;
      }

      const response = await fetch('http://localhost:3001/createBill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pid: patientData.id,
          did: doctorData.id,
          case_id: caseData.id,
          medicine: formData.medicine,
          quantity: formData.quantity,
          from_date: formData.from_date,
          to_date: formData.to_date,
          timing: timing,
          total_amount: total
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Bill created successfully');
        reset();
        setTiming({ morning: false, afternoon: false, night: false });
        setSelectedMedicinePrice(0);
        setTotal(0);
      } else {
        setError(data.message || 'Failed to create Bill');
      }
    } catch (err) {
      console.error('Error creating Bill:', err);
      setError('Error creating Bill');
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
              <h4 className="mb-4">Create New Bill</h4>
              <CForm onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="medicine"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="medicine">Medicine</CInputGroupText>
                        <CFormSelect
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const selectedMedicine = medicines.find(med => med.id === parseInt(e.target.value));
                            if (selectedMedicine) {
                              setSelectedMedicinePrice(selectedMedicine.medicine_price);
                            } else {
                              setSelectedMedicinePrice(0);
                            }
                          }}
                        >
                          <option value="">Select a medicine...</option>
                          {medicines.map(medicine => (
                            <option key={medicine.id} value={medicine.id}>
                              {medicine.medicinename} - ₹{medicine.medicine_price}
                            </option>
                          ))}
                        </CFormSelect>
                      </CInputGroup>
                      {errors.medicine && <div className="text-danger">{errors.medicine.message}</div>}
                    </div>
                  )}
                />

                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <div className="mb-3">
                      <CInputGroup>
                        <CInputGroupText id="quantity">Quantity per dose</CInputGroupText>
                        <CFormInput 
                          {...field}
                          type="number"
                          min="1"
                          onChange={(e) => {
                            field.onChange(e);
                            const newAmount = calculateTotalAmount(
                              e.target.value,
                              selectedMedicinePrice,
                              getValues('from_date'),
                              getValues('to_date')
                            );
                            setTotalAmount(newAmount);
                          }}
                        />
                      </CInputGroup>
                      {errors.quantity && <div className="text-danger">{errors.quantity.message}</div>}
                    </div>
                  )}
                />

                <div className="mb-3">
                  <CInputGroup>
                    <CInputGroupText>Timing</CInputGroupText>
                    <div className="form-control d-flex gap-3">
                      <CFormCheck 
                        id="morning"
                        label="Morning (M)"
                        checked={timing.morning}
                        onChange={() => handleTimingChange('morning')}
                      />
                      <CFormCheck 
                        id="afternoon"
                        label="Afternoon (A)"
                        checked={timing.afternoon}
                        onChange={() => handleTimingChange('afternoon')}
                      />
                      <CFormCheck 
                        id="night"
                        label="Night (N)"
                        checked={timing.night}
                        onChange={() => handleTimingChange('night')}
                      />
                    </div>
                  </CInputGroup>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <Controller
                      name="from_date"
                      control={control}
                      render={({ field }) => (
                        <div className="mb-3">
                          <CInputGroup>
                            <CInputGroupText>From Date</CInputGroupText>
                            <CDatePicker
                              date={field.value}
                              onDateChange={(date) => {
                                field.onChange(date);
                                const newAmount = calculateTotalAmount(
                                  getValues('quantity'),
                                  selectedMedicinePrice,
                                  date,
                                  getValues('to_date')
                                );
                                setTotalAmount(newAmount);
                              }}
                              locale="en-US"
                              className="form-control"
                            />
                          </CInputGroup>
                          {errors.from_date && <div className="text-danger">{errors.from_date.message}</div>}
                        </div>
                      )}
                    />
                  </div>
                  <div className="col-md-6">
                    <Controller
                      name="to_date"
                      control={control}
                      render={({ field }) => (
                        <div className="mb-3">
                          <CInputGroup>
                            <CInputGroupText>To Date</CInputGroupText>
                            <CDatePicker
                              date={field.value}
                              onDateChange={(date) => {
                                field.onChange(date);
                                const newAmount = calculateTotalAmount(
                                  getValues('quantity'),
                                  selectedMedicinePrice,
                                  getValues('from_date'),
                                  date
                                );
                                setTotalAmount(newAmount);
                              }}
                              locale="en-US"
                              className="form-control"
                            />
                          </CInputGroup>
                          {errors.to_date && <div className="text-danger">{errors.to_date.message}</div>}
                        </div>
                      )}
                    />
                  </div>
                </div>

                {selectedMedicinePrice > 0 && (
                  <div className="mb-3">
                    <CInputGroup>
                      <CInputGroupText>Amount Details</CInputGroupText>
                      <div className="form-control">
                        <div><strong>Price per unit: </strong>₹{selectedMedicinePrice}</div>
                        <div><strong>Quantity per dose: </strong>{getValues('quantity') || 0}</div>
                        <div><strong>Doses per day: </strong>{Object.values(timing).filter(Boolean).length}</div>
                        <div><strong>Number of days: </strong>{
                          (() => {
                            const fromDate = getValues('from_date');
                            const toDate = getValues('to_date');
                            if (fromDate && toDate) {
                              const diffTime = Math.abs(new Date(toDate) - new Date(fromDate));
                              return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            }
                            return 0;
                          })()
                        }</div>
                        <div className="mt-2 pt-2 border-top">
                          <strong>Total Amount: </strong>
                          <span className="text-primary fw-bold">₹{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </CInputGroup>
                  </div>
                )}

                <CButton color="primary" className="px-4 d-block mx-auto mt-4" type="submit">
                  Create Bill
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

export default withDoctorAuth(CreateBill);
