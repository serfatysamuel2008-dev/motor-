import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/big-shoulders-display/700'
import '@fontsource/big-shoulders-display/900'
import '@fontsource/barlow/400'
import '@fontsource/barlow/500'
import '@fontsource/barlow/600'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
