import { useEffect, useRef, useState } from 'react';
import Navbar from './Navbar';
import axios from 'axios'
import useAuth from './useAuth';
import { v4 as uid } from 'uuid'
import { PulseLoader } from 'react-spinners'
import { IoClose } from "react-icons/io5";
import { useQuery } from "@tanstack/react-query"
import { RiSendPlaneFill } from "react-icons/ri";
import { IoMdSearch } from "react-icons/io";
import moment from 'moment';

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
    const [allChats, setAllChats] = useState([])
    const [searchText, setSearchText] = useState('')
    const [isShowAddMember, setIsShowAddMember] = useState(false)

    const { data: chats, isLoading: chatsLoading, refetch } = useQuery({
        queryKey: ['all_chats', user],
        queryFn: async () => {
            const res = await axios.get(`/chat_api/get_all_chats?userId=${user._id}`)
            try {
                if (res.status === 200) {
                    setAllChats(res.data.chats)
                    return res.data.chats
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
            socket.on("new_message", ({ messageText, sender_id }) => {
                refetch()
                const newMessage =
                {
                    id: uid(),
                    sender_id: sender_id,
                    receiver_id: user._id,
                    message_text: messageText,
                    time_stamp: Date.now()
                }
                if (receiver?.id === sender_id) {
                    setConversations([...conversations, newMessage])
                    setScrollBottom(!scrollBottom)
                }

            })
            socket.emit("get_online_users");
            socket.on("get_online_users", (data) => {
                setOnlineUsers(data)
            })
            socket.on('typing', ({ isTyping, sender_id }) => {
                if (sender_id === receiver?.id) {
                    setIsTyping(isTyping);
                }
            });
            socket.on("message_sent", () => {
                refetch()
            })

            return () => {
                socket.off("new_message")
                socket.off("get_online_users")
                socket.off('typing')
                socket.off("message_sent")
            }
        }
    }, [user?._id, socket, conversations, receiver?._id, scrollBottom, receiver?.id, refetch])

    useEffect(() => {
        scrollToBottom()
    }, [scrollBottom, isTyping])

    const handleSendMessage = (e) => {
        e.preventDefault()
        const messageText = e.target.message_input.value
        if (!messageText) return
        const newMessage =
        {
            id: uid(),
            sender_id: user._id,
            receiver_id: receiver.id,
            message_text: messageText,
            time_stamp: Date.now()
        }
        const sender = { id: user._id, name: user.name, image: user.image }

        setConversations([...conversations, newMessage])
        socket.emit("new_message", { messageText, receiver, sender, newMessage })
        e.target.reset()
        setScrollBottom(!scrollBottom)
    }
    const handleOpenNewChat = (selectedUser) => {
       const receiver = {
            id: selectedUser._id,
            name: selectedUser.name,
            image: selectedUser.image
       }
        setReceiver(receiver)
        setIsShowAddMember(false)

    }
    const handleOpeChat = (participants) => {
        scrollToBottom()
        const receiver = participants.find(p => p.id !== user._id)
        setReceiver(receiver)
        setIsShowAddMember(false)
        setChatLoading(true)
        axios.get(`/chat_api/get_messages?sender_id=${participants[0].id}&receiver_id=${participants[1].id}&skip=${skipData}`)
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
            socket.emit('typing', { isTyping: true, receiver_id: receiver.id, sender_id: user._id });
            typingTimeout = setTimeout(() => {
                socket.emit('typing', { isTyping: false, receiver_id: receiver.id, sender_id: user._id });
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
        const chats = []
        allChats?.map(chat => {
            const receiver = chat.participants.find(p => p.id !== user._id)
            if (receiver.name.toLowerCase().includes(searchText.toLowerCase())) {
                chats.push(chat)
            }
        })
        setAllChats(chats)
    }
    const handleSearchMember = (e) => {
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
        setAllChats(chats)
        setSearchText('')
    }
    const resetMemberSearch = () => {
        setAllUsers(convoUsers)
        setSearchText('')
    }
    // console.log(allChats);
    return (
        <div>
            <Navbar />
            <div className="flex justify-center gap-x-4 mt-5 ml-6">
                {/* chat list */}
                {(!receiver && !isShowAddMember) &&
                    <div className='w-[400px] h-[600px] text-gray-800'>
                        <div className='w-full h-full p-1 bg-gray-100 shadow-xl rounded-lg overflow-hidden'>
                            <div className='p-4 flex items-center justify-between'>
                                <h1 className='text-2xl font-medium'>Chats</h1>
                                <button onClick={() => setIsShowAddMember(true)} className='px-3 text-xs py-1 bg-[#4256D0] text-white rounded-full'>Add member</button>
                            </div>
                            <div className='flex px-4 items-center gap-x-3 w-full justify-between mb-3'>
                                <form onSubmit={handleSearchConvo} className='w-full relative' >
                                    <input onChange={(e) => setSearchText(e.target.value)} value={searchText} autoComplete='off' className='w-full text-sm py-1.5 px-3 text-gray-500 rounded-full outline-none' type="text" placeholder='Search members' id='search_member_input' />
                                    <button type='submit' className='absolute right-2 top-[7px] px-2'>
                                        <IoMdSearch className='text-gray-500' size={20} />
                                    </button>
                                    {searchText && <button onClick={resetConvoSearch} type='button' className='absolute right-10 top-[7px] px-2'>
                                        <IoClose className='text-gray-500' size={20} />
                                    </button>}
                                </form>
                            </div>
                            {
                                !chatsLoading && allChats?.map((chat, index) => {
                                    const receiver = chat.participants.find(p => p.id !== user._id)
                                    return (
                                        <div onClick={() => handleOpeChat(chat.participants)} key={index} className="flex duration-100 items-center justify-between hover:bg-gray-200 rounded cursor-pointer">
                                            <div className="py-4 px-4">
                                                <div className="flex gap-x-2">
                                                    <div className='relative'>
                                                        {
                                                            onlineUsers?.find(u => u.userId === receiver.id) ?
                                                                <div className='w-3 h-3 rounded-full border bottom-1 right-0 absolute bg-green-500'></div>
                                                                :
                                                                <div className='w-3 h-3 rounded-full border bottom-1 right-0 absolute bg-gray-400'></div>
                                                        }

                                                        <img className="w-10 h-10 rounded-full object-cover" src={receiver.image} alt="Rounded avatar" />
                                                    </div>
                                                    <div>
                                                        <h1 className='font-medium'>{receiver.name}</h1>
                                                        <p className='text-sm'>
                                                            {chat.last_message.sender_id === user._id ? 'You : ' : ''}
                                                            {chat.last_message.message_text.slice(0, 35)}
                                                            {chat.last_message.message_text.length > 35 && '...'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    )
                                })
                            }
                            {
                                chatsLoading &&
                                <div className='flex items-center justify-center w-full h-[75%]'>
                                    <PulseLoader size={10} color='#4256D0' />
                                </div>
                            }
                            {
                                (!chatsLoading && !allChats?.length) && <p className='text-center mt-32 text-gray-500'>No chats to show</p>
                            }
                        </div>
                    </div>
                }
                {/* add member list */}
                {!receiver && isShowAddMember &&
                    <div className='w-[400px] h-[600px] text-gray-800'>
                        <div className='w-full h-full p-1 bg-gray-100 shadow-xl rounded-lg overflow-hidden'>
                            <div className='p-4 flex items-center justify-between'>
                                <h1 className='text-2xl font-medium'>Add Member</h1>
                                <button onClick={() => setIsShowAddMember(false)} className='px-3 text-xs py-1 bg-[#4256D0] text-white rounded-full'><IoClose size={20} /></button>
                            </div>
                            <div className='flex px-4 items-center gap-x-3 w-full justify-between mb-3'>
                                <form onSubmit={handleSearchMember} className='w-full relative' >
                                    <input onChange={(e) => setSearchText(e.target.value)} value={searchText} autoComplete='off' className='w-full text-sm py-1.5 px-3 text-gray-500 rounded-full outline-none' type="text" placeholder='Search members' id='search_member_input' />
                                    {/* TODO: */}
                                    <button type='submit' className='absolute right-2 top-[7px] px-2'>
                                        <IoMdSearch className='text-gray-500' size={20} />
                                    </button>
                                    {searchText && <button onClick={resetMemberSearch} type='button' className='absolute right-10 top-[7px] px-2'>
                                        <IoClose className='text-gray-500' size={20} />
                                    </button>}
                                </form>
                            </div>
                            {
                                !userLoding && allUsers?.map((user, index) => {
                                    return (
                                        <div onClick={() => handleOpenNewChat(user)} key={index} className="flex duration-100 items-center justify-between hover:bg-gray-200 rounded cursor-pointer">
                                            <div className="py-4 px-4">
                                                <div className="flex gap-x-2">
                                                    <div className='relative'>
                                                        {
                                                            onlineUsers?.find(u => u.userId === user._id) ?
                                                                <div className='w-3 h-3 rounded-full border bottom-1 right-0 absolute bg-green-500'></div>
                                                                :
                                                                <div className='w-3 h-3 rounded-full border bottom-1 right-0 absolute bg-gray-400'></div>
                                                        }

                                                        <img className="w-10 h-10 rounded-full object-cover" src={user.image} alt="Rounded avatar" />
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
                {/* chat box */}
                {(receiver && !isShowAddMember) &&
                    <div className='flex flex-col items-center justify-center w-[400px] h-[600px] text-gray-800'>
                        <div className="flex flex-col flex-grow w-full max-w-full bg-white shadow-xl rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between bg-gray-300">
                                <div className=" py-2 px-4">
                                    <div className="flex gap-x-2">
                                        <div className='relative'>
                                            {
                                                onlineUsers?.find(u => u.userId === receiver.id) ?
                                                    <div className='w-3 h-3 rounded-full border bottom-1 right-0 absolute bg-green-500'></div>
                                                    :
                                                    <div className='w-3 h-3 rounded-full border bottom-1 right-0 absolute bg-gray-400'></div>
                                            }
                                            <img className="w-10 h-10 rounded-full object-cover" src={receiver.image} alt="Rounded avatar" />
                                        </div>
                                        <div>
                                            <h1 className='font-medium'>{receiver?.name}</h1>
                                            {
                                                onlineUsers?.find(u => u.userId === receiver?.id) ?
                                                    <p className='text-sm'>Online</p>
                                                    :
                                                    <p className='text-sm'>Offline</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleCloseChat} className='p-1.5 mr-3 hover:bg-gray-200 rounded-full'><IoClose className='text-gray-500' size={25} /></button>
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

                                            {
                                                conversations?.map((message, index) => {

                                                    const preMessage = conversations[index - 1];
                                                    const messageMoment = moment(message.time_stamp);
                                                    let showTime = false;
                                                    let formattedTime = '';
                                                    if (preMessage) {
                                                        const timeDifferenceMinutes = messageMoment.diff(moment(preMessage.time_stamp), 'hours');
                                                        if (timeDifferenceMinutes > 1) {
                                                            showTime = true;
                                                        }
                                                    } else {
                                                        showTime = true;
                                                    }
                                                    if (messageMoment.isSame(moment(), 'day')) {
                                                        formattedTime = messageMoment.format('LT');
                                                    } else if (messageMoment.isSame(moment().subtract(1, 'day'), 'day')) {
                                                        formattedTime = 'Yesterday, ' + messageMoment.format('LT');
                                                    } else {
                                                        formattedTime = messageMoment.format('MMMM DD, LT');
                                                    }
                                                    return (
                                                        <div id={message.id} key={index}>
                                                            {
                                                                message.sender_id == user._id ?

                                                                    <div className='w-full group'>
                                                                        {showTime && <p className='text-center text-gray-500 text-sm mt-6'>
                                                                            {formattedTime}
                                                                        </p>}
                                                                        <div className='flex w-[65%] mt-1 items-center space-x-2 max-w-xs ml-auto justify-end'>
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
                                                                    <div>
                                                                        {showTime && <p className='text-center text-gray-500 text-sm mt-6'>
                                                                            {formattedTime}
                                                                        </p>}
                                                                        <div className="flex w-[65%] mt-1 space-x-2 max-w-xs">
                                                                            {/* <img className="w-10 h-10 rounded-full object-cover" src={Image} alt="Rounded avatar" /> */}

                                                                            <div className="bg-gray-300 py-1.5 px-2 rounded-r-lg rounded-bl-lg">
                                                                                <p className="text-sm">{message.message_text}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
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
                            <div className="bg-gray-300 py-3">
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


            </div>
        </div>
    );
};

export default Chat