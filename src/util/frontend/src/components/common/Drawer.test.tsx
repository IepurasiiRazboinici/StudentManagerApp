import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Drawer } from './Drawer'

describe('Drawer (accessible)', () => {
  it('exposes a labelled modal dialog', () => {
    render(
      <Drawer open title="Add classification rule" onClose={() => {}}>
        <p>Body</p>
      </Drawer>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Add classification rule')
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(
      <Drawer open title="Panel" onClose={onClose}>
        <p>Body</p>
      </Drawer>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the scrim is clicked', async () => {
    const onClose = vi.fn()
    render(
      <Drawer open title="Panel" onClose={onClose}>
        <p>Body</p>
      </Drawer>,
    )
    // Both the scrim and the header button are labelled "Close panel"; clicking either closes.
    await userEvent.click(screen.getAllByRole('button', { name: /close panel/i })[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('renders nothing when closed', () => {
    render(
      <Drawer open={false} title="Panel" onClose={() => {}}>
        <p>Body</p>
      </Drawer>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
