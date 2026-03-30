import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Brands from './pages/Brands'
import BrandsNew from './pages/BrandsNew'
import Expenses from './pages/Expenses'
import ExpensesNew from './pages/ExpensesNew'
import Health from './pages/Health'
import HealthNew from './pages/HealthNew'
import Diet from './pages/Diet'
import DietNew from './pages/DietNew'
import Photos from './pages/Photos'
import PhotosNew from './pages/PhotosNew'
import Reports from './pages/Reports'
import More from './pages/More'
import Shopping from './pages/Shopping'
import ShoppingNew from './pages/ShoppingNew'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/shopping/new" element={<ShoppingNew />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/brands/new" element={<BrandsNew />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/new" element={<ExpensesNew />} />
          <Route path="/health" element={<Health />} />
          <Route path="/health/new" element={<HealthNew />} />
          <Route path="/diet" element={<Diet />} />
          <Route path="/diet/new" element={<DietNew />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/photos/new" element={<PhotosNew />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/more" element={<More />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
