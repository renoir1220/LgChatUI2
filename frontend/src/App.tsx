import { useState } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
import { ChatMessageSchema, MessageCreateSchema, UserRole } from "@lg/shared"

type ChatMessage = {
  id: string
  userId: string
  role: typeof UserRole[keyof typeof UserRole]
  content: string
  createdAt: Date
}

function App() {
  const [chatMessage, setChatMessage] = useState<ChatMessage | null>(null)

  async function sendDemo() {
    const input = MessageCreateSchema.parse({ role: UserRole.User, content: "Hello via shared" })
    const res = await fetch("http://localhost:3000/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    const json = await res.json()
    const parsed = ChatMessageSchema.parse({
      ...json,
      createdAt: new Date(json.createdAt),
    })
    // 直接设置解析后的数据
    setChatMessage(parsed as ChatMessage)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3">
      <Button onClick={sendDemo}>Send demo message</Button>
      {chatMessage && (
        <div className="text-center">
          <div>From backend: {chatMessage.content}</div>
          <div className="text-xs text-gray-500">id: {chatMessage.id}</div>
        </div>
      )}
    </div>
  )
}

export default App
