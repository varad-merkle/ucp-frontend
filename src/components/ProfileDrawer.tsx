/**
 * Buyer profile and market preferences, saved by the client in SQLite.
 *
 * Buyer details pre-fill a new checkout. Market preferences go to the stores as
 * UCP `context` hints (currency, country, language, region, postal code); a store
 * may still answer in its own currency or market.
 */

import { useEffect, useRef, useState, type FormEvent } from 'react'

import { api } from '../lib/api'
import type { BuyerProfile, DetectedLocation, MarketPreferences, Profile } from '../lib/types'
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

const DETECTED_FIELDS: {
  name: keyof MarketPreferences
  detected: keyof DetectedLocation
}[] = [
  { name: 'country', detected: 'country' },
  { name: 'preferred_currency', detected: 'preferred_currency' },
  { name: 'language', detected: 'language' },
  { name: 'region', detected: 'region' },
  { name: 'postal_code', detected: 'postal_code' },
]

const LOCATION_COMPARE_FIELDS: (keyof MarketPreferences)[] = [
  'country',
  'region',
  'postal_code',
]

const key = (field: FieldSpec) => `${field.section}.${field.name}`

function locationDiffers(saved: MarketPreferences, detected: DetectedLocation): boolean {
  return LOCATION_COMPARE_FIELDS.some((field) => {
    const savedValue = saved[field]?.trim()
    const detectedValue = detected[field]?.trim()
    return Boolean(savedValue && detectedValue && savedValue.toUpperCase() !== detectedValue.toUpperCase())
  })
}

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
  const [locationNotice, setLocationNotice] = useState<string | null>(null)
  const [locationPrompt, setLocationPrompt] = useState<DetectedLocation | null>(null)
  const [saved, setSaved] = useState(false)
  const manuallyEditedMarketFields = useRef(new Set<string>())

  useEffect(() => {
    if (!open) return
    let active = true
    manuallyEditedMarketFields.current.clear()
    setLoading(true)
    setError(null)
    setLocationNotice(null)
    setLocationPrompt(null)
    setSaved(false)

    const load = async () => {
      try {
        const fresh = await api.profile()
        if (!active) return

        const initialValues = toValues(fresh)
        setProfile(fresh)
        setValues(initialValues)

        console.info('[location] Checking current request location against the saved profile.')
        void api.detectLocation().then((detected) => {
            if (!active) return
            const hasSavedLocation = LOCATION_COMPARE_FIELDS.some(
              (field) => Boolean(fresh.market[field]?.trim()),
            )
            const changed = hasSavedLocation && locationDiffers(fresh.market, detected)

            if (changed) {
              console.info('[location] Detected location differs from the saved market profile.')
              setLocationPrompt(detected)
              return
            }

            const filled: string[] = []
            const unavailable: string[] = []
            setValues((current) => {
              const next = { ...current }
              for (const field of DETECTED_FIELDS) {
                const formKey = `market.${field.name}`
                const currentValue = current[formKey] ?? ''
                const detectedValue = detected[field.detected].trim()
                if (
                  !currentValue.trim() &&
                  !manuallyEditedMarketFields.current.has(formKey) &&
                  detectedValue
                ) {
                  next[formKey] = detectedValue
                  filled.push(field.name)
                } else if (!currentValue.trim() && !detectedValue) {
                  unavailable.push(field.name)
                }
              }
              return next
            })
            console.info('[location] Profile autofill decisions:', {
              filled,
              unavailable,
            })
          }).catch(() => {
            if (active) {
              console.warn('[location] Detection failed; profile fields remain available for manual entry.')
              setLocationNotice('Could not detect your location. You can enter these fields manually.')
            }
          })
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load the profile.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [open])

  const change = (name: string, value: string) => {
    if (name.startsWith('market.')) {
      manuallyEditedMarketFields.current.add(name)
      console.info(`[location] User edited profile field "${name.slice('market.'.length)}".`)
    }
    setValues((current) => ({ ...current, [name]: value }))
    setSaved(false)
  }

  const keepCurrentLocation = () => {
    setLocationPrompt(null)
  }

  const useDetectedLocation = () => {
    if (!locationPrompt) return
    setValues((current) => {
      const next = { ...current }
      for (const field of DETECTED_FIELDS) {
        const detectedValue = locationPrompt[field.detected].trim()
        if (detectedValue) next[`market.${field.name}`] = detectedValue
      }
      return next
    })
    setSaved(false)
    setLocationPrompt(null)
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
          <button type="submit" form="profile-form" className="btn btn-sm btn-primary" disabled={busy || Boolean(locationPrompt)}>
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

          {locationNotice && <div className="message error">{locationNotice}</div>}
          {locationPrompt && (
            <div className="message info" role="status">
              <div>
                <strong>
                  Detected location: {[
                    locationPrompt.country,
                    locationPrompt.region,
                    locationPrompt.postal_code
                  ].filter(Boolean).join(', ') || 'unavailable'}
                </strong>
                <p>We detected a new location. Would you like to update your location to this region?</p>
                <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
                  <button type="button" className="btn btn-sm btn-primary" onClick={useDetectedLocation}>
                    Yes, update
                  </button>
                  <button type="button" className="btn btn-sm" onClick={keepCurrentLocation}>
                    No, keep current
                  </button>
                </div>
              </div>
            </div>
          )}
          <Fields fields={MARKET_FIELDS} values={values} disabled={busy} onChange={change} />
        </section>
      </form>
    </Drawer>
  )
}
