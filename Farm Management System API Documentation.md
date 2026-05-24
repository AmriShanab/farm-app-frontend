# Farm Management System API Documentation

## Sales Module

| Method | Endpoint | Description | Payload / Query Params |
|--------|----------|-------------|------------------------|
| GET | `/api/sales/coconuts` | Get coconut sales ledger | `?farm=MR1&date=YYYY-MM-DD` |
| POST | `/api/sales/coconuts` | Record new coconut sale | `{ date, farm, qty1, rate1, disc1, qty2, rate2 }` |
| GET | `/api/sales/cashews` | Get cashew nuts ledger | `?year=2024` |
| POST | `/api/sales/cashews` | Record new cashew sale | `{ date, kg, rate }` |
| GET | `/api/sales/other` | Get miscellaneous incomes | `?category=Timber` |
| POST | `/api/sales/other` | Record other income | `{ date, category, desc, amount }` |

---

## Human Resources (HR) Module

| Method | Endpoint | Description | Payload / Query Params |
|--------|----------|-------------|------------------------|
| GET | `/api/hr/employees` | Get all employee profiles | `?farm=MR1&status=active` |
| POST | `/api/hr/employees` | Add new employee | `{ name, role, farm, type, wage }` |
| GET | `/api/hr/attendance` | Get attendance by date | `?date=YYYY-MM-DD` |
| POST | `/api/hr/attendance/bulk` | Save daily attendance | `{ date, records: [{ empId, status }] }` |
| GET | `/api/hr/advances` | Get cash advances | `?status=Unpaid` |
| POST | `/api/hr/advances` | Issue new cash advance | `{ date, empId, amount }` |
| GET | `/api/hr/payroll/preview` | Calculate draft payroll | `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` |
| POST | `/api/hr/payroll/finalize` | Finalize payroll (locks advances) | `{ period, employeePayouts: [...] }` |

---

## Dashboard Module

| Method | Endpoint | Description | Payload / Query Params |
|--------|----------|-------------|------------------------|
| GET | `/api/dashboard/summary` | Get top-level KPI widgets | `?month=05&year=2026` |
| GET | `/api/dashboard/recent` | Get 5 most recent activities | Combines sales & payroll |

---

## Notes

- All endpoints return JSON responses.
- Authentication middleware should be applied to protected routes.
- Dates should follow the `YYYY-MM-DD` format.
- Payroll finalization should lock related advance records to prevent duplicate processing.