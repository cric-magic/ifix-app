import { createPortal } from 'react-dom'
import type { Contract } from '../../../types/contract'
import { MOCK_MERCHANTS } from '../../../constants/mockMerchants'
import { MOCK_BRANCHES } from '../../../constants/mockBranches'
import { ContractDocument } from '../../../components/ContractDocument'
import { buildContractDocument } from '../../../utils/contractDocument'

// A print-only copy of the contract, so the header's "Print Contract" can
// print from anywhere on the detail page rather than only once the
// Contract Preview tab has been opened (that tab is what put the document
// in the DOM before). Hidden on screen by .ifix-print-copy; the print rules
// in index.css show it, and print it in place of the preview tab's copy
// when both exist so the two sheets don't stack on top of each other.
export function ContractPrintCopy({ contract }: { contract: Contract }) {
  const merchant = MOCK_MERCHANTS.find(m => m.id === contract.merchantId)
  const branch = MOCK_BRANCHES.find(b => b.merchantId === contract.merchantId && b.name === contract.branch)

  return createPortal(
    <div className="ifix-print-copy">
      <ContractDocument data={buildContractDocument(contract, merchant, branch)} />
    </div>,
    document.body,
  )
}
