import React, { useState, useRef, useEffect } from "react";
// Sửa đường dẫn import API.
// Vì Chatbot.jsx nằm trong frontend/src/components/
// Mà api.js nằm trong frontend/src/services/
// Nên đường dẫn đúng là ../services/api
// Tuy nhiên, nếu file api.js chưa tồn tại hoặc export không đúng cũng gây lỗi.
// Để chắc chắn, mình sẽ khai báo hàm gọi API trực tiếp ở đây hoặc đảm bảo file api.js tồn tại.
// Nhưng theo cấu trúc React chuẩn, ta nên giữ import.
// Giả sử file api.js đã được tạo đúng ở ../services/api.js

// Tạm thời định nghĩa hàm gọi API trực tiếp tại đây để tránh lỗi import nếu file api.js chưa sẵn sàng
const API_URL = "http://localhost:8000";
const api = {
  askAI: async (productName, question) => {
    try {
      const res = await fetch(`${API_URL}/ask_ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name: productName, question }),
      });
      return await res.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },
};

import { MessageCircle, Send, Bot, User } from "lucide-react";

export default function Chatbot({ productName }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: `Xin chào! Tôi là trợ lý AI. Bạn muốn biết gì về sản phẩm "${productName}"?`,
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");

    try {
      const data = await api.askAI(productName, userMsg);
      setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Xin lỗi, tôi đang gặp sự cố kết nối." },
      ]);
    }
  };

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="card border-0 shadow-sm mt-4 overflow-hidden">
      <div className="card-header bg-primary bg-opacity-10 border-0 py-3">
        <div className="d-flex align-items-center gap-2 text-primary">
          <MessageCircle size={20} />
          <span className="fw-bold">Trợ Lý Ảo MilkFamily</span>
        </div>
      </div>

      <div
        className="card-body bg-light"
        style={{ height: "300px", overflowY: "auto" }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`d-flex mb-3 ${
              msg.role === "user"
                ? "justify-content-end"
                : "justify-content-start"
            }`}
          >
            <div
              className={`d-flex gap-2 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
              style={{ maxWidth: "80%" }}
            >
              <div
                className={`rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-white text-primary border"
                }`}
                style={{ width: 32, height: 32 }}
              >
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`p-3 rounded-4 shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-0"
                    : "bg-white text-dark border rounded-tl-0"
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="card-footer bg-white p-3 border-0">
        <div className="input-group">
          <input
            type="text"
            className="form-control border-end-0 bg-light"
            placeholder="Đặt câu hỏi..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            className="btn btn-light border border-start-0 text-primary"
            onClick={handleSend}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
