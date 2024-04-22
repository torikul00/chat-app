import axios from 'axios';
import Navbar from './Navbar';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const SignUp = () => {
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()
    const handleSignUp = (e) => {
        e.preventDefault()
        const email = e.target.email.value
        const password = e.target.password.value
        const name = e.target.name.value
        setLoading(true)
        axios.post(`/all_users_api/signup`, { email, password, name })
            .then((res) => {
                if (res.status === 201) {
                    toast.success('User created')
                    e.target.reset()
                    navigate('/login')
                }
                if (res.status === 203) {
                    toast.error('User already exists')
                }
            })
            .catch((err) => {
                console.log(err)
            })
            .finally(() => {
                setLoading(false)
            })
    }

    return (
        <div>
            <Navbar />
            <div className="flex items-center w-full">
                <div className="w-full bg-white rounded shadow-lg p-8 m-4 md:max-w-sm md:mx-auto">
                    <span className="block w-full text-xl uppercase font-bold mb-4">Sign up</span>
                    <form className="mb-4" onSubmit={handleSignUp}>
                        <div className="mb-4 md:w-full">
                            <label htmlFor="email" className="block text-xs mb-1">Name</label>
                            <input className="w-full border rounded p-2 outline-none focus:shadow-outline" type="text" name="name" id="name" placeholder="Name" required/>
                        </div>
                        <div className="mb-4 md:w-full">
                            <label htmlFor="email" className="block text-xs mb-1">Email</label>
                            <input className="w-full border rounded p-2 outline-none focus:shadow-outline" type="email" name="email" id="email" placeholder="Username or Email" required/>
                        </div>
                        <div className="mb-6 md:w-full">
                            <label htmlFor="password" className="block text-xs mb-1">Password</label>
                            <input className="w-full border rounded p-2 outline-none focus:shadow-outline" type="password" name="password" id="password" placeholder="Password" required/>
                        </div>
                        <button disabled={loading} className="bg-green-500 hover:bg-green-700 text-white uppercase text-sm font-semibold px-4 py-2 rounded">Signup</button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default SignUp;