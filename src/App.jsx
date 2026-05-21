import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CoconutSales from './pages/CoconutSales'; // <-- We rename Sales.jsx to CoconutSales.jsx
import CashewSales from './pages/CashewSales';
import OtherIncomes from './pages/OtherIncomes';

const Placeholder = ({ title }) => (
  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center mt-10">
    <h2 className="text-xl font-bold text-text font-heading">{title}</h2>
    <p className="text-earth mt-2 text-sm">This specific sub-module is ready to be designed next.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          
          {/* Sub-Routes for Sales & Income */}
          <Route path="sales">
             {/* Automatically redirect /sales to the coconuts page */}
             <Route index element={<Navigate to="coconuts" replace />} />
             <Route path="coconuts" element={<CoconutSales />} />
             <Route path="cashews" element={<CashewSales />} />
             <Route path="other" element={<OtherIncomes />} />
          </Route>

          <Route path="payroll" element={<Placeholder title="HR & Payroll" />} />
          <Route path="operations" element={<Placeholder title="Operations & Expenses" />} />
          <Route path="fertilizer" element={<Placeholder title="Fertilizer Management" />} />
          <Route path="poultry" element={<Placeholder title="Poultry Farm (Joint Venture)" />} />
          <Route path="finances" element={<Placeholder title="Finances & Banking" />} />
          <Route path="assets" element={<Placeholder title="Assets & Warranty" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;