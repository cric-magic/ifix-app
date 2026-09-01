import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DesktopStageLayout } from '../layouts/DesktopStageLayout'
import { AppLayout } from '../layouts/AppLayout'
import { RequireAuth } from './RequireAuth'
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
import { MerchantDetailPage } from '../pages/merchants/MerchantDetailPage'
import { BranchesPage } from '../pages/branches/BranchesPage'
import { BranchDetailPage } from '../pages/branches/BranchDetailPage'
import { UserListPage } from '../pages/users/UserListPage'
import { UserDetailPage } from '../pages/users/UserDetailPage'
import { AccountGeneralPage } from '../pages/account/AccountGeneralPage'
import { WorkspaceAccountPage } from '../pages/settings/WorkspaceAccountPage'
import { WorkspaceBankAccountsPage } from '../pages/settings/WorkspaceBankAccountsPage'
import { DesignDocsPage } from '../pages/design/DesignDocsPage'
import { SignInPage } from '../pages/auth/SignInPage'
import { SetPasswordPage } from '../pages/auth/SetPasswordPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'

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
      { path: '/reset-password', element: <ResetPasswordPage /> },
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
          { path: 'merchants/:id', element: <MerchantDetailPage /> },
          { path: 'branches', element: <BranchesPage /> },
          { path: 'branches/:id', element: <BranchDetailPage /> },
          { path: 'settings', element: <Navigate to="/settings/account" replace /> },
          { path: 'settings/account', element: <WorkspaceAccountPage /> },
          { path: 'settings/bank-accounts', element: <WorkspaceBankAccountsPage /> },
          { path: 'settings/members', element: <UserListPage /> },
          { path: 'settings/members/:id', element: <UserDetailPage /> },
          { path: 'account', element: <Navigate to="/account/general" replace /> },
          { path: 'account/general', element: <AccountGeneralPage /> },
        ],
      },
    ],
  },
])
