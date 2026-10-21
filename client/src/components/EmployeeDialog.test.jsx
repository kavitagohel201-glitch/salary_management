import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EmployeeDialog from './EmployeeDialog'

describe('EmployeeDialog validation', () => {
  it('shows errors for empty required fields and an invalid email', async () => {
    const user = userEvent.setup()
    render(
      <EmployeeDialog
        employee={null}
        filters={{ supportedCountries: [{ country: 'India', currency: 'INR' }] }}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('Email address'), 'invalid')
    await user.click(screen.getByRole('button', { name: 'Create employee' }))

    expect(await screen.findByText('Full name is required.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Job title is required.')).toBeInTheDocument()
    expect(screen.getByText('Department is required.')).toBeInTheDocument()
  })
})
