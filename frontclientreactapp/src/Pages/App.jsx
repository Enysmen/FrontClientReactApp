import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from './RegisterPage'
import LoginPage from './LoginPage'
import '../CSS/App.css'


export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
        </Routes>
    )
}
