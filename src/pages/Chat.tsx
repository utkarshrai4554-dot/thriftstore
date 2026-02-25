import { useState } from "react";
import { mockChats } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft } from "lucide-react";

const mockMessages = [
  { id: 1, from: "them", text: "Hi! Is the vintage jacket still available?", time: "2:30 PM" },
  { id: 2, from: "me", text: "Yes it is! Are you interested?", time: "2:31 PM" },
  { id: 3, from: "them", text: "Definitely! Can you do ₹75?", time: "2:33 PM" },
  { id: 4, from: "me", text: "How about ₹80? It's in great condition.", time: "2:34 PM" },
  { id: 5, from: "them", text: "Deal! How do I proceed?", time: "2:35 PM" },
];

const Chat = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const active = mockChats.find((c) => c.id === activeChat);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold mb-6">Messages</h1>

        <div className="bg-card border rounded-2xl overflow-hidden h-[70vh] flex">
          {/* Sidebar */}
          <div className={`w-full md:w-80 border-r ${activeChat ? "hidden md:block" : ""}`}>
            <div className="p-4 border-b">
              <Input placeholder="Search conversations..." />
            </div>
            <div className="divide-y">
              {mockChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`w-full p-4 text-left hover:bg-muted transition-colors flex items-center gap-3 ${
                    activeChat === chat.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {chat.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{chat.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{chat.time}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col ${!activeChat ? "hidden md:flex" : "flex"}`}>
            {active ? (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <button onClick={() => setActiveChat(null)} className="md:hidden">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                    {active.avatar}
                  </div>
                  <p className="font-medium">{active.name}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {mockMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.from === "me"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.from === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="icon"><Send className="h-4 w-4" /></Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
