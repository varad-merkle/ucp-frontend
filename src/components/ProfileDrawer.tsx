/**
 * Buyer profile and market preferences, saved by the client in SQLite.
 *
 * Buyer details pre-fill a new checkout. Market preferences go to the stores as
 * UCP `context` hints (currency, country, language, region, postal code); a store
 * may still answer in its own currency or market.
 */

import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { api } from '../lib/api'
import type { BuyerProfile, MarketPreferences, Profile } from '../lib/types'
import { Drawer } from './Drawer'
import { IconCheck } from './icons'

type Section = 'buyer' | 'market'
type Values = Record<string, string>

type FieldSpec = {
  section: Section
  name: keyof BuyerProfile | keyof MarketPreferences
  label: string
  placeholder: string
  type?: string
  wide?: boolean
  maxLength?: number
  upper?: boolean
}

const BUYER_FIELDS: FieldSpec[] = [
  { section: 'buyer', name: 'first_name', label: 'First name', placeholder: 'First name' },
  { section: 'buyer', name: 'last_name', label: 'Last name', placeholder: 'Last name' },
  { section: 'buyer', name: 'email', label: 'Email', placeholder: 'name@example.com', type: 'email', wide: true },
  { section: 'buyer', name: 'phone', label: 'Phone', placeholder: 'With country code, e.g. +1 …', type: 'tel', wide: true },
]

const MARKET_FIELDS: FieldSpec[] = [
  { section: 'market', name: 'country', label: 'Country code', placeholder: 'Two letters: US, IN, GB…', maxLength: 3, upper: true },
  { section: 'market', name: 'preferred_currency', label: 'Currency', placeholder: 'Three letters: USD, INR…', maxLength: 3, upper: true },
  { section: 'market', name: 'language', label: 'Language', placeholder: 'e.g. en, en-IN, fr-CA' },
  { section: 'market', name: 'region', label: 'State / region', placeholder: 'e.g. CA, MH' },
  { section: 'market', name: 'postal_code', label: 'Postal / ZIP code', placeholder: 'e.g. 10001', wide: true },
]

const key = (field: FieldSpec) => `${field.section}.${field.name}`

function toValues(profile: Profile): Values {
  const values: Values = {}
  for (const field of [...BUYER_FIELDS, ...MARKET_FIELDS]) {
    const section = profile[field.section] as Record<string, string | null>
    values[key(field)] = section[field.name] ?? ''
  }
  return values
}

/** Every editable field, with a blank input sent as null so it is cleared. */
function toPatch(values: Values) {
  const section = (fields: FieldSpec[]) =>
    Object.fromEntries(
      fields.map((field) => {
        const value = values[key(field)].trim()
        return [field.name, value === '' ? null : field.upper ? value.toUpperCase() : value]
      }),
    )
  return { buyer: section(BUYER_FIELDS), market: section(MARKET_FIELDS) }
}

function Fields({
  fields,
  values,
  disabled,
  onChange,
}: {
  fields: FieldSpec[]
  values: Values
  disabled: boolean
  onChange: (name: string, value: string) => void
}) {
  return (
    <div className="detailsform-grid">
      {fields.map((field) => (
        <label key={key(field)} className={`detailsform-field${field.wide ? ' wide' : ''}`}>
          <span>{field.label}</span>
          <input
            type={field.type ?? 'text'}
            value={values[key(field)] ?? ''}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            onChange={(event) => onChange(key(field), event.target.value)}
            disabled={disabled}
          />
        </label>
      ))}
    </div>
  )
}

export function ProfileDrawer({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: (profile: Profile) => void
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [values, setValues] = useState<Values>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const fresh = await api.profile()
      setProfile(fresh)
      setValues(toValues(fresh))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const change = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    setSaved(false)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      // The server's copy is authoritative, so the form shows what it returned.
      const updated = await api.updateProfile(toPatch(values))
      setProfile(updated)
      setValues(toValues(updated))
      setSaved(true)
      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the profile.')
    } finally {
      setSaving(false)
    }
  }

  const busy = loading || saving

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Profile"
      subtitle={profile ? `Last updated ${new Date(profile.updated_at).toLocaleString()}` : 'Buyer details and market preferences'}
      footer={
        <>
          <button type="submit" form="profile-form" className="btn btn-sm btn-primary" disabled={busy}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          {saved && (
            <span className="faint" style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)' }}>
              <IconCheck size={12} /> Saved
            </span>
          )}
        </>
      }
    >
      <form id="profile-form" className="detailsform" onSubmit={(event) => void save(event)}>
        {error && <div className="message error">{error}</div>}

        <section>
          <span className="section-label">Buyer details</span>
          <p className="faint" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--s-2)' }}>
            Used to pre-fill checkout.
          </p>
          <Fields fields={BUYER_FIELDS} values={values} disabled={busy} onChange={change} />
        </section>

        <section>
          <span className="section-label">Market and language</span>
          <p className="faint" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--s-2)' }}>
            Sent to stores as hints for prices, availability and language. Stores may
            still answer in their own currency. Region and postal code are not a
            delivery address.
          </p>
          <Fields fields={MARKET_FIELDS} values={values} disabled={busy} onChange={change} />
        </section>
      </form>
    </Drawer>
  )
}
