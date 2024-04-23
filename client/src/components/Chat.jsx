import { useEffect, useRef, useState } from 'react';
import Navbar from './Navbar';
import axios from 'axios'
import useAuth from './useAuth';
import Image from '/Torikul Islam.png'
import { v4 as uid } from 'uuid'
import { PulseLoader } from 'react-spinners'
import { IoClose } from "react-icons/io5";
import { useQuery } from "@tanstack/react-query"
import { RiSendPlaneFill } from "react-icons/ri";
import { IoMdSearch } from "react-icons/io";


const Chat = () => {
    const { user, socket } = useAuth()
    const [receiver, setReceiver] = useState(null)
    const [conversations, setConversations] = useState([])
    const [onlineUsers, setOnlineUsers] = useState([])
    const chatContainerRef = useRef(null)
    const [chatLoading, setChatLoading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [scrollBottom, setScrollBottom] = useState(false)
    const [skipData, setSkipData] = useState(0)
    const [allUsers, setAllUsers] = useState([])
    const [searchText, setSearchText] = useState('')

    const { data: convoUsers, isLoading: userLoding } = useQuery({
        queryKey: ['all_users', user],
        queryFn: async () => {
            const res = await axios.get('/all_users_api/all_users')
            try {
                if (res.status === 200) {
                    const users = res.data.all_users.filter(u => u._id !== user?._id)
                    setAllUsers(users)
                    return users
                }
                if (res.status === 204) {
                    return []
                }
            } catch (error) {
                console.log(error);
                return []
            }

        }
    })

    useEffect(() => {
        if (socket?.connected) {
            socket.on("new_message", ({ messageText, sender, }) => {
                const newMessage =
                {
                    id: uid(),
                    sender_id: sender._id,
                    receiver_id: user._id,
                    message_text: messageText,
                    time_stamp: Date.now()
                }
                setConversations([...conversations, newMessage])
                setScrollBottom(!scrollBottom)
            })
            socket.emit("get_online_users");
            socket.on("get_online_users", (data) => {
                setOnlineUsers(data)
            })
            socket.on('typing', isTyping => {
                setIsTyping(isTyping);
            });


            return () => {
                socket.off("new_message")
                socket.off("get_online_users")
                socket.off('typing')
            }
        }
    }, [user?._id, socket, conversations, receiver?._id, scrollBottom])

    useEffect(() => {
        scrollToBottom()
    }, [scrollBottom, isTyping])

    const handleSendMessage = (e) => {
        e.preventDefault()
        const messageText = e.target.message_input.value
        if (!messageText) return
        const newMessage = [
            {
                id: uid(),
                sender_id: user._id,
                receiver_id: receiver._id,
                message_text: messageText,
                time_stamp: Date.now()
            }
        ]
        setConversations([...conversations, newMessage[0]])
        socket.emit("new_message", { messageText, receiver, sender: user, newMessage })
        e.target.reset()
        setScrollBottom(!scrollBottom)
    }
    const handleOpenChat = (selectedUser) => {
        scrollToBottom()
        setReceiver(selectedUser)
        setChatLoading(true)
        axios.get(`/chat_api/get_chat?sender_id=${user._id}&receiver_id=${selectedUser._id}&skip=${skipData}`)
            .then(res => {
                if (res.status == 200) {
                    setSkipData(skipData + 20)
                    setScrollBottom(!scrollBottom)
                    setConversations(res.data)
                }
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setChatLoading(false)
            })
    }

    const handleCloseChat = () => {
        setReceiver(null)
        setConversations([])
        setSkipData(0)
    }
    let typingTimeout = null;
    const handleTyping = () => {
        scrollToBottom()
        if (socket) {
            clearTimeout(typingTimeout);
            socket.emit('typing', { isTyping: true, receiver });
            typingTimeout = setTimeout(() => {
                socket.emit('typing', { isTyping: false, receiver });
            }, 1500);
        }
    };
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    };

    // const handleLoadDataOnScroll = (e) => {
    //     const { scrollTop } = e.target

    //     if (scrollTop === 0) {
    //         axios.get(`/chat_api/get_chat?sender_id=${user._id}&receiver_id=${receiver._id}&skip=${skipData}`)
    //             .then(res => {
    //                 if (res.status == 200) {
    //                     if (res.data?.length) {
    //                         setSkipData(skipData + 20)
    //                         setConversations([...res.data, ...conversations])
    //                     }
    //                 }
    //             })
    //             .catch(err => {
    //                 console.log(err);
    //             })
    //     }
    // }
    const handleSearchConvo = (e) => {
        e.preventDefault()
        const searchText = e.target[0].value
        if (!searchText) return
        const users = []
        allUsers?.map(user => {
            if (user.name.toLowerCase().includes(searchText.toLowerCase())) {
                users.push(user)
            }
        })
        setAllUsers(users)
    }
    const resetConvoSearch = () => {
        setAllUsers(convoUsers)
        setSearchText('')
    }
    return (
        <div>
            <Navbar />
            <div className="flex justify-center gap-x-4 mt-5 ml-6">
                {receiver &&
                    <div className='flex flex-col items-center justify-center w-[400px] h-[600px] text-gray-800'>
                        <div className="flex flex-col flex-grow w-full max-w-full bg-white shadow-xl rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between bg-gray-300">
                                <div className=" py-2 px-4">
                                    <div className="flex gap-x-2">
                                        <div className='relative'>
                                            {
                                                onlineUsers?.find(u => u.userId === receiver._id) ?
                                                    <div className='w-3 h-3 rounded-full border bottom-1 right-0 absolute bg-green-500'></div>
                                                    :
                                                    <div className='w-3 h-3 rounded-full border bottom-1 right-0 absolute bg-gray-400'></div>
                                            }
                                            <img className="w-10 h-10 rounded-full object-cover" src={Image} alt="Rounded avatar" />
                                        </div>
                                        <div>
                                            <h1 className='font-medium'>{receiver?.name}</h1>
                                            {
                                                onlineUsers?.find(u => u.userId === receiver._id) ?
                                                    <p className='text-sm'>Online</p>
                                                    :
                                                    <p className='text-sm'>Offline</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleCloseChat} className='px-4'><IoClose className='text-gray-500' size={25} /></button>
                            </div>
                            {
                                chatLoading &&
                                <div className='flex items-center justify-center w-full h-full'>
                                    <PulseLoader size={10} color='#4256D0' />
                                </div>
                            }
                            {
                                !chatLoading &&
                                <>
                                    {
                                        !conversations?.length && <div className='flex flex-col items-center justify-center w-full h-full'>
                                            <p className='text-gray-500'>No messages</p>
                                            <p className='text-gray-500'>Send message for start a conversation</p>
                                        </div>
                                    }
                                    {
                                        conversations?.length ? <div ref={chatContainerRef} id='chatContainer' className="hideScrollbar flex flex-col flex-grow h-0 p-4 overflow-auto">
                                            {/* TODO: */}
                                            {
                                                conversations?.map((message, index) => {
                                                    return (
                                                        <div id={message.id} key={index}>
                                                            {
                                                                message.sender_id == user._id ?

                                                                    <div className='w-full group'>
                                                                        <div className='flex w-[65%] mt-2 items-center space-x-2 max-w-xs ml-auto justify-end'>
                                                                            {/* <button className='p-1 group-hover:block hidden bg-gray-200 '>
                                                                                <MdDelete className='text-gray-500' size={18} />
                                                                            </button> */}
                                                                            <div className="bg-blue-600 text-white py-1.5 px-2 rounded-l-lg rounded-br-lg">
                                                                                <p className="text-sm">{message.message_text}</p>
                                                                            </div>
                                                                            {/* <img className="w-10 h-10 rounded-full object-cover" src={Image} alt="Rounded avatar" /> */}
                                                                        </div>
                                                                    </div>

                                                                    :
                                                                    <>
                                                                        <div className="flex w-[65%] mt-2 space-x-2 max-w-xs">
                                                                            {/* <img className="w-10 h-10 rounded-full object-cover" src={Image} alt="Rounded avatar" /> */}

                                                                            <div className="bg-gray-300 py-1.5 px-2 rounded-r-lg rounded-bl-lg">
                                                                                <p className="text-sm">{message.message_text}</p>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                            }
                                                        </div>
                                                    )
                                                })
                                            }

                                            {isTyping &&
                                                <div className="typingIndicatorContainer">
                                                    <div className="typingIndicatorBubble">
                                                        <div className="typingIndicatorBubbleDot"></div>
                                                        <div className="typingIndicatorBubbleDot"></div>
                                                        <div className="typingIndicatorBubbleDot"></div>
                                                    </div>
                                                </div>
                                            }
                                        </div> : <> </>
                                    }
                                </>
                            }
                            <div className="bg-gray-300 px-3 py-3">
                                <form onSubmit={handleSendMessage} className='flex justify-center gap-x-2 items-center'>
                                    <textarea onChange={handleTyping} className="hideScrollbar resize-none flex outline-none items-center h-10 w-[80%] pt-[10px] rounded-full px-3 text-sm" autoComplete='off' type="text" placeholder="Type your message…" name='message_input' />
                                    <button className='hover:bg-gray-200 p-2 rounded-full' type='submit'>
                                        <RiSendPlaneFill className='text-[#4256D0]' size={28} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                }
                {!receiver &&
                    <div className='w-[400px] h-[600px] text-gray-800'>
                        <div className='w-full h-full p-1 bg-gray-100 shadow-xl rounded-lg overflow-hidden'>
                            <div className='p-4 flex items-center justify-between'>
                                <h1 className='text-2xl font-medium'>Chats</h1>
                                <button className='px-3 text-xs py-1 bg-[#4256D0] text-white rounded-full'>Add member</button>
                            </div>
                            <div className='flex px-4 items-center gap-x-3 w-full justify-between mb-3'>
                                <form onSubmit={handleSearchConvo} className='w-full relative' >
                                    <input onChange={(e) => setSearchText(e.target.value)} value={searchText} className='w-full text-sm py-1.5 px-3 text-gray-500 rounded-full outline-none' type="text" placeholder='Search members' id='search_member_input' />
                                    {/* TODO: */}
                                    <button type='submit' className='absolute right-2 top-[7px] px-2'>
                                        <IoMdSearch className='text-gray-500' size={20} />
                                    </button>
                                    {searchText && <button onClick={resetConvoSearch} type='button' className='absolute right-10 top-[7px] px-2'>
                                        <IoClose className='text-gray-500' size={20} />
                                    </button>}
                                </form>
                            </div>
                            {
                                !userLoding && allUsers?.map((user, index) => {
                                    return (
                                        <div onClick={() => handleOpenChat(user)} key={index} className="flex duration-100 items-center justify-between hover:bg-gray-200 rounded cursor-pointer">
                                            <div className="py-4 px-4">
                                                <div className="flex gap-x-2">
                                                    <div className='relative'>
                                                        {
                                                            onlineUsers?.find(u => u.userId === user._id) ?
                                                                <div className='w-3 h-3 rounded-full border bottom-1 right-0 absolute bg-green-500'></div>
                                                                :
                                                                <div className='w-3 h-3 rounded-full border bottom-1 right-0 absolute bg-gray-400'></div>
                                                        }

                                                        <img className="w-10 h-10 rounded-full object-cover" src={Image} alt="Rounded avatar" />
                                                    </div>
                                                    <div>
                                                        <h1 className='font-medium'>{user.name}</h1>
                                                        {
                                                            onlineUsers?.find(u => u.userId === user._id) ?
                                                                <p className='text-sm'>Online</p>
                                                                :
                                                                <p className='text-sm'>Offline</p>
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    )
                                })
                            }
                            {
                                userLoding &&
                                <div className='flex items-center justify-center w-full h-[75%]'>
                                    <PulseLoader size={10} color='#4256D0' />
                                </div>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>
    );
};

export default Chat