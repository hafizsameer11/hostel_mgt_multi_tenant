import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Hostels from './pages/Hostels'
import Login from './pages/Login'
import Register from './pages/Register'
import { AdminRoutes } from './admin/routes/AdminRoutes'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/hostels" element={<Hostels />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    </div>
  )
}

export default App
