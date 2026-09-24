import React, { useState, useEffect, useRef } from 'react'
import { firestore } from '../firebase'
import { collection, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { Conversation, Message } from '../types'
import { BackIcon, SendIcon } from '../components/Icons'

export function ChatListScreen({ conversations, onConvClick }: { conversations: Conversation[]; onConvClick: (c: Conversation) => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#f7f5f1' }}>
      <div className="px-4 pt-12 pb-4">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: '#141414' }}>Messages</h2>
        <p className="text-xs" style={{ color: '#7a7570' }}>{conversations.reduce((a, c) => a + c.unread, 0)} unread</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-1">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => onConvClick(conv)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white cursor-pointer active:scale-[0.98] transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <div className="relative shrink-0">
                <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full object-cover bg-stone-200" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: '#141414' }}>{conv.name}</p>
                  <p className="text-xs" style={{ color: '#7a7570' }}>{conv.time}</p>
                </div>
                <p className="text-xs truncate" style={{ color: '#7a7570' }}>{conv.listing}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: conv.unread > 0 ? '#141414' : '#7a7570', fontWeight: conv.unread > 0 ? 600 : 400 }}>{conv.lastMsg}</p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: '#d4652a' }}>
                  {conv.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ChatDetailScreen({ conv, onBack, user }: { conv: Conversation; onBack: () => void; user: any }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const messagesCol = collection(firestore, 'chats', conv.id, 'messages')
    const unsubscribe = onSnapshot(messagesCol, (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as Message)
      list.sort((a, b) => a.id.localeCompare(b.id))
      setMessages(list)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }, (error) => {
      console.warn("Messages snapshot listener error:", error)
    })
    return () => unsubscribe()
  }, [conv.id])

  const send = async () => {
    if (!text.trim() || !user) return
    const msgId = 'msg_' + Date.now()
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newMsg: Message = {
      id: msgId,
      text: text,
      senderId: user.uid,
      sent: true,
      time: timeString
    }
    
    await setDoc(doc(firestore, 'chats', conv.id, 'messages', msgId), newMsg)
    
    const convRef = doc(firestore, 'profiles', user.uid, 'conversations', conv.id)
    await updateDoc(convRef, {
      lastMsg: text,
      time: 'Just now'
    })

    setText('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3" style={{ borderBottom: '1px solid #e2ddd8' }}>
        <button onClick={onBack} style={{ color: '#5a5550' }}><BackIcon /></button>
        <img src={conv.avatar} alt={conv.name} className="w-9 h-9 rounded-full object-cover bg-stone-200" />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: '#141414' }}>{conv.name}</p>
          <p className="text-xs" style={{ color: '#7a7570' }}>{conv.listing}</p>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#eaf2ec', color: '#1a3d2b' }}>Active</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.map(msg => {
          const sentByMe = msg.senderId ? msg.senderId === user?.uid : msg.sent
          return (
            <div key={msg.id} className={`flex ${sentByMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[78%] px-3 py-2 rounded-2xl text-sm"
                style={sentByMe
                  ? { background: '#1a3d2b', color: '#fff', borderBottomRightRadius: 4 }
                  : { background: '#f7f5f1', color: '#141414', borderBottomLeftRadius: 4 }}
              >
                {msg.text}
                <div className={`text-xs mt-1 ${sentByMe ? 'text-right' : ''}`} style={{ opacity: 0.6 }}>{msg.time}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 pb-8 pt-2" style={{ borderTop: '1px solid #e2ddd8' }}>
        <input
          className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
          style={{ background: '#f7f5f1', border: '1px solid #e2ddd8', color: '#141414' }}
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button
          onClick={send}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: '#1a3d2b', color: '#fff' }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

export default ChatListScreen
