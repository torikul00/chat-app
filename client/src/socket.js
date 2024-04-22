import { io } from 'socket.io-client';
import Cookie from 'js-cookie';
const url = 'ws://localhost:5000'

console.log('hi');
export const socket = () => {
   return io(url, {
        auth: {
            token: Cookie.get('token')
        },
    })
} 