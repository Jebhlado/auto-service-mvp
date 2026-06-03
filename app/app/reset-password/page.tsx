'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function updatePassword() {
    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password updated successfully')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Reset Password</h1>

      <input
        type="password"
        placeholder="New password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={updatePassword}>
        Update Password
      </button>

      <p>{message}</p>
    </div>
  )
}