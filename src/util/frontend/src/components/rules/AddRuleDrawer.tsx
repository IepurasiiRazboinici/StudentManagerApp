import { useUiStore } from '@/stores/uiStore'
import { Drawer } from '@/components/common'
import { RuleForm } from './RuleForm'

export function AddRuleDrawer() {
  const open = useUiStore((s) => s.addRuleOpen)
  const context = useUiStore((s) => s.addRuleContext)
  const close = useUiStore((s) => s.closeAddRule)

  return (
    <Drawer open={open} onClose={close} wide title="Add classification rule" subtitle="Sent to the backend for preview and classification">
      {open ? <RuleForm key={JSON.stringify(context)} context={context} onClose={close} /> : null}
    </Drawer>
  )
}
