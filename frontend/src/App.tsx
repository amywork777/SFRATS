import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Map from './components/Map'
import ListingPage from './pages/ListingPage'
import TopBar from './components/TopBar'
import SubmissionsList from './components/SubmissionsList'
import SubmitForm from './components/SubmitForm'
import About from './pages/About'
import Guidelines from './pages/Guidelines'
import EditPage from './pages/EditPage'
import ManagePage from './pages/ManagePage'

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar 
        onSubmitClick={() => {
          window.location.href = '/submit/new'
        }} 
        onHomeClick={() => {
          window.location.href = '/'
        }}
      />
      <div className="flex-1">
        <Routes>
          {/* Home route */}
          <Route path="/" element={
            <div className="h-[calc(100vh-4rem)]">
              <div className="h-full pr-96">
                <Map />
              </div>
              <SubmissionsList />
            </div>
          } />

          {/* Submit new item route */}
          <Route path="/submit/new" element={
            <div className="max-w-4xl mx-auto p-4 pt-20">
              <h1 className="text-2xl font-bold mb-4">Submit New Listing</h1>
              <SubmitForm />
            </div>
          } />

          {/* Edit item route with edit code */}
          <Route path="/listing/:id/edit/:editCode" element={<EditPage />} />

          {/* View listing route */}
          <Route path="/listing/:id" element={<ListingPage />} />
          
          <Route path="/about" element={<About />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/listing/:id/manage" element={<ManagePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App 