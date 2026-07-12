import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CoconutSales from "./pages/CoconutSales"; // <-- We rename Sales.jsx to CoconutSales.jsx
import CashewSales from "./pages/CashewSales";
import OtherIncomes from "./pages/OtherIncomes";
import EmployeeProfiles from "./pages/EmployeeProfiles";
import DailyAttendance from "./pages/DailyAttendance";
import AttendanceRecord from "./pages/AttendanceRecord";
import CashAdvances from "./pages/CashAdvances";
import RunPayroll from "./pages/RunPayroll";
import PoultryInvestors from "./pages/Poultry/Investors";
import PoultryBatches from "./pages/Poultry/Batches";
import PoultryFeeds from "./pages/Poultry/Feeds";
import PoultrySales from "./pages/Poultry/Sales";
import PoultryProfit from "./pages/Poultry/Profit";
import FertilizerManagement from "./pages/Fertilizer";
import FinanceManagement from "./pages/Finance";
import AssetManagement from "./pages/Assets";
import GeneralExpenses from "./pages/GeneralExpenses";
import MonthlyBreakdown from "./pages/MonthlyBreakdown";
import { getStoredAuth } from "./services/api";

const ProtectedRoute = ({ children }) => {
  const auth = getStoredAuth();

  if (!auth?.username || !auth?.password) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
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
            <Route path="record" element={<AttendanceRecord />} />
            <Route path="advances" element={<CashAdvances />} />
            <Route path="calculator" element={<RunPayroll />} />
          </Route>
          <Route path="expenses" element={<GeneralExpenses />} />
          <Route path="fertilizer" element={<FertilizerManagement />} />
          <Route path="poultry">
            <Route index element={<Navigate to="investors" replace />} />
            <Route path="investors" element={<PoultryInvestors />} />
            <Route path="batches" element={<PoultryBatches />} />
            <Route path="feeds" element={<PoultryFeeds />} />
            <Route path="sales" element={<PoultrySales />} />
            <Route path="profit" element={<PoultryProfit />} />
          </Route>
          <Route path="finances" element={<FinanceManagement />} />
          <Route path="assets" element={<AssetManagement />} />
          <Route path="breakdown" element={<MonthlyBreakdown />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
