import { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

export const SocketContext = createContext(null)
// eslint-disable-next-line react/prop-types
const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null)

    useEffect(() => {
        const url = 'ws://localhost:5000'
        const socket = io(url, {
            auth: {
                token: Cookies.get('token')
            },
        })
        socket.on("connect", () => {
            console.log(`connected user : ${socket.id}`);
        })
        setSocket(socket)
    }, [])

    const socketInfo = { socket }
    return (
        <SocketContext.Provider value={socketInfo}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;