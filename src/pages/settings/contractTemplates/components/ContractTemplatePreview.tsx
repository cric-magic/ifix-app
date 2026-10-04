import { useCurrentUser } from '../../../../contexts/AuthContext'
import { MOCK_MERCHANTS } from '../../../../constants/mockMerchants'
import { MOCK_BRANCHES } from '../../../../constants/mockBranches'
import { CONTRACT_DESK_WIDTH, ContractDocument, type SectionIndicator } from '../../../../components/ContractDocument'
import { FitToWidth } from '../../../../components/FitToWidth'
import { buildSampleContractDocument } from '../../../../utils/contractDocument'
import { normalizeSections } from '../../../../constants/contractSections'
import type { CommissionRule, ContractSection } from '../../../../types/contractTemplate'

export interface PreviewValues {
  title?: string
  bindingStatement?: string
  legalDeclarations?: string
  type?: 'fixed_rate' | 'free_rate'
  fixedRateTerms?: { months: number; ratePercent: number }[]
  maxLoanAmount?: number
  // The table's row-level Preview passes a full ContractTemplate (nested
  // `penalty.legalText`); the editor passes flat form values
  // (`penaltyLegalText`) — supporting both shapes here avoids needing two
  // separate preview components for the same content.
  penaltyLegalText?: string
  penalty?: { legalText?: string }
  sections?: ContractSection[]
  // Same two shapes as the penalty text: the table passes the template's
  // nested `commission`, the editor its flat form fields.
  commission?: CommissionRule
  commissionRatePercent?: number
  commissionText?: string
}

interface Props {
  values: PreviewValues
  // Whose contract this previews. Super Admin has no merchant of their own,
  // so the list passes the template's merchant and the editor passes the one
  // selected on the page.
  merchantId: string | undefined
  // The editor pointing at one section (see ContractDocument).
  indicator?: SectionIndicator
}

// The printed contract (see components/ContractDocument) drawn over sample
// device/customer/financial values, so what's previewed is the document the
// merchant will actually hand a customer rather than a summary of the form.
//
// Rendered inline beside the editor (live, as the doc's "the preview updates
// when the template is changed" asks for) and inside a drawer from the list —
// hence a plain component rather than something drawer-shaped. Scaled to
// fit either one rather than reflowing, same as the contract's own Preview
// tab — at phone width a reflowed page is a strip several screens long.
export function ContractTemplatePreview({ values, merchantId, indicator }: Props) {
  const actor = useCurrentUser()
  const merchant = MOCK_MERCHANTS.find(m => m.id === merchantId)

  // The actor's own branch where they have one (Staff/Branch Manager);
  // otherwise the merchant's first, since Admin/Owner aren't branch-bound
  // but the printed contract always names one.
  const branch = MOCK_BRANCHES.find(b => b.merchantId === merchantId && b.name === actor.branch)
    ?? MOCK_BRANCHES.find(b => b.merchantId === merchantId)

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
      sections: normalizeSections(values.sections),
      commission: values.commission ?? {
        ratePercent: values.commissionRatePercent ?? 0,
        text: values.commissionText ?? '',
      },
    },
  })

  return (
    <FitToWidth width={CONTRACT_DESK_WIDTH}>
      <ContractDocument data={data} indicator={indicator} />
    </FitToWidth>
  )
}
