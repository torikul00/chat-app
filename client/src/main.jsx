import ReactDOM from 'react-dom/client'
import './index.css'
import axios from 'axios'
import App from './App.jsx'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

axios.defaults.baseURL = 'http://localhost:5000'

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
      <App />
      <ToastContainer autoClose={2000} hideProgressBar />
  </>,
)
