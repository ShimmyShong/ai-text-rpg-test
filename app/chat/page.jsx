'use client'
import { MainChat } from '@/utils/openai';
import { GeminiChat } from '@/utils/gemini';
import React, { useState, useEffect, useRef } from 'react'
import { Send, Sword, Backpack, Scroll, User } from 'lucide-react'

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([{ role: 'loading', content: '...' }])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    if (!messagesEndRef) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessage('');
    setMessages([...messages,
    {
      role: 'user',
      content: message
    },
    {
      role: "loading",
      content: "..."
    }
    ])
    scrollToBottom()
    const { messagesArray } = await MainChat(message, messages)
    setMessages([...messagesArray])
  };

  useEffect(() => {
    const init = async () => {
      const { messagesArray } = await MainChat(null, [])
      console.log(messagesArray)
      setMessages([...messagesArray])
    }
    init()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-purple-300 shadow-lg border-b border-purple-500">
        <div className="max-w-6xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <Sword className="mr-2" /> AI RPG Quest
          </h1>
          <div className="flex space-x-4">
            <button className="p-2 hover:bg-gray-700 rounded-full transition duration-300">
              <Backpack className="w-6 h-6" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-full transition duration-300">
              <Scroll className="w-6 h-6" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-full transition duration-300">
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <ul className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-800">
        {messages ? messages.map((el, index) => {
          if (el.role === 'user') {
            return (
              <li className='flex justify-end' key={index}>
                <div className="bg-purple-600 text-white rounded-2xl py-2 px-4 max-w-xs lg:max-w-md shadow-md">
                  {el.content}
                </div>
              </li>
            )
          } else if (el.role === 'assistant') {
            return (
              <li className='flex justify-start' key={index}>
                <div className="bg-gray-800 text-purple-100 rounded-2xl py-2 px-4 max-w-xs lg:max-w-md shadow-md border border-purple-500">
                  {el.content}
                </div>
              </li>
            )
          } else if (el.role === 'loading') {
            return (
              <li className='flex justify-start' key={index}>
                <div className="bg-gray-800 text-purple-100 rounded-2xl py-2 px-4 max-w-xs lg:max-w-md shadow-md border border-purple-500 animate-pulse">
                  {el.content}
                </div>
              </li>
            )
          }
        }) : null}
        <div ref={messagesEndRef} />
      </ul>

      {/* Message input */}
      <div className="bg-gray-800 border-t border-purple-500 px-4 py-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What will you do next, adventurer?"
              className="flex-1 focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none w-full text-sm leading-6 text-gray-100 placeholder-gray-400 bg-gray-700 rounded-full py-3 px-5 shadow-inner transition duration-300 ease-in-out"
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-full border border-purple-500 bg-purple-600 p-3 text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-300 ease-in-out"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat

