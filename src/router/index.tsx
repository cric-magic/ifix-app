import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { InstallmentListPage } from '../pages/installments/InstallmentListPage'
import { InstallmentDetailPage } from '../pages/installments/InstallmentDetailPage'
import { PenaltySettingsPage } from '../pages/penalty/PenaltySettingsPage'
import { SmartCalculatorPage } from '../pages/calculator/SmartCalculatorPage'
import { CreateContractPage } from '../pages/contracts/CreateContractPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/installments" replace /> },
      { path: 'installments', element: <InstallmentListPage /> },
      { path: 'installments/:id', element: <InstallmentDetailPage /> },
      { path: 'penalty-settings', element: <PenaltySettingsPage /> },
      { path: 'calculator', element: <SmartCalculatorPage /> },
      { path: 'contracts/new', element: <CreateContractPage /> },
    ],
  },
])
