
import { Link, useNavigate } from 'react-router-dom';
import useAuth from './useAuth';
import Cookies from 'js-cookie'
const Navbar = () => {
    const { user, setUser, setSocket, socket } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        Cookies.remove('token')
        setSocket(null)
        setUser(null)
        socket.disconnect()
        navigate('/')
    }
    return (
        <>
            {!user && <div className="flex justify-end w-full gap-x-10 px-10 py-5 bg-slate-300">
                <Link to='/' className="px-3 py-1 bg-green-600 text-white">Home</Link>
                <Link to='/signup' className="px-3 py-1 bg-green-600 text-white">Signup</Link>
                <Link to='/login' className="px-3 py-1 bg-green-600 text-white">Login</Link>
            </div>}

            {user && <div className="flex justify-end w-full gap-x-10 px-10 py-5 bg-slate-300">
                <p>{user.name}</p>
                <button onClick={handleLogout} className="px-3 py-1 bg-green-600 text-white">Logout</button>

            </div>}
        </>
    );
};

export default Navbar;