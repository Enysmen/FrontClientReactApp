import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../CSS/LoginPage.css' // глобальный CSS дл€ этой страницы

const API_ENDPOINT = 'https://localhost:5001/api/auth/login'

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [rememberMe, setRememberMe] = useState(false)
    const [status, setStatus] = useState({ state: 'idle', message: '' })
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((p) => ({ ...p, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus({ state: 'loading', message: 'Sending data to the serverЕ' })
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...formData, rememberMe }),
            })

            if (!response.ok) {
                const errorMessage = await response.text()
                throw new Error(errorMessage || 'Failed to log in')
            }

            const data = await response.json().catch(() => null)
            const successMessage = data?.message || 'Login successful. Token received.'
            setStatus({ state: 'success', message: successMessage })
            // пример дальнейшего действи€:
            // navigate('/dashboard')
        } catch (error) {
            setStatus({
                state: 'error',
                message: error instanceof Error ? error.message : 'An unknown error occurred',
            })
        }
    }

    const isLoading = status.state === 'loading'

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-card__body">
                    <div className="login-card__header">
                        <div className="brand-circle"><span className="brand-initials">WS</span></div>
                        <h1 className="login-card__title">Welcome!</h1>
                        <p className="login-card__subtitle">
                            Enter your login and password to log in to the control panel.
                        </p>
                    </div>

                    {status.state !== 'idle' && (
                        <div className={`form-alert form-alert--${status.state}`} role="alert">
                            {status.message}
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        <div className="login-form__group">
                            <label htmlFor="loginEmail" className="login-form__label">Email</label>
                            <input
                                type="email"
                                className="login-form__input"
                                id="loginEmail"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="username"
                                placeholder="name@example.com"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="login-form__group">
                            <div className="login-form__label-row">
                                <label htmlFor="loginPassword" className="login-form__label">Password</label>
                                <a className="login-form__link" href="/account/recover">Forgot your password?</a>
                            </div>
                            <input
                                type="password"
                                className="login-form__input"
                                id="loginPassword"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="login-form__footer">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    className="remember-me__checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={isLoading}
                                />
                                <span className="remember-me__label">Remember me</span>
                            </label>
                            <span className="login-form__secure">Secure connection</span>
                        </div>

                        <button type="submit" className="login-form__submit" disabled={isLoading}>
                            {isLoading ? 'WeТre entering' : 'Login'}
                        </button>

                        <button
                            type="button"
                            className="SendRegisterPage"
                            disabled={isLoading}
                            onClick={() => navigate('/register')}
                        >
                            {isLoading ? 'Loading Page' : 'Register'}
                        </button>
                    </form>

                    <p className="integration-hint">
                        The request is sent to ASP.NET Web API at:
                        <br />
                        <span className="integration-hint__endpoint">{API_ENDPOINT}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}