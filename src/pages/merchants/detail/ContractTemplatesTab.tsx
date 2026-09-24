import { useState } from 'react'
import { Button, Input, message } from 'antd'
import { Select } from '../../../components/AppSelect'
import { Plus, Search } from 'lucide-react'
import { useCurrentUser } from '../../../contexts/AuthContext'
import { useIconColors } from '../../../constants/iconColors'
import { MOCK_CONTRACT_TEMPLATES, generateContractTemplateId } from '../../../constants/mockContractTemplates'
import { MOCK_CONTRACTS } from '../../../constants/mockContracts'
import { canManageContractTemplates, scopedContractTemplateList } from '../../../constants/roles'
import type { ContractTemplate } from '../../../types/contractTemplate'
import { ContractTemplateTable } from '../../settings/contractTemplates/components/ContractTemplateTable'
import { ContractTemplateModal } from '../../settings/contractTemplates/components/ContractTemplateModal'

type StatusFilter = 'all' | ContractTemplate['status']
type TypeFilter = 'all' | ContractTemplate['type']

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'fixed_rate', label: 'Fixed Rate' },
  { value: 'free_rate', label: 'Free Rate' },
]

interface Props {
  // Workspace Settings renders this as a page of its own (filters and the
  // primary action above the panel); Merchant Detail renders it as one tab
  // among several, where the title and action belong in the panel's header.
  standalone?: boolean
  // Whose templates these are. Merchant Detail passes the merchant being
  // viewed (Super Admin's "for a selected merchant"); Workspace Settings
  // passes the signed-in user's own merchant.
  merchantId: string | undefined
}

// A merchant's contract templates. Rendered as a tab on Merchant Detail for
// Super Admin and as a Workspace Settings page for the merchant's own
// Admin/Owner — the same arrangement BankAccountsTab already uses, so
// merchant-owned data is managed from the merchant rather than from a
// separate screen that has to re-pick one.
export function ContractTemplatesTab({ merchantId, standalone }: Props) {
  const actor = useCurrentUser()
  const iconColors = useIconColors()
  const [version, setVersion] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null)
  void version // trigger re-render on mutation

  const canManage = canManageContractTemplates(actor)
  const scoped = scopedContractTemplateList(actor, MOCK_CONTRACT_TEMPLATES, merchantId)
  const query = search.trim().toLowerCase()
  const hasActiveFilter = !!query || statusFilter !== 'all' || typeFilter !== 'all'
  const filtered = scoped
    .filter(t => statusFilter === 'all' || t.status === statusFilter)
    .filter(t => typeFilter === 'all' || t.type === typeFilter)
    .filter(t => !query || t.name.toLowerCase().includes(query) || t.type.includes(query))

  function refresh() {
    setVersion(v => v + 1)
  }

  function handleSave(template: ContractTemplate) {
    const isNew = !MOCK_CONTRACT_TEMPLATES.some(t => t.id === template.id)
    if (isNew) {
      MOCK_CONTRACT_TEMPLATES.push(template)
    } else {
      const idx = MOCK_CONTRACT_TEMPLATES.findIndex(t => t.id === template.id)
      MOCK_CONTRACT_TEMPLATES[idx] = template
    }
    setModalOpen(false)
    setEditingTemplate(null)
    refresh()
    message.success(isNew ? 'Template created' : 'Template updated')
  }

  function handleDuplicate(template: ContractTemplate) {
    const copy: ContractTemplate = {
      ...template,
      id: generateContractTemplateId(),
      name: `Copy of ${template.name}`,
      status: 'draft',
      isDefault: false,
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
      updatedBy: null,
      updatedAt: null,
    }
    MOCK_CONTRACT_TEMPLATES.push(copy)
    refresh()
    message.success(`${template.name} duplicated`)
  }

  function handleSetDefault(template: ContractTemplate) {
    MOCK_CONTRACT_TEMPLATES
      .filter(t => t.merchantId === template.merchantId && t.type === template.type)
      .forEach(t => { t.isDefault = t.id === template.id })
    refresh()
    message.success(`${template.name} set as default`)
  }

  function handleSetStatus(template: ContractTemplate, status: ContractTemplate['status']) {
    template.status = status
    template.updatedBy = actor.id
    template.updatedAt = new Date().toISOString()
    if (status === 'archived' && template.isDefault) template.isDefault = false
    refresh()
    message.success(status === 'active' ? 'Template activated' : 'Template archived')
  }

  // Sized differently per variant: a list view gives the filters a full row
  // of their own, while the detail view shares a 56px header with the title
  // and the action button, so the search shrinks rather than pushing them.
  const filterControls = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <Input
        placeholder={standalone ? 'Search by name or type' : 'Search'}
        prefix={<Search size={15} strokeWidth={2.25} color={iconColors.secondary} />}
        allowClear
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={standalone ? { maxWidth: 320 } : { flex: '1 1 120px', minWidth: 0, maxWidth: 200 }}
      />
      <Select
        value={statusFilter}
        onChange={setStatusFilter}
        options={STATUS_OPTIONS}
        style={{ width: standalone ? 150 : 130, flexShrink: 0 }}
      />
      <Select
        value={typeFilter}
        onChange={setTypeFilter}
        options={TYPE_OPTIONS}
        style={{ width: standalone ? 150 : 130, flexShrink: 0 }}
      />
    </div>
  )

  return (
    // The settings page is a list view, so it takes the fill-height layout
    // (see .ifix-fill-page); inside a merchant's detail page it scrolls
    // with that page instead.
    <div className={standalone ? 'ifix-fill-page' : undefined}>
      {/* List view keeps its filters and primary action above the panel;
          the detail view hands both to the panel's own header row, so
          nothing belonging to this table sits outside it. See CLAUDE.md's
          "Panel header actions". */}
      {standalone && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 8, overflowX: 'auto', overflowY: 'clip' }}>
          {filterControls}
          {canManage && (
            <Button type="primary" icon={<Plus size={15} strokeWidth={2.25} />} onClick={() => { setEditingTemplate(null); setModalOpen(true) }}>
              Create Template
            </Button>
          )}
        </div>
      )}

      <ContractTemplateTable
        fillHeight={standalone}
        headerTitle={standalone ? undefined : `${filtered.length} Template${filtered.length === 1 ? '' : 's'}`}
        filters={standalone ? undefined : filterControls}
        templates={filtered}
        contracts={MOCK_CONTRACTS}
        canManage={canManage}
        hasActiveFilter={hasActiveFilter}

        headerAction={!standalone && canManage ? (
          <Button icon={<Plus size={16} strokeWidth={2.25} />} onClick={() => { setEditingTemplate(null); setModalOpen(true) }}>
            Create Template
          </Button>
        ) : undefined}
        onEdit={t => { setEditingTemplate(t); setModalOpen(true) }}
        onDuplicate={handleDuplicate}
        onSetDefault={handleSetDefault}
        onSetStatus={handleSetStatus}
      />

      <ContractTemplateModal
        open={modalOpen}
        template={editingTemplate}
        merchantId={merchantId}
        onClose={() => { setModalOpen(false); setEditingTemplate(null) }}
        onSaved={handleSave}
      />
    </div>
  )
}
