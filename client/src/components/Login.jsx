import axios from 'axios'
import Navbar from './Navbar';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import useAuth from './useAuth';
import { useState } from 'react';

const Login = () => {
    const { setUser} = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const handleLogin = (e) => {
        e.preventDefault()
        const email = e.target.email.value
        const password = e.target.password.value
        setLoading(true)
        axios.post(`/all_users_api/login`, { email, password })
            .then((res) => {
                if (res.status === 200) {
                    setUser(res.data.user)
                    Cookies.set('token', res.data.token)
                    navigate('/')
                }
                if (res.status === 203) {
                    toast.error(res.data.message)
                }
            })
            .catch((err) => {
                console.log(err)
            })
            .finally(() => setLoading(false))
    }

    return (
        <div>
            <Navbar />
            <div className="flex items-center w-full">
                <div className="w-full bg-white rounded shadow-lg p-8 m-4 md:max-w-sm md:mx-auto">
                    <span className="block w-full text-xl uppercase font-bold mb-4">Login</span>
                    <form className="mb-4" onSubmit={handleLogin}>
                        <div className="mb-4 md:w-full">
                            <label htmlFor="email" className="block text-xs mb-1">Username or Email</label>
                            <input className="w-full border rounded p-2 outline-none focus:shadow-outline" type="email" name="email" id="email" placeholder="Username or Email" />
                        </div>
                        <div className="mb-6 md:w-full">
                            <label htmlFor="password" className="block text-xs mb-1">Password</label>
                            <input className="w-full border rounded p-2 outline-none focus:shadow-outline" type="password" name="password" id="password" placeholder="Password" />
                        </div>
                        <button disabled={loading} className="bg-green-500 hover:bg-green-700 text-white uppercase text-sm font-semibold px-4 py-2 rounded">Login</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;