import ReactDOM from 'react-dom/client'
import './index.css'
import axios from 'axios'
import App from './App.jsx'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient()
axios.defaults.baseURL = 'http://localhost:5000'

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <QueryClientProvider client={queryClient}>
      <App />
      <ToastContainer autoClose={2000} hideProgressBar />
    </QueryClientProvider>
  </>,
)
