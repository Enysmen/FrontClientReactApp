import { useState } from 'react'
import '../CSS/Dashboard.css'
import { getExp, secondsLeft } from '../utils/jwt'


const mock = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjE3NjA3MzA3NDF9.x'
const exp = getExp(mock)
console.log('exp =', exp, 'left =', secondsLeft(exp))

export default function Dashboard() {
    <div className="JWTClock">
        <label>JWT Expiration Time:{ }</label>
        <label>JWT Refresh token expiration time:{ }</label>
    </div>



}