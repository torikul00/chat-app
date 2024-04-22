import { createBrowserRouter } from "react-router-dom";
import Home from './components/Home'
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Chat from "./components/Chat";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />
    },
    {
        path:'/login',
        element: <Login />
    },
    {
        path: '/signup',
        element: <SignUp />
    },
    {
        path: '/chat',
        element: <Chat />
    }
])

export default router;