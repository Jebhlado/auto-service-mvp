'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function CompleteProviderProfile() {
  const router = useRouter()

  const [businessName, setBusinessName] = useState('')
  const [services, setServices] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('')
  const [bio, setBio] = useState('')
  const [mobileService, setMobileService] = useState('yes')

  async function handleSubmit() {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('provider_profiles')
      .update({
        business_name: businessName,
        services: services.split(','),
        location,
        years_experience: experience,
        bio,
        mobile_service: mobileService === 'yes',
        approval_status: 'pending'
      })
      .eq('user_id', user.id)

    if (!error) {
      router.push('/provider')
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h1>Complete Your Provider Profile</h1>

      <input
        placeholder="Business Name"
        onChange={(e) => setBusinessName(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Services Offered (comma separated)"
        onChange={(e) => setServices(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Location"
        onChange={(e) => setLocation(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Years of Experience"
        onChange={(e) => setExperience(e.target.value)}
      />

      <br /><br />

      <textarea
        placeholder="Tell customers about your business"
        onChange={(e) => setBio(e.target.value)}
      />

      <br /><br />

      <label>
        Do you offer mobile service?
      </label>

      <select onChange={(e) => setMobileService(e.target.value)}>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>

      <br /><br />

      <button onClick={handleSubmit}>
        Submit Profile
      </button>
    </div>
  )
}