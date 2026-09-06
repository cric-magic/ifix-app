import { useState } from 'react'
import { Alert, Button, Input, message } from 'antd'
import { Plus, Search } from 'lucide-react'
import { useCurrentUser } from '../../contexts/AuthContext'
import { useIconColors } from '../../constants/iconColors'
import { MOCK_CONTRACT_TEMPLATES, generateContractTemplateId } from '../../constants/mockContractTemplates'
import { MOCK_CONTRACTS } from '../../constants/mockContracts'
import { canViewContractTemplates, canManageContractTemplates, scopedContractTemplateList } from '../../constants/roles'
import type { ContractTemplate } from '../../types/contractTemplate'
import { ContractTemplateTable } from './contractTemplates/components/ContractTemplateTable'
import { ContractTemplateModal } from './contractTemplates/components/ContractTemplateModal'

// Real Contract Templates list — Contract creation's "Select template" step
// depends on records here existing (see mockContractTemplates.ts's seeded
// defaults), but until now there was no management UI for them at all.
export function ContractTemplatesPage() {
  const actor = useCurrentUser()
  const iconColors = useIconColors()
  const [version, setVersion] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null)
  void version // trigger re-render on mutation

  if (!canViewContractTemplates(actor)) {
    return (
      <Alert
        type="info"
        message="Not applicable"
        description="Contract templates are scoped to a merchant workspace. Super Admin operates at the platform level."
        showIcon
      />
    )
  }

  const canManage = canManageContractTemplates(actor)
  const scoped = scopedContractTemplateList(actor, MOCK_CONTRACT_TEMPLATES)
  const query = search.trim().toLowerCase()
  const filtered = query
    ? scoped.filter(t => t.name.toLowerCase().includes(query) || t.type.includes(query))
    : scoped

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 8, overflowX: 'auto', overflowY: 'clip' }}>
        <Input
          placeholder="Search by name or type"
          prefix={<Search size={15} strokeWidth={2.25} color={iconColors.secondary} />}
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        {canManage && (
          <Button type="primary" icon={<Plus size={15} strokeWidth={2.25} />} onClick={() => { setEditingTemplate(null); setModalOpen(true) }}>
            Create Template
          </Button>
        )}
      </div>

      <ContractTemplateTable
        templates={filtered}
        contracts={MOCK_CONTRACTS}
        canManage={canManage}
        search={search}
        onEdit={t => { setEditingTemplate(t); setModalOpen(true) }}
        onDuplicate={handleDuplicate}
        onSetDefault={handleSetDefault}
        onSetStatus={handleSetStatus}
      />

      <ContractTemplateModal
        open={modalOpen}
        template={editingTemplate}
        onClose={() => { setModalOpen(false); setEditingTemplate(null) }}
        onSaved={handleSave}
      />
    </div>
  )
}
