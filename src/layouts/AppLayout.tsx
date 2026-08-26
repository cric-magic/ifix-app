import { useState } from 'react'
import { Avatar, Button, Dropdown, Layout, Menu, Typography, theme } from 'antd'
import {
  User, Package, FileText, Contact, Building2, Store,
  MoreHorizontal, LogOut, IdCard, ChevronsUpDown, UserPlus,
  Settings, ChevronLeft, PanelLeftClose, PanelLeftOpen, ChevronRight,
} from 'lucide-react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, useCurrentUser } from '../contexts/AuthContext'
import { canManageUsers, scopedUserList } from '../constants/roles'
import { useIconColors } from '../constants/iconColors'
import { MOCK_USER_ACCOUNTS, MERCHANT_ID } from '../constants/mockUsers'
import { MOCK_PRODUCTS } from '../constants/mockProducts'
import { MOCK_PRODUCT_UNITS } from '../constants/mockProductUnits'
import { getAvatarUrl, getWorkspaceAvatarUrl } from '../utils/avatar'

const { Header, Sider, Content } = Layout

const PAGE_TITLES: Record<string, string> = {
  'products': 'Products',
  'contracts': 'Contracts',
  'customers': 'Customers',
  'merchants': 'Merchants',
  'branches': 'Branches',
  'settings': 'Workspace Settings',
  'account': 'Account Settings',
}

const SETTINGS_ITEMS = [
  { key: 'general', label: 'General' },
  { key: 'members', label: 'Members' },
]

const ACCOUNT_ITEMS = [
  { key: 'general', label: 'General' },
]

const PRODUCTS_ITEMS = [
  { key: 'catalog', label: 'Catalog' },
  { key: 'unit', label: 'Unit' },
]

