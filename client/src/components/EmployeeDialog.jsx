import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { employeeSchema } from '../features/employees/employeeSchema'

function serverField(message) {
  const normalized = message.toLowerCase()
  if (normalized.includes('full name')) return 'fullName'
  if (normalized.includes('email')) return 'email'
  if (normalized.includes('job title')) return 'jobTitle'
  if (normalized.includes('department')) return 'department'
  if (normalized.includes('country')) return 'country'
  if (normalized.includes('salary')) return 'salary'
  if (normalized.includes('hire date')) return 'hireDate'
  return null
}

export default function EmployeeDialog({ employee, filters, onClose, onSave }) {
  const countries = filters.supportedCountries || []
  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: employee?.fullName || '',
      email: employee?.email || '',
      jobTitle: employee?.jobTitle || '',
      department: employee?.department || '',
      country: employee?.country || countries[0]?.country || '',
      salary: employee?.salary == null ? '' : String(employee.salary),
      hireDate: employee?.hireDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    },
  })

  const selectedCountry = useWatch({ control: form.control, name: 'country' })
  const currency = countries.find(({ country }) => country === selectedCountry)?.currency || employee?.currency || ''
  const { errors, isSubmitting } = form.formState

  async function submit(values) {
    form.clearErrors('root')
    try {
      await onSave({ ...values, email: values.email.trim().toLowerCase(), salary: Number(values.salary) })
      onClose()
    } catch (error) {
      const field = serverField(error.message || '')
      if (field) form.setError(field, { type: 'server', message: error.message })
      else form.setError('root', { type: 'server', message: error.message || 'Unable to save employee.' })
    }
  }

  const fields = [
    { name: 'fullName', label: 'Full name', maxLength: 150 },
    { name: 'email', label: 'Email address', type: 'email', maxLength: 200 },
    { name: 'jobTitle', label: 'Job title', maxLength: 100 },
    { name: 'department', label: 'Department', maxLength: 100 },
  ]

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="employee-dialog" role="dialog" aria-modal="true" aria-labelledby="employee-dialog-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{employee ? 'EMPLOYEE RECORD' : 'NEW RECORD'}</p>
            <h2 id="employee-dialog-title">{employee ? 'Edit employee' : 'Add employee'}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}>×</button>
        </div>
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <div className="form-grid">
            {fields.map(({ name, label, type = 'text', maxLength }) => (
              <label key={name}>
                {label}
                <input
                  type={type}
                  maxLength={maxLength}
                  aria-invalid={Boolean(errors[name])}
                  aria-describedby={errors[name] ? `${name}-error` : undefined}
                  {...form.register(name)}
                />
                {errors[name] && <span className="field-error" id={`${name}-error`}>{errors[name].message}</span>}
              </label>
            ))}
            <label>
              Country
              <select aria-invalid={Boolean(errors.country)} {...form.register('country')}>
                <option value="">Select country</option>
                {countries.map(({ country }) => <option key={country} value={country}>{country}</option>)}
              </select>
              {errors.country && <span className="field-error">{errors.country.message}</span>}
            </label>
            <label>
              Annual salary ({currency || 'currency'})
              <input
                type="number"
                min="0.01"
                max="9999999999.99"
                step="0.01"
                aria-invalid={Boolean(errors.salary)}
                {...form.register('salary')}
              />
              {errors.salary && <span className="field-error">{errors.salary.message}</span>}
            </label>
            <label>
              Hire date
              <input type="date" aria-invalid={Boolean(errors.hireDate)} {...form.register('hireDate')} />
              {errors.hireDate && <span className="field-error">{errors.hireDate.message}</span>}
            </label>
          </div>
          {errors.root && <p className="form-error" role="alert">{errors.root.message}</p>}
          <div className="dialog-actions">
            <button className="button button-muted" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : employee ? 'Save changes' : 'Create employee'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
