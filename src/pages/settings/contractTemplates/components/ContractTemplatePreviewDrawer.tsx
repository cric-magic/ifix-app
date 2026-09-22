import { Drawer } from 'antd'
import { useAppWindowContainer } from '../../../../contexts/AppWindowContext'
import { useCurrentUser } from '../../../../contexts/AuthContext'
import { MOCK_MERCHANTS } from '../../../../constants/mockMerchants'
import { MOCK_BRANCHES } from '../../../../constants/mockBranches'
import { ContractDocument } from '../../../../components/ContractDocument'
import { buildSampleContractDocument } from '../../../../utils/contractDocument'

interface PreviewValues {
  title?: string
  bindingStatement?: string
  legalDeclarations?: string
  type?: 'fixed_rate' | 'free_rate'
  fixedRateTerms?: { months: number; ratePercent: number }[]
  maxLoanAmount?: number
  // The table's row-level Preview passes a full ContractTemplate (nested
  // `penalty.legalText`); the in-form Preview passes flat form values
  // (`penaltyLegalText`) — supporting both shapes here avoids needing two
  // separate preview components for the same content.
  penaltyLegalText?: string
  penalty?: { legalText?: string }
}

interface Props {
  open: boolean
  onClose: () => void
  values: PreviewValues
}

// Renders the real printed contract (see components/ContractDocument) over
// sample device/customer/financial values, so what's previewed is the
// document the merchant will actually hand a customer rather than a summary
// of the form. Per the doc the preview "updates when the template is
// changed" — the caller passes live form values, and only the fields the
// template owns (title, binding statement, legal declarations, and the
// rate driving the schedule) differ between renders.
export function ContractTemplatePreviewDrawer({ open, onClose, values }: Props) {
  const appWindow = useAppWindowContainer()
  const actor = useCurrentUser()
  const merchant = MOCK_MERCHANTS.find(m => m.id === actor.merchantId)

  // The actor's own branch where they have one (Staff/Branch Manager);
  // otherwise the merchant's first, since Admin/Owner aren't branch-bound
  // but the printed contract always names one.
  const branch = MOCK_BRANCHES.find(b => b.merchantId === actor.merchantId && b.name === actor.branch)
    ?? MOCK_BRANCHES.find(b => b.merchantId === actor.merchantId)

  // Free Rate templates set rate and term per contract rather than on the
  // template, so the preview borrows a representative term to draw a
  // schedule with — there is nothing on the template itself to read.
  const term = values.fixedRateTerms?.[0] ?? { months: 12, ratePercent: 1.75 }

  const data = buildSampleContractDocument({
    merchant,
    branch,
    termMonths: term.months,
    ratePercent: term.ratePercent,
    content: {
      title: values.title || 'Untitled Template',
      bindingStatement: values.bindingStatement ?? '',
      legalDeclarations: values.legalDeclarations ?? '',
      penaltyLegalText: values.penaltyLegalText ?? values.penalty?.legalText,
    },
  })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Contract preview"
      width={760}
      destroyOnHidden
      getContainer={appWindow ?? undefined}
    >
      <ContractDocument data={data} />
    </Drawer>
  )
}
