"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";

type Message = {
  user: string;
  text: string;
  time: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const connectedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomId = "room-1";
  const [user, setUser] = useState("def-user");

  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;

    const name = prompt("Enter your name")?.trim() || "def-user";
    setUser(name);

    socket.connect();

    // ✅ listeners FIRST
    socket.on("chat-history", (msgs: Message[]) => {
      setMessages(msgs);
    });

    socket.on("new-message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    // ✅ emit AFTER listeners, and use local name
    socket.emit("join-room", { roomId, user: name });

    return () => {
      socket.off("chat-history");
      socket.off("new-message");
      socket.disconnect();
      connectedRef.current = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("send-message", {
      roomId,
      user,
      text,
    });

    setText("");
  };

  const clearChat = () => {
    socket.emit("clear-chat", { roomId, user });
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
        <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-700 pb-2 mb-3">
            <h2 className="text-lg font-semibold">
              Room: <span className="text-blue-400">{roomId}</span>
            </h2>
            <p className="text-sm text-gray-400">
              You are: <span className="text-green-400">{user}</span>
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {messages.map((m, i) => {
              const isSystem = m.user === "System";
              const isMe = m.user === user;

              return (
                <div
                  key={i}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2 text-sm shadow ${
                      isSystem
                        ? "bg-red-900/40 text-red-300 mx-auto"
                        : isMe
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    {!isSystem && (
                      <div className="text-xs text-gray-300 mb-1 flex justify-between gap-2">
                        <span className="font-medium">{m.user}</span>
                        <span className="opacity-60">{m.time}</span>
                      </div>
                    )}

                    <p className="whitespace-pre-wrap break-words">
                      {isSystem ? <i>{m.text}</i> : m.text}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* 👇 THIS is what you scroll to */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="mt-3 flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              placeholder="Type a message…"
              className="flex-1 resize-none rounded-lg bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg text-sm font-medium"
            >
              Send
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-1">
            Press <b>Enter</b> to send · <b>Shift + Enter</b> for new line
          </p>
        </div>
      </div>
      {user === "amitoj" && (
        <button
          className="fixed shadow rounded-lg bg-red-600 hover:bg-red-700 transition px-4 py-2 bottom-4 right-4"
          onClick={clearChat}
        >
          Clear Chat
        </button>
      )}
    </>
  );
}
