import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DesktopStageLayout } from '../layouts/DesktopStageLayout'
import { AppLayout } from '../layouts/AppLayout'
import { RequireAuth } from './RequireAuth'
import { HeaderContentProvider } from '../contexts/HeaderContentContext'
import { HomeRedirect } from './HomeRedirect'
import { SmartCalculatorPage } from '../pages/calculator/SmartCalculatorPage'
import { CreateContractPage } from '../pages/contracts/CreateContractPage'
import { EditContractPage } from '../pages/contracts/EditContractPage'
import { ContractsListPage } from '../pages/contracts/ContractsListPage'
import { ContractDetailPage } from '../pages/contracts/ContractDetailPage'
import { ProductsCatalogRoute } from './ProductsCatalogRoute'
import { ProductDetailRoute } from './ProductDetailRoute'
import { UnitsListPage } from '../pages/products/UnitsListPage'
import { UnitDetailPage } from '../pages/products/UnitDetailPage'
import { CustomersPage } from '../pages/customers/CustomersPage'
import { CustomerDetailPage } from '../pages/customers/CustomerDetailPage'
import { MerchantsPage } from '../pages/merchants/MerchantsPage'
import { MerchantDetailPage } from '../pages/merchants/MerchantDetailPage'
import { BranchesPage } from '../pages/branches/BranchesPage'
import { BranchDetailPage } from '../pages/branches/BranchDetailPage'
import { UserListPage } from '../pages/users/UserListPage'
import { UserDetailPage } from '../pages/users/UserDetailPage'
import { AccountGeneralPage } from '../pages/account/AccountGeneralPage'
import { WorkspaceAccountPage } from '../pages/settings/WorkspaceAccountPage'
import { WorkspaceBarcodePage } from '../pages/settings/WorkspaceBarcodePage'
import { WorkspaceBankAccountsPage } from '../pages/settings/WorkspaceBankAccountsPage'
import { AttributesPage } from '../pages/products/AttributesPage'
import { WorkspaceContractTemplatesPage } from '../pages/settings/WorkspaceContractTemplatesPage'
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
        element: <RequireAuth><HeaderContentProvider><AppLayout /></HeaderContentProvider></RequireAuth>,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: 'calculator', element: <SmartCalculatorPage /> },
          { path: 'contracts/new', element: <CreateContractPage /> },
          { path: 'contracts', element: <ContractsListPage /> },
          { path: 'contracts/:id', element: <ContractDetailPage /> },
          { path: 'contracts/:id/edit', element: <EditContractPage /> },
          { path: 'products', element: <Navigate to="/products/catalog" replace /> },
          { path: 'products/catalog', element: <ProductsCatalogRoute /> },
          { path: 'products/catalog/:id', element: <ProductDetailRoute /> },
          { path: 'products/unit', element: <UnitsListPage /> },
          { path: 'products/unit/:id', element: <UnitDetailPage /> },
          { path: 'products/attributes', element: <AttributesPage /> },
          { path: 'products/attributes/:type', element: <AttributesPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'customers/:id', element: <CustomerDetailPage /> },
          { path: 'merchants', element: <MerchantsPage /> },
          { path: 'merchants/:id', element: <MerchantDetailPage /> },
          { path: 'branches', element: <BranchesPage /> },
          { path: 'branches/:id', element: <BranchDetailPage /> },
          { path: 'settings', element: <Navigate to="/settings/account" replace /> },
          { path: 'settings/account', element: <WorkspaceAccountPage /> },
          { path: 'settings/bank-accounts', element: <WorkspaceBankAccountsPage /> },
          { path: 'settings/barcode', element: <WorkspaceBarcodePage /> },
          { path: 'settings/contract-templates', element: <WorkspaceContractTemplatesPage /> },
          { path: 'settings/members', element: <UserListPage /> },
          { path: 'settings/members/:id', element: <UserDetailPage /> },
          { path: 'account', element: <Navigate to="/account/general" replace /> },
          { path: 'account/general', element: <AccountGeneralPage /> },
        ],
      },
    ],
  },
])
