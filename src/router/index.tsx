import { createBrowserRouter, Navigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { DesktopStageLayout } from '../layouts/DesktopStageLayout'
import { AppLayout } from '../layouts/AppLayout'
import { RequireAuth } from './RequireAuth'
import { PlaceholderPage } from '../components/PlaceholderPage'
import { InstallmentListPage } from '../pages/installments/InstallmentListPage'
import { InstallmentDetailPage } from '../pages/installments/InstallmentDetailPage'
import { PenaltySettingsPage } from '../pages/penalty/PenaltySettingsPage'
import { SmartCalculatorPage } from '../pages/calculator/SmartCalculatorPage'
import { CreateContractPage } from '../pages/contracts/CreateContractPage'
import { ContractsListPage } from '../pages/contracts/ContractsListPage'
import { ProductsPage } from '../pages/products/ProductsPage'
import { ProductDetailPage } from '../pages/products/ProductDetailPage'
import { UnitsListPage } from '../pages/products/UnitsListPage'
import { UnitDetailPage } from '../pages/products/UnitDetailPage'
import { CustomersPage } from '../pages/customers/CustomersPage'
import { MerchantsPage } from '../pages/merchants/MerchantsPage'
import { BranchesPage } from '../pages/branches/BranchesPage'
import { UserListPage } from '../pages/users/UserListPage'
import { AccountGeneralPage } from '../pages/account/AccountGeneralPage'
import { DesignDocsPage } from '../pages/design/DesignDocsPage'
import { SignInPage } from '../pages/auth/SignInPage'
import { SetPasswordPage } from '../pages/auth/SetPasswordPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'

export const router = createBrowserRouter([
  // /design-docs is deliberately NOT nested under DesktopStageLayout below —
  // it renders as its own plain full-size page (no desktop background, no
  // window chrome, not resizable), separate from the rest of the app.
  { path: '/design-docs', element: <DesignDocsPage /> },
  {
    element: <DesktopStageLayout />,
    children: [
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/set-password', element: <SetPasswordPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      {
        path: '/',
        element: <RequireAuth><AppLayout /></RequireAuth>,
        children: [
          { index: true, element: <Navigate to="/contracts" replace /> },
          { path: 'installments', element: <InstallmentListPage /> },
          { path: 'installments/:id', element: <InstallmentDetailPage /> },
          { path: 'penalty-settings', element: <PenaltySettingsPage /> },
          { path: 'calculator', element: <SmartCalculatorPage /> },
          { path: 'contracts/new', element: <CreateContractPage /> },
          { path: 'contracts', element: <ContractsListPage /> },
          { path: 'products', element: <Navigate to="/products/catalog" replace /> },
          { path: 'products/catalog', element: <ProductsPage /> },
          { path: 'products/catalog/:id', element: <ProductDetailPage /> },
          { path: 'products/unit', element: <UnitsListPage /> },
          { path: 'products/unit/:id', element: <UnitDetailPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'merchants', element: <MerchantsPage /> },
          { path: 'branches', element: <BranchesPage /> },
          { path: 'settings', element: <Navigate to="/settings/general" replace /> },
          { path: 'settings/general', element: <PlaceholderPage icon={<SlidersHorizontal size={26} strokeWidth={2} />} title="General" /> },
          { path: 'settings/members', element: <UserListPage /> },
          { path: 'account', element: <Navigate to="/account/general" replace /> },
          { path: 'account/general', element: <AccountGeneralPage /> },
        ],
      },
    ],
  },
])
