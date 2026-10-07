import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { installCssTextures } from './lib/textures'
import './index.css'

installCssTextures()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
