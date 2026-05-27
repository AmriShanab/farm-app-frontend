import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CoconutSales from './pages/CoconutSales'; // <-- We rename Sales.jsx to CoconutSales.jsx
import CashewSales from './pages/CashewSales';
import OtherIncomes from './pages/OtherIncomes';
import Payroll from './pages/EmployeeProfiles';
import EmployeeProfiles from './pages/EmployeeProfiles';
import DailyAttendance from './pages/DailyAttendance';
import CashAdvances from './pages/CashAdvances';
import RunPayroll from './pages/RunPayroll';
import Operations from './pages/Operations';
import PoultryManagement from './pages/Poultry';
import FertilizerManagement from './pages/Fertilizer';
import FinanceManagement from './pages/Finance';
import AssetManagement from './pages/Assets';
import GeneralExpenses from './pages/GeneralExpenses';

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

          <Route path="payroll">
            <Route index element={<Navigate to="profiles" replace />} />
            <Route path="profiles" element={<EmployeeProfiles />} />
            <Route path="attendance" element={<DailyAttendance />} />
            <Route path="advances" element={<CashAdvances />} />
            <Route path="calculator" element={<RunPayroll />} />
          </Route>
          <Route path="expenses" element={<GeneralExpenses />} />
          <Route path="fertilizer" element={<FertilizerManagement />} />
          <Route path="poultry" element={<PoultryManagement />} />
          <Route path="finances" element={<FinanceManagement />} />
          <Route path="assets" element={<AssetManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;