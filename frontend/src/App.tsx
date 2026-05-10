import { Routes, Route, Navigate } from 'react-router-dom'
import Map from './components/Map'
import ListingPage from './pages/ListingPage'
import TopBar from './components/TopBar'
import SubmitForm from './components/SubmitForm'
import About from './pages/About'
import Agents from './pages/Agents'
import EditPage from './pages/EditPage'
import ManagePage from './pages/ManagePage'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <TopBar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Map />} />

          {/* Post a new listing */}
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

          {/* Edit + view listing */}
          <Route path="/listing/:id/edit"  element={<EditPage />} />
          <Route path="/listing/:id"       element={<ListingPage />} />
          <Route path="/listing/:id/manage" element={<ManagePage />} />

          <Route path="/about"  element={<About />} />
          <Route path="/agents" element={<Agents />} />

          {/* Guidelines used to live here — they're now part of /about */}
          <Route path="/guidelines" element={<Navigate to="/about#guidelines" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
