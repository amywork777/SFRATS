import { Routes, Route, Navigate } from 'react-router-dom'
import Map from './components/Map'
import ListingPage from './pages/ListingPage'
import TopBar from './components/TopBar'
import SubmitForm from './components/SubmitForm'
import About from './pages/About'
import Guidelines from './pages/Guidelines'
import EditPage from './pages/EditPage'
import ManagePage from './pages/ManagePage'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <TopBar />
      <div className="flex-1">
        <Routes>
          {/* Home route */}
          <Route path="/" element={<Map />} />

          {/* Submit new item route */}
          <Route path="/submit/new" element={
            <div className="max-w-3xl mx-auto px-4 md:px-8 pt-24 pb-16">
              <div className="mb-8">
                <span className="label">Post a Find</span>
                <h1 className="font-display font-black text-5xl md:text-6xl text-ink leading-[0.95] mt-3 tracking-tight">
                  Share something<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
                </h1>
                <div className="rule-thick mt-6" />
              </div>
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