import { useState } from 'react'
import { useEffect } from 'react'
import { Tooltip } from 'bootstrap'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
      <>
          <form className="FormPassLogin row g-3" action="" method="POST">
              <div className="col-sm-3">
                  <label htmlFor="InputEmail" className="form-label">Email</label>
                  <input type="email" className="form-control" id="InputEmail" aria-describedby="emailText" />
              </div>
              <div className="col-sm-3">
                  <label htmlFor="InputPassword" className="form-label">Password</label>
                  <input type="password" className="form-control" id="InputPassword" />
              </div>

              <button type="submit" className="btn btn-primary col-sm-3">Send</button>
          </form>


    </>
  )
}

export default App
