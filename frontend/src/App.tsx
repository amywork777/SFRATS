import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Map from './components/Map'
import ListingPage from './pages/ListingPage'
import TopBar from './components/TopBar'
import SubmissionsList from './components/SubmissionsList'
import SubmitForm from './components/SubmitForm'
import { useState, useEffect } from 'react'
import AboutPage from './pages/AboutPage'
import GuidelinesPage from './pages/GuidelinesPage'
import EditPage from './pages/EditPage'

function App() {
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const location = useLocation()

  // Reset submit form when navigating away from home
  useEffect(() => {
    if (location.pathname !== '/') {
      setShowSubmitForm(false)
    }
  }, [location.pathname])

  const handleHomeClick = () => {
    setShowSubmitForm(false)
  }

  useEffect(() => {
    // Check if we have a submit parameter in the URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('submit') === 'true') {
      setShowSubmitForm(true)
      // Clean up the URL
      window.history.replaceState({}, '', '/')
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar 
        onSubmitClick={() => {
          if (location.pathname === '/') {
            setShowSubmitForm(true)
          } else {
            // Navigate to home and show form
            window.location.href = '/?submit=true'
          }
        }} 
        onHomeClick={handleHomeClick}
      />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={
            <div className="h-[calc(100vh-4rem)]">
              {showSubmitForm ? (
                <SubmitForm />
              ) : (
                <>
                  <div className="h-full pr-96">
                    <Map />
                  </div>
                  <SubmissionsList />
                </>
              )}
            </div>
          } />
          <Route path="/listing/:id" element={<ListingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="/edit/:id" element={<EditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App 