export function AppLayout() {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()
  const iconColors = useIconColors()
  const [collapsed, setCollapsed] = useState(false)

  // Main nav icons sit in a 28×28 box — same size as the workspace logo box
  // and the avatar — so every icon anchor in the sidebar lines up on the
  // same grid. No background here (unlike the logo box): this is purely a
  // sizing/centering box for the glyph, not a tile.
  function navIcon(icon: React.ReactNode) {
    return (
      <div style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
    )
  }

  const selectedKey = Object.keys(PAGE_TITLES).find(key => location.pathname.startsWith(`/${key}`)) ?? ''
  const inSettings = location.pathname.startsWith('/settings')
  const settingsKey = location.pathname.split('/')[2] ?? 'general'
  const inAccount = location.pathname.startsWith('/account')
  const accountKey = location.pathname.split('/')[2] ?? 'general'
  const inProducts = location.pathname.startsWith('/products')
  const productsKey = location.pathname.split('/')[2] ?? 'catalog'

  const pageTitle = inSettings
    ? (settingsKey === 'general' ? 'Workspace Settings' : SETTINGS_ITEMS.find(i => i.key === settingsKey)?.label ?? 'Workspace Settings')
    : inProducts
    ? (productsKey === 'unit' ? 'Units' : 'Products')
    : PAGE_TITLES[selectedKey] ?? 'IFix'

  // Product detail route (/products/catalog/:id) — show a 2-level breadcrumb
  // ("Products / <name>") instead of the flat section title.
  const productDetailId = inProducts && productsKey === 'catalog' ? location.pathname.split('/')[3] : undefined
  const productDetailName = productDetailId ? MOCK_PRODUCTS.find(p => p.id === productDetailId)?.name : undefined

  // Unit detail route (/products/unit/:id) — same 2-level treatment
  // ("Units / <IMEI>"), parallel to the product detail breadcrumb above.
  const unitDetailId = inProducts && productsKey === 'unit' ? location.pathname.split('/')[3] : undefined
  const unitDetailImei = unitDetailId ? MOCK_PRODUCT_UNITS.find(u => u.id === unitDetailId)?.imei : undefined

  // Member detail route (/settings/members/:id) — same 2-level treatment
  // ("Members / <name>"), parallel to the product/unit breadcrumbs above.
  // Looked up through scopedUserList (not the raw account list) so a member
  // outside the viewer's own scope doesn't leak their name into the
  // breadcrumb even though the page itself correctly blocks access to them.
  const memberDetailId = inSettings && settingsKey === 'members' ? location.pathname.split('/')[3] : undefined
  const memberDetailName = memberDetailId
    ? scopedUserList(user, MOCK_USER_ACCOUNTS).find(u => u.id === memberDetailId)?.name
    : undefined

  const breadcrumbParts = productDetailName
    ? ['Products', productDetailName]
    : unitDetailImei
    ? ['Units', unitDetailImei]
    : memberDetailName
    ? ['Members', memberDetailName]
    : [pageTitle]
  const breadcrumbBackUrl = unitDetailImei
    ? '/products/unit'
    : memberDetailName
    ? '/settings/members'
    : '/products/catalog'

  function handleLogout() {
    logout()
    navigate('/sign-in', { replace: true })
  }

  return (
    <Layout style={{ height: '100%', background: 'transparent' }}>
      <Sider width={220} collapsedWidth={220} collapsed={false} trigger={null} style={{
        background: 'transparent',
        border: 'none',
        position: 'sticky',
        top: 0,
        height: '100%',
        padding: '8px 0 8px 8px',
        overflow: 'hidden',
        flexShrink: 0,
        // The box's own width (220) never changes — collapsed={false} is
        // hardcoded above so antd never shrinks it. Instead: `transform`
        // slides the whole box (padding, border, everything) off-screen —
        // a pure visual move that never causes any child to render at an
        // in-between width and squish (see the "IFix" title wrap bug this
        // replaces) — while the negative `marginRight` shrinks its actual
        // flex footprint to 0 in step, so the main panel still reflows to
        // fill the freed space exactly as it did when the box itself used
        // to shrink.
        transform: collapsed ? 'translateX(-220px)' : 'translateX(0)',
        marginRight: collapsed ? -220 : 0,
        transition: 'transform var(--ant-motion-duration-mid), margin-right var(--ant-motion-duration-mid)',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          <Dropdown
            trigger={['click']}
            placement="bottomLeft"
            dropdownRender={menu => <div style={{ margin: '4px 4px 0' }}>{menu}</div>}
            menu={{
              items: [
                {
                  key: 'workspace-info',
                  disabled: true,
                  style: { height: 'auto', cursor: 'default', padding: '8px' },
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img
                        className="ifix-logo-box"
                        src={getWorkspaceAvatarUrl(MERCHANT_ID)}
                        alt=""
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: token.colorFillSecondary,
                          flexShrink: 0,
                          objectFit: 'cover',
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 14, lineHeight: '18px', fontWeight: 600, color: token.colorText }}>IFix</div>
                        <div style={{ fontSize: 12, lineHeight: '16px', color: token.colorTextSecondary }}>{MOCK_USER_ACCOUNTS.length} members</div>
                      </div>
                    </div>
                  ),
                },
                { type: 'divider' },
                { key: 'settings', icon: <Settings size={17} strokeWidth={2.25} />, label: 'Settings' },
                ...(canManageUsers(user)
                  ? [{ key: 'invite', icon: <UserPlus size={17} strokeWidth={2.25} />, label: 'Invite members' }]
                  : []),
              ],
              onClick: ({ key }) => {
                if (key === 'settings') navigate('/settings/general')
                if (key === 'invite') navigate('/settings/members?invite=1')
              },
            }}
          >
            <div style={{
              height: 56,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              // Right padding set to 8px (Spacing 2) so this button's right edge lines up
              // in the same column as the other two sidebar icon buttons (avatar "..." row
              // and the Products menu item's chevron) rather than each row's own vertical-
              // centering gap, which put all three at different horizontal offsets.
              // Left padding matches (8px) so the workspace icon aligns with the
              // back-chevron column and the main nav icons (all trimmed to the same
              // 4px item padding below). Previously 8.5px (exact antd button-height
              // centering math) — rounded to the scale, per the project-wide move to
              // trace every padding/margin/gap back to it.
              padding: '0 8px 0 8px',
              flexShrink: 0,
              cursor: 'pointer',
            }}>
              <img
                className="ifix-logo-box"
                src={getWorkspaceAvatarUrl(MERCHANT_ID)}
                alt=""
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: token.colorFillSecondary,
                  flexShrink: 0,
                  objectFit: 'cover',
                }}
              />
              <Typography.Text strong style={{ fontSize: 15, flex: 1, minWidth: 0 }} ellipsis>IFix</Typography.Text>
              <Button type="text" size="small" style={{ borderRadius: 6 }} icon={<ChevronsUpDown size={14} strokeWidth={2.25} />} />
            </div>
          </Dropdown>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {inSettings ? (
              <div key="settings" className="ifix-nav-slide-fade">
                <Menu
                  mode="inline"
                  inlineIndent={16}
                  selectable={false}
                  style={{ border: 'none', marginTop: 4, marginBottom: -4, background: 'transparent' }}
                  items={[
                    {
                      key: 'back',
                      // Item's default 16px left padding put the button's left edge 16px
                      // from the item's own edge vs. a 4px (Spacing 1) centering gap.
                      // Trimming the item's own padding (rather than a negative margin,
                      // which just got clipped by the item's overflow: hidden) matches them.
                      // Previously 4.5px (exact antd button-height centering math) —
                      // rounded to the scale, per the project-wide move to trace every
                      // padding/margin/gap back to it.
                      style: { paddingLeft: 4, paddingRight: 4 },
                      label: (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
                          <Button type="text" size="small" style={{ borderRadius: 6, justifySelf: 'start' }} icon={<ChevronLeft size={17} strokeWidth={2.25} />} />
                          <span>Settings</span>
                          <span />
                        </div>
                      ),
                      onClick: () => navigate('/contracts'),
                    },
                  ]}
                />
                <Menu
                  mode="inline"
                  inlineIndent={16}
                  selectedKeys={[settingsKey]}
                  style={{ border: 'none', background: 'transparent' }}
                  items={SETTINGS_ITEMS.map(item => ({
                    ...item,
                    onClick: () => navigate(`/settings/${item.key}`),
                  }))}
                />
              </div>
            ) : inAccount ? (
              <div key="account" className="ifix-nav-slide-fade">
                <Menu
                  mode="inline"
                  inlineIndent={16}
                  selectable={false}
                  style={{ border: 'none', marginTop: 4, marginBottom: -4, background: 'transparent' }}
                  items={[
                    {
                      key: 'back',
                      // Item's default 16px left padding put the button's left edge 16px
                      // from the item's own edge vs. a 4px (Spacing 1) centering gap.
                      // Trimming the item's own padding (rather than a negative margin,
                      // which just got clipped by the item's overflow: hidden) matches them.
                      // Previously 4.5px (exact antd button-height centering math) —
                      // rounded to the scale, per the project-wide move to trace every
                      // padding/margin/gap back to it.
                      style: { paddingLeft: 4, paddingRight: 4 },
                      label: (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
                          <Button type="text" size="small" style={{ borderRadius: 6, justifySelf: 'start' }} icon={<ChevronLeft size={17} strokeWidth={2.25} />} />
                          <span>Account</span>
                          <span />
                        </div>
                      ),
                      onClick: () => navigate('/contracts'),
                    },
                  ]}
                />
                <Menu
                  mode="inline"
                  inlineIndent={16}
                  selectedKeys={[accountKey]}
                  style={{ border: 'none', background: 'transparent' }}
                  items={ACCOUNT_ITEMS.map(item => ({
                    ...item,
                    onClick: () => navigate(`/account/${item.key}`),
                  }))}
                />
              </div>
            ) : inProducts ? (
              <div key="products" className="ifix-nav-slide-fade">
                <Menu
                  mode="inline"
                  inlineIndent={16}
                  selectable={false}
                  style={{ border: 'none', marginTop: 4, marginBottom: -4, background: 'transparent' }}
                  items={[
                    {
                      key: 'back',
                      // Item's default 16px left padding put the button's left edge 16px
                      // from the item's own edge vs. a 4px (Spacing 1) centering gap.
                      // Trimming the item's own padding (rather than a negative margin,
                      // which just got clipped by the item's overflow: hidden) matches them.
                      // Previously 4.5px (exact antd button-height centering math) —
                      // rounded to the scale, per the project-wide move to trace every
                      // padding/margin/gap back to it.
                      style: { paddingLeft: 4, paddingRight: 4 },
                      label: (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
                          <Button type="text" size="small" style={{ borderRadius: 6, justifySelf: 'start' }} icon={<ChevronLeft size={17} strokeWidth={2.25} />} />
                          <span>Products</span>
                          <span />
                        </div>
                      ),
                      onClick: () => navigate('/contracts'),
                    },
                  ]}
                />
                <Menu
                  mode="inline"
                  inlineIndent={16}
                  selectedKeys={[productsKey]}
                  style={{ border: 'none', background: 'transparent' }}
                  items={PRODUCTS_ITEMS.map(item => ({
                    ...item,
                    onClick: () => navigate(`/products/${item.key}`),
                  }))}
                />
              </div>
            ) : (
              <div key="main" className="ifix-nav-slide-fade">
                <Menu
                  mode="inline"
                  inlineIndent={16}
                  selectedKeys={[selectedKey]}
                  className="ifix-main-nav"
                  style={{ border: 'none', marginTop: 4, background: 'transparent' }}
                  items={[
                    {
                      key: 'contracts',
                      icon: navIcon(<FileText size={17} strokeWidth={2.25} />),
                      label: 'Contracts',
                      onClick: () => navigate('/contracts'),
                    },
                    ...(user.role !== 'super_admin' ? [{
                      key: 'products',
                      icon: navIcon(<Package size={17} strokeWidth={2.25} />),
                      // Right padding matches the sidebar's shared 4px (Spacing 1) item
                      // inset (see .ifix-main-nav .ant-menu-item in index.css) instead of
                      // a mismatched flat 16px. Previously 4.5px (exact antd button-height
                      // centering math, (36 - 27) / 2) — rounded to the scale.
                      style: { paddingRight: 4 },
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span>Products</span>
                          <Button
                            type="text"
                            size="small"
                            style={{ borderRadius: 6 }}
                            icon={<ChevronRight size={14} strokeWidth={2.25} />}
                          />
                        </div>
                      ),
                      onClick: () => navigate('/products/catalog'),
                    }] : []),
                    {
                      key: 'customers',
                      icon: navIcon(<Contact size={17} strokeWidth={2.25} />),
                      label: 'Customers',
                      onClick: () => navigate('/customers'),
                    },
                    ...(user.role === 'super_admin' ? [{
                      key: 'merchants',
                      icon: navIcon(<Building2 size={17} strokeWidth={2.25} />),
                      label: 'Merchants',
                      onClick: () => navigate('/merchants'),
                    }] : []),
                    {
                      key: 'branches',
                      icon: navIcon(<Store size={17} strokeWidth={2.25} />),
                      label: 'Branches',
                      onClick: () => navigate('/branches'),
                    },
                  ]}
                />
              </div>
            )}
          </div>

          <Dropdown
            trigger={['click']}
            placement="topLeft"
            dropdownRender={menu => <div style={{ margin: '0 4px 4px' }}>{menu}</div>}
            menu={{
              items: [
                { key: 'settings', icon: <IdCard size={17} strokeWidth={2.25} />, label: 'Account Settings' },
                { type: 'divider' },
                { key: 'logout', icon: <LogOut size={17} strokeWidth={2.25} />, label: 'Log out' },
              ],
              onClick: ({ key }) => {
                if (key === 'logout') handleLogout()
                if (key === 'settings') navigate('/account/general')
              },
            }}
          >
            <div style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              // Right padding set to 8px (Spacing 2) so this button's right edge lines up
              // in the same column as the other two sidebar icon buttons (header dropdown
              // row and the Products menu item's chevron) rather than each row's own
              // vertical-centering gap, which put all three at different offsets.
              // Left padding matches (8px) so the avatar aligns with the back-chevron
              // column and the main nav icons (all trimmed to the same 4px item padding).
              // Previously 8.5px (exact antd button-height centering math) — rounded to
              // the scale, per the project-wide move to trace every padding/margin/gap
              // back to it.
              padding: '0 8px 0 8px',
              flexShrink: 0,
              cursor: 'pointer',
            }}>
              <Avatar
                src={getAvatarUrl(user.id)}
                icon={<User size={17} strokeWidth={2.25} />}
                size={28}
                style={{ background: token.colorFillSecondary, color: iconColors.secondary, flexShrink: 0 }}
              />
              <Typography.Text
                style={{ fontSize: 14, flex: 1, minWidth: 0, color: token.colorText }}
                ellipsis={{ tooltip: user.name }}
              >
                {user.name}
              </Typography.Text>
              <Button type="text" size="small" style={{ borderRadius: 6 }} icon={<MoreHorizontal size={16} strokeWidth={2.25} />} />
            </div>
          </Dropdown>
        </div>
      </Sider>

      <Layout style={{
        background: 'transparent',
        margin: 8,
        // 100% of this layout's own box (which now comes from the resizable
        // desktop window in App.tsx, not the true browser viewport) minus the
        // 8px top + 8px bottom margin above, so the rounded box always
        // reaches the bottom of that box and the margin actually reads as
        // bottom padding instead of just shrinking to fit whatever content
        // happens to render.
        height: 'calc(100% - 16px)',
        border: '0.5px solid var(--ifix-wrapper-border)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: 'var(--ifix-panel-shadow)',
      }}>
        <Header style={{
          background: 'var(--ifix-wrapper-bg)',
          borderBottom: `0.5px solid ${token.colorSplit}`,
          padding: '0 16px',
          height: 56,
          lineHeight: '56px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ justifySelf: 'start' }}>
            <Button
              type="text"
              size="small"
              style={{ borderRadius: 6 }}
              icon={collapsed ? <PanelLeftOpen size={16} strokeWidth={2.25} /> : <PanelLeftClose size={16} strokeWidth={2.25} />}
              onClick={() => setCollapsed(c => !c)}
            />
          </div>
          <div style={{ justifySelf: 'center', display: 'flex', alignItems: 'center', gap: 4 }}>
            {breadcrumbParts.map((part, i) => {
              const isLast = i === breadcrumbParts.length - 1
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {i > 0 && <ChevronRight size={14} strokeWidth={2.25} style={{ color: token.colorTextQuaternary }} />}
                  <Typography.Text
                    strong={isLast}
                    onClick={isLast ? undefined : () => navigate(breadcrumbBackUrl)}
                    style={{
                      fontSize: 15,
                      color: isLast ? token.colorText : token.colorTextTertiary,
                      cursor: isLast ? 'default' : 'pointer',
                    }}
                  >
                    {part}
                  </Typography.Text>
                </div>
              )
            })}
          </div>
          <div />
        </Header>

        <Content style={{ padding: 16, overflow: 'auto', background: 'var(--ifix-wrapper-bg)' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
