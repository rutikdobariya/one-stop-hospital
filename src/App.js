import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

// We use those styles to show code examples, you should remove them in your application.
import './scss/examples.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Kalpan Code Starts here
const LLMDiseasePred = React.lazy(() => import('./views/pages/patient/LLMDiseasePred'))
// Kalpan Code Ends here

// My code Starts here

// Pages
// Admin Pages
const CreatePatient = React.lazy(() => import('./views/pages/admin/CreatePatient'))
const CreateHospital = React.lazy(() => import('./views/pages/admin/CreateHospital'))
const CreateDoctor = React.lazy(() => import('./views/pages/admin/CreateDoctor'))
const CreateMedicine = React.lazy(() => import('./views/pages/admin/CreateMedicine'))
const AdminDashboard = React.lazy(() => import('./views/pages/admin/AdminDashboard'))
const AdminLogin = React.lazy(() => import('./views/pages/admin/AdminLogin'))

// Doctor Pages
const DoctorLogin = React.lazy(() => import('./views/pages/doctor/DoctorLogin'))
const PatientCheck = React.lazy(() => import('./views/pages/doctor/PatientCheck'))
const DoctorDashboard = React.lazy(() => import('./views/pages/doctor/DoctorDashboard'))
const CreateAllergies = React.lazy(() => import('./views/pages/doctor/CreateAllergies'))
const CreateCase = React.lazy(() => import('./views/pages/doctor/CreateCase'))
const CreateVaccine = React.lazy(() => import('./views/pages/doctor/CreateVaccine'))
const CreateBill = React.lazy(() => import('./views/pages/doctor/CreateBill'))
const CreateReport = React.lazy(() => import('./views/pages/doctor/CreateReport'))


// Patient Pages
const PatientLogin = React.lazy(() => import('./views/pages/patient/PatientLogin'))
const PatientDashboard = React.lazy(() => import('./views/pages/patient/PatientDashboard'))

// My code Ends Here

const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Router>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          {/* <Route exact path="/login" name="Login Page" element={<Login />} />
          <Route exact path="/register" name="Register Page" element={<Register />} />
          <Route exact path="/404" name="Page 404" element={<Page404 />} />
          <Route exact path="/500" name="Page 500" element={<Page500 />} /> */}

          {/* My Code Starts here */}
          {/* Admin Routes */}
          <Route exact path="/createPatient" name="Create Patient" element={<CreatePatient />} />
          <Route exact path="/createHospital" name="Create Hospital" element={<CreateHospital />} />
          <Route exact path="/createDoctor" name="Create Doctor" element={<CreateDoctor />} />
          <Route exact path="/createMedicine" name="Create Medicine" element={<CreateMedicine />} />
          <Route exact path="/admin/dashboard" name="Admin Dashboard" element={<AdminDashboard />} />
          <Route exact path="/Adminlogin" name="Admin Login Page" element={<AdminLogin />} />

          {/* Doctor Routes */}
          <Route exact path="/Doctorlogin" name="Doctor Login Page" element={<DoctorLogin />} />
          <Route exact path="/PatientCheck" name="Patient Login Page" element={<PatientCheck />} />
          <Route exact path="/doctor/dashboard" name="Doctor Dashboard" element={<DoctorDashboard />} />
          <Route exact path="/createAllergies" name="Create Allergie" element={<CreateAllergies />} />
          <Route exact path="/createCase" name="Create Allergie" element={<CreateCase />} />
          <Route exact path="/createVaccine" name="Create Vaccine" element={<CreateVaccine />} />
          <Route exact path="/createBill" name="Create Vaccine" element={<CreateBill />} />
          <Route exact path="/createReport" name="Create Report" element={<CreateReport />} />

          {/* Patient Routes */}
          <Route exact path="/Patientlogin" name="Patientlogin Login Page" element={<PatientLogin />} />
          <Route exact path="/patient/dashboard" name="Patient Dashboard" element={<PatientDashboard />} />
          <Route exact path="/LLMDiseasePred" name="LLM Disease Prediction" element={<LLMDiseasePred />} />

          {/* My Code Ends here */}
          
          <Route path="*" name="Home" element={<DefaultLayout />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
