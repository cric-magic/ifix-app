import { useEffect, useState } from 'react'
import { App, Button, Form, Input, Modal, Space, Typography } from 'antd'
import { InputNumber } from '../../../components/AppInputNumber'
import { Check, X, Printer, Upload, Wallet } from 'lucide-react'
import { Select } from '../../../components/AppSelect'
import type { AuthUser } from '../../../types/installment'
import type { Contract, ContractPaymentRecord, SignedContractFile } from '../../../types/contract'
import { canApproveContract } from '../../../constants/roles'
import { getOutstandingBalance, buildActivationSchedule } from '../../../utils/contract'
import { MOCK_PRODUCT_UNITS } from '../../../constants/mockProductUnits'
import { PhotoUpload } from '../../../components/PhotoUpload'
import { SignedCopyUpload } from './SignedCopyUpload'
import { ContractPrintCopy } from './ContractPrintCopy'

interface Props {
  contract: Contract
  actor: AuthUser
  onChanged: () => void
}

// Drives the doc's Contract Creation Flow / Approval / Signing & Activation
// sections after creation — one primary action (plus Reject, alongside
// Approve, at the review step) per status, so the whole lifecycle is
// walkable from the detail page without a separate workflow screen.
export function LifecycleActions({ contract, actor, onChanged }: Props) {
  const { modal, message } = App.useApp()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [rejectForm] = Form.useForm()
  const [paymentForm] = Form.useForm()
  const [uploadForm] = Form.useForm()
  const uploadedFiles = Form.useWatch('files', uploadForm) as SignedContractFile[] | undefined

  function startReview() {
    contract.status = 'under_review'
    message.success('Review started')
    onChanged()
  }

  function approve() {
    contract.status = 'approved'
    contract.approvedBy = actor.id
    contract.approvedAt = new Date().toISOString()
    message.success('Contract approved')
    onChanged()
  }

  function handleReject(values: { note: string }) {
    contract.status = 'rejected'
    contract.rejectedBy = actor.id
    contract.rejectedAt = new Date().toISOString()
    contract.rejectionNote = values.note
    // Release the unit reserved at contract creation (CreateContractPage) —
    // otherwise a rejected contract leaves it stuck out of the available
    // pool forever, with no contract left to ever un-reserve it.
    const unit = MOCK_PRODUCT_UNITS.find(u => u.id === contract.device.unitId)
    if (unit) unit.availability = 'available'
    setRejectOpen(false)
    rejectForm.resetFields()
    message.success('Contract rejected')
    onChanged()
  }

  // Print Contract mounts a print-only copy of the document, opens the
  // browser's print dialog once it's rendered, then asks whether it
  // actually printed. The doc moves the contract to Awaiting Signature on
  // printing, but the browser can't tell a printed dialog from a cancelled
  // one — so the status only moves on a confirmed yes, and "Not yet" leaves
  // it Approved to try again.
  const [printing, setPrinting] = useState(false)
  const [confirmPrintedOpen, setConfirmPrintedOpen] = useState(false)

  useEffect(() => {
    if (!printing) return
    const frame = requestAnimationFrame(() => {
      window.print()
      setPrinting(false)
      setConfirmPrintedOpen(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [printing])

  function markPrinted() {
    contract.status = 'awaiting_signature'
    setConfirmPrintedOpen(false)
    message.success('Marked as awaiting signature')
    onChanged()
  }

  function handleUploadSignedCopy(values: { files: SignedContractFile[] }) {
    contract.signedContract = {
      files: values.files,
      uploadedBy: actor.id,
      uploadedAt: new Date().toISOString(),
    }
    contract.status = 'pending_payment'
    setUploadOpen(false)
    uploadForm.resetFields()
    message.success('Signed copy uploaded')
    onChanged()
  }

  function handleRecordPayment(values: { amount: number; method: ContractPaymentRecord['method']; slipPhotos: string[] }) {
    const { schedule, payments } = buildActivationSchedule(contract.financing, actor.id)
    // The doc's activation trigger is recording the down payment — the
    // amount/method entered here become that first payment row instead of
    // buildActivationSchedule's own default, so a partial or different-
    // method down payment is reflected accurately.
    payments[0] = { ...payments[0], amount: values.amount, method: values.method, slipPhotos: values.slipPhotos }
    contract.schedule = schedule
    contract.payments = payments
    contract.status = 'active'
    contract.activatedAt = new Date().toISOString()
    // The device actually leaves the merchant's hands right here, not at
    // Settled (which only means the debt's paid off) — so this is the
    // real-world "sale" moment, mirroring what the Products module does
    // for a walk-in sale.
    const unit = MOCK_PRODUCT_UNITS.find(u => u.id === contract.device.unitId)
    if (unit) {
      unit.availability = 'sold'
      unit.soldAt = contract.activatedAt
      unit.soldBy = actor.id
    }
    setPaymentOpen(false)
    paymentForm.resetFields()
    message.success('Down payment recorded — contract is now Active')
    onChanged()
  }

  function markSettled() {
    contract.status = 'settled'
    contract.settledAt = new Date().toISOString()
    message.success('Contract settled')
    onChanged()
  }

  const canReview = canApproveContract(actor)

  // Draft and Rejected are the doc's "edit and resubmit" statuses — per
  // the Contract Creation flow, submitting/resubmitting only ever happens
  // as the last step of actually editing the contract (EditContractPage's
  // own submit button), not as a bare status-flip button here with no
  // chance to fix anything first. No action renders here for either
  // status; ContractDetailPage's own "Edit" button (canEditContractFields,
  // creator-only) is the sole entry point into that flow.
  if (contract.status === 'draft' || contract.status === 'rejected') {
    return null
  }

  if (contract.status === 'pending_approval' && canReview) {
    return <Button type="primary" onClick={startReview}>Start Review</Button>
  }

  if (contract.status === 'under_review' && canReview) {
    return (
      <Space size={4}>
        <Button danger icon={<X size={16} strokeWidth={2.25} />} onClick={() => setRejectOpen(true)}>Reject</Button>
        <Button type="primary" icon={<Check size={16} strokeWidth={2.25} />} onClick={approve}>Approve</Button>
        <Modal
          title="Reject this contract?"
          open={rejectOpen}
          onCancel={() => setRejectOpen(false)}
          okText="Reject"
          okButtonProps={{ danger: true }}
          onOk={() => rejectForm.validateFields().then(handleReject)}
        >
          <Form form={rejectForm} layout="vertical">
            <Form.Item label="Rejection note" name="note" rules={[{ required: true, message: 'A note is required so Staff knows what to fix.' }]}>
              <Input.TextArea rows={3} placeholder="e.g. ID card photo is blurry — please re-upload." />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    )
  }

  if (contract.status === 'approved') {
    return (
      <>
        <Button type="primary" icon={<Printer size={16} strokeWidth={2.25} />} onClick={() => setPrinting(true)}>Print Contract</Button>
        {printing && <ContractPrintCopy contract={contract} />}
        <Modal
          title="Did the contract print?"
          open={confirmPrintedOpen}
          onCancel={() => setConfirmPrintedOpen(false)}
          cancelText="Not yet"
          okText="Yes, it printed"
          onOk={markPrinted}
        >
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            The contract will move to Awaiting Signature so you can upload the signed copy.
          </Typography.Paragraph>
        </Modal>
      </>
    )
  }

  if (contract.status === 'awaiting_signature') {
    return (
      <>
        <Button type="primary" icon={<Upload size={16} strokeWidth={2.25} />} onClick={() => setUploadOpen(true)}>Upload Signed Copy</Button>
        <Modal
          title="Upload signed copy"
          open={uploadOpen}
          onCancel={() => { setUploadOpen(false); uploadForm.resetFields() }}
          okText="Upload"
          // Nothing to confirm until there's a file — the status only moves
          // on once the signed copy is actually attached to the contract.
          okButtonProps={{ disabled: !uploadedFiles?.length }}
          onOk={() => uploadForm.validateFields().then(handleUploadSignedCopy)}
        >
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Attach the contract the customer signed. It's kept on this contract under Contract Preview → Signed copy, and the contract moves to Pending Payment.
          </Typography.Paragraph>
          <Form form={uploadForm} layout="vertical">
            <Form.Item name="files" rules={[{ required: true, message: 'Attach the signed copy' }]} style={{ marginBottom: 0 }}>
              <SignedCopyUpload />
            </Form.Item>
          </Form>
        </Modal>
      </>
    )
  }

  if (contract.status === 'pending_payment') {
    return (
      <>
        <Button type="primary" icon={<Wallet size={16} strokeWidth={2.25} />} onClick={() => setPaymentOpen(true)}>Record Down Payment</Button>
        <Modal
          title="Record down payment"
          open={paymentOpen}
          onCancel={() => setPaymentOpen(false)}
          okText="Record & Activate"
          onOk={() => paymentForm.validateFields().then(handleRecordPayment)}
        >
          <Form form={paymentForm} layout="vertical" initialValues={{ amount: contract.financing.downPaymentAmount, method: 'transfer' }}>
            <Form.Item label="Amount (฿)" name="amount" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber style={{ width: '100%' }} min={0} step={100} addonBefore="฿" />
            </Form.Item>
            <Form.Item label="Method" name="method" rules={[{ required: true, message: 'Required' }]}>
              <Select options={[{ value: 'cash', label: 'Cash' }, { value: 'transfer', label: 'Transfer' }, { value: 'card', label: 'Card' }]} />
            </Form.Item>
            {/* Same field and label as the regular Record Payment drawer
                (ScheduleTab) — the doc's "amount + receipt photo" for the
                down payment, kept on that payment row like any other slip. */}
            <Form.Item label="Payment Slip Photo" name="slipPhotos" rules={[{ required: true, message: 'Required' }]}>
              <PhotoUpload />
            </Form.Item>
          </Form>
        </Modal>
      </>
    )
  }

  if ((contract.status === 'active' || contract.status === 'overdue') && getOutstandingBalance(contract) === 0) {
    return (
      <Button
        type="primary"
        onClick={() => modal.confirm({ title: 'Mark this contract as settled?', okText: 'Settle', onOk: markSettled })}
      >
        Mark Settled
      </Button>
    )
  }

  return null
}
