import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import useAuth from "./useAuth";

const Home = () => {
    const { user } = useAuth()

    return (
        <div>
            <Navbar />
            <div className="mt-10">
                {!user && <h1 className="text-xl text-center">You need to login first to start chat</h1>}
                {user && <div>
                    <h1 className="text-xl text-center">You logged in by <span className="text-green-700 font-bold">{user.name}</span></h1>
                    <Link to="/chat" className="px-6 py-1 rounded mt-10 mx-auto block w-fit bg-green-600 text-white">Start chat</Link>
                </div>
                }
            </div>
        </div>
    );
};

export default Home;