import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../CSS/RegisterPage.css'
import { getExp, secondsLeft } from '../utils/jwt'

const API_ENDPOINT = 'https://localhost:5001/api/auth/register' 


const mock = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjE3NjA3MjE4NjB9.x'
const exp = getExp(mock)
console.log('exp =', exp, 'left =', secondsLeft(exp))

export default function RegisterPage() {
    const [form, setForm] = useState({name: '',email: '',password: '',confirmPassword: '',})
    const [errors, setErrors] = useState({})
    const [status, setStatus] = useState({ state: 'idle', message: '' })
    const navigate = useNavigate()

    const onChange = (e) => {
        const { name, value } = e.target
        setForm((f) => ({ ...f, [name]: value }))
    }

    const isValidPassword = (p) => /[A-Za-z]/.test(p) && /\d/.test(p) && p.length >= 8
    const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = 'Name is required.'
        if (!isValidEmail(form.email)) e.email = 'Email format is invalid.'
        if (!isValidPassword(form.password)) e.password = 'Min 8 chars, at least 1 letter & 1 digit.'
        if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match.'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return

        setStatus({ state: 'loading', message: 'Creating your account…' })
        try {
            const resp = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                }),
            })

            if (!resp.ok) {
                const text = await resp.text()
                throw new Error(text || 'Registration failed')
            }

            setStatus({ state: 'success', message: 'Account created!' })
            navigate('/login', {
                replace: true,
                state: { registeredEmail: form.email }, 
            })
        } catch (err) {
            setStatus({
                state: 'error',
                message: err instanceof Error ? err.message : 'Unknown error',
            })
        }
    }

    const isLoading = status.state === 'loading'

    return (
        <div className="register-wrapper">
            <form className="register-form" onSubmit={onSubmit} noValidate>
                <h1>Create account</h1>

                {status.state !== 'idle' && (
                    <div className={`alert alert--${status.state}`}>{status.message}</div>
                )}

                <label className="field">
                    <span>Name</span>
                    <input name="name" value={form.name} onChange={onChange} disabled={isLoading} required/>
                    {errors.name && <small className="error">{errors.name}</small>}
                </label>

                <label className="field">
                    <span>Email</span>
                    <input type="email" name="email" value={form.email} onChange={onChange} disabled={isLoading} required />
                    {errors.email && <small className="error">{errors.email}</small>}
                </label>

                <label className="field">
                    <span>Password</span>
                    <input type="password" name="password" value={form.password} onChange={onChange} disabled={isLoading} required/>
                    <small className="hint">Min 8, at least 1 letter & 1 digit</small>
                    {errors.password && <small className="error">{errors.password}</small>}
                </label>

                <label className="field">
                    <span>Confirm password</span>
                    <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={onChange} disabled={isLoading} required />
                    {errors.confirmPassword && (
                        <small className="error">{errors.confirmPassword}</small>
                    )}
                </label>

                <button type="submit" className="register_form_submint" disabled={isLoading}> {isLoading ? 'Signing up…' : 'Sign up'} </button>

                <button type="button" className="link-button" onClick={() => navigate('/login')} disabled={isLoading}> Back to login </button>
            </form>
        </div>
    )
}
