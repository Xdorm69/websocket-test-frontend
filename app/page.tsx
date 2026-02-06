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

  const roomId = "room-1";
  const [user, setUser] = useState("def-user");

  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;

    socket.connect();

    socket.emit("join-room", { roomId, user });

    socket.on("chat-history", (msgs: Message[]) => {
      setMessages(msgs);
    });

    socket.on("new-message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => {
      socket.off("chat-history");
      socket.off("new-message");
      socket.disconnect();
      connectedRef.current = false;
    };
  }, []);

  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("send-message", {
      roomId,
      user,
      text,
    });

    setText("");
  };

  return (
    <div style={{ padding: 20 }}>
      <input
        type="text"
        placeholder="change username"
        value={user}
        onChange={(e) => setUser(e.target.value)}
      />
      <h2>Room: {roomId}</h2>
      <p>You are: {user}</p>

      <div
        style={{
          border: "1px solid #ccc",
          height: 300,
          overflowY: "auto",
          padding: 10,
          marginBottom: 10,
        }}
      >
        {messages.map((m, i) => (
          <div key={i}>
            <i className="text-green-600/60">{m.time}</i>{" "}
            <b
              style={
                m.user === "System" ? { color: "red" } : { color: "yellow" }
              }
            >
              {m.user}
            </b>
            : {m.text}
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
