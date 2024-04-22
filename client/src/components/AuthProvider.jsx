/* eslint-disable react/prop-types */
import axios from "axios";
import { createContext, useEffect, useState } from "react";
import Cookies from "js-cookie"
import { toast } from "react-toastify";
import { io } from "socket.io-client";
export const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null)
    const authInfo = { user, setUser, loading, socket, setSocket }

    const token = Cookies.get("token")
    useEffect(() => {
        
        setLoading(true);
        axios.get("/all_users_api/get_user", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(res => {
                if (res.status == 200) {
                    setUser(res.data.user)
                    const url = 'ws://localhost:5000'
                    const socket = io(url, {
                        auth: {
                            token: Cookies.get('token')
                        },
                    })
                    socket.on("connect", () => {
                        setSocket(socket);
                    })
                    socket.on("error", (error) => {
                        console.error("Socket connection error:", error);
                        setSocket(null)
                    });
                }
                if (res.status == 204) {
                    toast.error("User not found")
                    Cookies.remove('token')
                    setUser(null)
                }
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false))
    }, [token]);


    return (
        <AuthContext.Provider value={authInfo} >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;