import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Package,
  User,
  LogIn,
  ArrowRight,
  Shield,
  QrCode,
  History,
  RefreshCcw,
  Eye,
  EyeOff,
  Plus,
  List,
  ArrowLeft,
  Search,
  CheckCircle,
  MessageCircle,
  Send,
  Bot,
} from "lucide-react";

// --- 1. CẤU HÌNH API & UTILS ---
const API_URL = "http://127.0.0.1:8000";
const HIDDEN_KEY = "hidden_products_local";

const api = {
  getProducts: async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  createProduct: async (data) => {
    try {
      const res = await fetch(`${API_URL}/create_product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e) {
      return { status: "error", message: "Lỗi kết nối" };
    }
  },
  verifyProduct: async (uid) => {
    try {
      const res = await fetch(`${API_URL}/verify/${uid}`);
      return await res.json();
    } catch (e) {
      return { is_valid: false };
    }
  },
  recordScan: async (uid, location) => {
    try {
      await fetch(`${API_URL}/record_scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, location }),
      });
    } catch (e) {}
  },
  getHistory: async () => {
    try {
      const res = await fetch(`${API_URL}/scan_history`);
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  askAI: async (productName, question) => {
    try {
      const res = await fetch(`${API_URL}/ask_ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name: productName, question }),
      });
      return await res.json();
    } catch (e) {
      return { answer: "Lỗi kết nối AI" };
    }
  },
};

// --- 2. COMPONENTS CON ---

const QRScanner = ({ onScan, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    scanner.render(
      (txt) => {
        scanner.clear();
        const uid = txt.includes("uid=") ? txt.split("uid=")[1] : txt;
        onScan(uid);
      },
      (err) => {}
    );
    return () => {
      try {
        scanner.clear();
      } catch (e) {}
    };
  }, [onScan]);

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"
      style={{ zIndex: 2000 }}
    >
      <div
        className="bg-white p-4 rounded-4"
        style={{ maxWidth: "500px", width: "90%" }}
      >
        <div className="d-flex justify-content-between mb-2">
          <h5>Quét Mã QR</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <div id="reader"></div>
      </div>
    </div>
  );
};

const Chatbot = ({ productName }) => {
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
        { role: "bot", text: "Lỗi kết nối AI." },
      ]);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="card border-0 shadow-sm mt-4 overflow-hidden">
      <div className="card-header bg-primary bg-opacity-10 border-0 py-3">
        <div className="d-flex align-items-center gap-2 text-primary">
          <MessageCircle size={20} />{" "}
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
};

// --- 3. PAGE COMPONENTS ---

const AdminPage = ({ onLogout }) => {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hiddenList, setHiddenList] = useState(
    JSON.parse(localStorage.getItem("hidden_products") || "[]")
  );

  const loadData = async () => {
    const data = await api.getProducts();
    setProducts(data);
  };
  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.expiry_date_unix = Math.floor(new Date(data.p_date).getTime() / 1000);
    data.qr_url = `${window.location.origin}/?uid=${data.uid}`;

    const res = await api.createProduct(data);
    if (res.status === "success") {
      alert("✅ Thành công!");
      loadData();
      e.target.reset();
    } else alert("❌ Lỗi: " + res.message);
  };

  const toggleHide = (uid) => {
    const newList = hiddenList.includes(uid)
      ? hiddenList.filter((id) => id !== uid)
      : [...hiddenList, uid];
    setHiddenList(newList);
    localStorage.setItem("hidden_products", JSON.stringify(newList));
  };

  const loadHistory = async () => {
    const data = await api.getHistory();
    setHistory(data);
    setShowHistory(true);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom">
        <div>
          <h2 className="fw-bold text-primary mb-0">Quản Trị Hệ Thống</h2>
          <p className="text-muted m-0">Milk Family Dashboard</p>
        </div>
        <button
          className="btn btn-outline-danger rounded-pill px-4 fw-bold"
          onClick={onLogout}
        >
          <LogOut size={18} className="me-2" /> Đăng Xuất
        </button>
      </div>
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <h5 className="fw-bold text-dark mb-4">
              <Plus size={20} className="me-2 text-primary" /> Tạo Mới
            </h5>
            <form onSubmit={handleCreate}>
              <input
                name="uid"
                className="form-control mb-2 rounded-3"
                placeholder="Mã ID (VD: MF_001)"
                required
              />
              <input
                name="name"
                className="form-control mb-2 rounded-3"
                placeholder="Tên SP"
                required
              />
              <input
                name="batch_number"
                className="form-control mb-2 rounded-3"
                placeholder="Số Lô"
                required
              />
              <input
                name="p_date"
                type="date"
                className="form-control mb-2 rounded-3"
                required
              />
              <input
                name="product_image"
                className="form-control mb-2 rounded-3"
                placeholder="Link Ảnh (URL)"
              />
              <textarea
                name="description"
                className="form-control mb-3 rounded-3"
                rows="2"
                placeholder="Mô tả..."
              ></textarea>
              <button className="btn btn-primary w-100 rounded-pill py-2 fw-bold">
                LƯU DATABASE
              </button>
            </form>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0">
                <List size={20} className="me-2 text-primary" /> Danh Sách
              </h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-info text-white btn-sm rounded-pill px-3"
                  onClick={loadHistory}
                >
                  <History size={16} className="me-1" /> Lịch Sử
                </button>
                <button
                  className="btn btn-light border btn-sm rounded-pill px-3"
                  onClick={loadData}
                >
                  <RefreshCcw size={16} className="me-1" /> Làm mới
                </button>
              </div>
            </div>
            <div className="table-responsive" style={{ maxHeight: "500px" }}>
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">ID</th>
                    <th>Tên SP</th>
                    <th className="text-center">Quét</th>
                    <th className="text-center">Ẩn/Hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.uid}
                      style={{ opacity: hiddenList.includes(p.uid) ? 0.5 : 1 }}
                    >
                      <td className="ps-3">
                        <span className="badge bg-light text-primary border">
                          {p.uid}
                        </span>
                      </td>
                      <td className="fw-bold">{p.name}</td>
                      <td className="text-center">{p.scan_count || 0}</td>
                      <td className="text-center">
                        <button
                          className={`btn btn-sm btn-icon ${
                            hiddenList.includes(p.uid)
                              ? "btn-secondary"
                              : "btn-outline-primary"
                          } rounded-circle p-2`}
                          onClick={() => toggleHide(p.uid)}
                        >
                          {hiddenList.includes(p.uid) ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showHistory && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title fw-bold">Lịch Sử Quét</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowHistory(false)}
                ></button>
              </div>
              <div className="modal-body p-0">
                <div className="table-responsive" style={{ maxHeight: "60vh" }}>
                  <table className="table table-striped mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">Thời Gian</th>
                        <th>Mã SP</th>
                        <th>Vị Trí</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i}>
                          <td className="ps-4">{h.time}</td>
                          <td>
                            <span className="badge bg-secondary">{h.uid}</span>
                          </td>
                          <td>{h.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserPage = ({ onBack }) => {
  const [view, setView] = useState("list");
  const [products, setProducts] = useState([]);
  const [detail, setDetail] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [checkUid, setCheckUid] = useState("");
  const hiddenList = JSON.parse(
    localStorage.getItem("hidden_products") || "[]"
  );

  useEffect(() => {
    api
      .getProducts()
      .then((data) =>
        setProducts(data.filter((p) => !hiddenList.includes(p.uid)))
      );
  }, []);

  const verify = async (uid) => {
    const target = uid || checkUid;
    if (!target) return alert("Nhập mã!");
    if (hiddenList.includes(target)) return alert("Sản phẩm bị ẩn!");

    try {
      const data = await api.verifyProduct(target);
      if (data.is_valid) {
        setDetail({ ...data, uid: target });
        setView("detail");
        api.recordScan(target, "Web Client");
      } else alert("Không tìm thấy!");
    } catch (e) {
      alert("Lỗi kết nối");
    }
  };

  if (view === "detail" && detail) {
    return (
      <div className="container py-4">
        <button
          className="btn btn-light rounded-pill border mb-4 fw-bold px-3"
          onClick={() => setView("list")}
        >
          <ArrowLeft size={18} className="me-2" /> Quay lại
        </button>
        <div
          className="card border-0 shadow-lg rounded-4 overflow-hidden mx-auto"
          style={{ maxWidth: "1000px" }}
        >
          <div className="row g-0">
            <div className="col-md-5 bg-white p-5 text-center border-end">
              <img
                src={detail.product_image || "https://placehold.co/400"}
                className="img-fluid mb-4"
                style={{ maxHeight: "350px", objectFit: "contain" }}
                alt={detail.name}
                onError={(e) => {
                  e.target.src =
                    "https://vinamilk.com.vn/static/uploads/2021/05/Sua-tuoi-tiet-trung-Vinamilk-100-tach-beo-khong-duong-1.jpg";
                }}
              />
              <div className="bg-white p-2 rounded border shadow-sm d-inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${window.location.origin}/?uid=${detail.uid}`}
                  width="100"
                  alt="QR"
                />
              </div>
            </div>
            <div className="col-md-7 p-5 bg-white">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-success bg-opacity-10 text-success fw-bold mb-3 border border-success">
                <CheckCircle size={18} /> SẢN PHẨM CHÍNH HÃNG
              </div>
              <h2 className="fw-bold text-dark mb-2">{detail.name}</h2>
              <p className="text-muted mb-4">
                ID: <span className="fw-bold text-primary">{detail.uid}</span>
              </p>
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <small className="text-muted fw-bold d-block">SỐ LÔ</small>
                    <span className="fs-5 fw-bold text-dark">
                      {detail.batch_number}
                    </span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <small className="text-muted fw-bold d-block">
                      HẠN DÙNG
                    </small>
                    <span className="fs-5 fw-bold text-danger">
                      {detail.expiry_date}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-2">
                  <Package size={18} className="me-2" />
                  Chi tiết:
                </h6>
                <p className="text-muted small">
                  {detail.description || "Chưa có mô tả."}
                </p>
              </div>
              <hr className="my-4" />
              <Chatbot productName={detail.name} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <button
        className="btn btn-light rounded-pill border mb-4 fw-bold px-3"
        onClick={onBack}
      >
        <ArrowLeft size={18} className="me-2" /> Trang Chủ
      </button>
      <div
        className="card border-0 shadow-sm p-4 mx-auto text-center mb-5 rounded-4"
        style={{ maxWidth: "650px" }}
      >
        <h3 className="fw-bold text-primary mb-4">Tra Cứu Nguồn Gốc</h3>
        <div className="d-flex gap-2 justify-content-center mb-3">
          <input
            className="form-control rounded-pill ps-5 py-2"
            placeholder="Nhập mã sản phẩm..."
            value={checkUid}
            onChange={(e) => setCheckUid(e.target.value)}
            style={{ maxWidth: "300px" }}
          />
          <button
            className="btn btn-primary rounded-pill px-4 fw-bold"
            style={{ background: "#00bfff", border: "none" }}
            onClick={() => verify()}
          >
            KIỂM TRA
          </button>
        </div>
        <button
          className="btn btn-dark rounded-pill px-4 py-2 fw-bold"
          onClick={() => setShowScanner(true)}
        >
          <QrCode size={18} className="me-2" /> QUÉT MÃ QR
        </button>
      </div>
      <div className="mb-4">
        <h4 className="fw-bold text-secondary text-center mb-4">
          Sản Phẩm Hiện Có
        </h4>
        <div className="row g-4">
          {products.length > 0 ? (
            products.map((p) => (
              <div className="col-6 col-md-4 col-lg-3" key={p.uid}>
                <div
                  className="card h-100 border-0 shadow-sm text-center p-3"
                  onClick={() => verify(p.uid)}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: "1px solid #f0f0f0",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.borderColor = "#00bfff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "#f0f0f0";
                  }}
                >
                  <img
                    src={p.product_image}
                    className="img-fluid mb-2"
                    style={{ height: "120px", objectFit: "contain" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://vinamilk.com.vn/static/uploads/2021/05/Sua-tuoi-tiet-trung-Vinamilk-100-tach-beo-khong-duong-1.jpg";
                    }}
                  />
                  <h6 className="fw-bold text-dark text-truncate mb-1">
                    {p.name}
                  </h6>
                  <small className="d-block text-muted">{p.batch_number}</small>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted py-5">Đang cập nhật...</div>
          )}
        </div>
      </div>
      {showScanner && (
        <QRScanner
          onScan={(uid) => {
            setShowScanner(false);
            verify(uid);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

// --- 4. MAIN APP ---
export default function App() {
  const [page, setPage] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
    body { font-family: 'Quicksand', sans-serif; background-color: #f4f9ff; color: #334155; }
    .text-gradient { background: linear-gradient(135deg, #00bfff, #009acd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  `;

  return (
    <div className="min-vh-100 d-flex flex-column bg-light font-sans">
      <style>{styles}</style>

      {page !== "login" && (
        <nav
          className="navbar navbar-expand bg-white shadow-sm sticky-top px-4"
          style={{ height: "80px" }}
        >
          <div className="container">
            <span
              className="navbar-brand h3 mb-0 fw-bold cursor-pointer d-flex align-items-center gap-2"
              onClick={() => setPage("home")}
              style={{ cursor: "pointer", color: "#333" }}
            >
              <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                <i className="fas fa-mug-hot"></i>
              </div>
              <span>
                Milk<span className="text-primary">Family</span>
              </span>
            </span>
            <div className="d-flex gap-3">
              <button
                className="btn rounded-pill fw-bold px-4 d-flex align-items-center gap-2 btn-outline-primary border-2"
                onClick={() => setPage("login")}
              >
                <User size={18} /> Doanh Nghiệp
              </button>
              <button
                className="btn rounded-pill fw-bold px-4 d-flex align-items-center gap-2 btn-primary shadow-sm"
                onClick={() => setPage("user")}
              >
                <Package size={18} /> Khách Hàng
              </button>
            </div>
          </div>
        </nav>
      )}

      <div className="flex-grow-1 d-flex flex-column position-relative">
        {page === "home" && (
          <div className="container flex-grow-1 d-flex align-items-center justify-content-center text-center py-5">
            <div className="animate-fade-in-up">
              <span className="badge bg-primary bg-opacity-10 text-primary px-4 py-2 rounded-pill mb-4 fw-bold border border-primary border-opacity-25 shadow-sm">
                ✨ Công Nghệ Blockchain 4.0
              </span>
              <h1
                className="display-3 fw-bold mb-4 text-dark lh-tight"
                style={{ letterSpacing: "-1px" }}
              >
                Truy Xuất Nguồn Gốc
                <br />
                <span className="text-gradient">Sữa An Toàn Tuyệt Đối</span>
              </h1>
              <p
                className="text-muted fs-5 mb-5 mx-auto"
                style={{ maxWidth: "650px", lineHeight: "1.8" }}
              >
                Hệ thống minh bạch hóa quy trình sản xuất từ nông trại đến bàn
                ăn.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <button
                  className="btn btn-primary btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg"
                  onClick={() => setPage("user")}
                >
                  Tra Cứu Ngay <ArrowRight size={20} className="ms-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {page === "login" && (
          <div className="container d-flex align-items-center justify-content-center flex-grow-1 py-5">
            <div
              className="card border-0 shadow-lg p-5 rounded-5 w-100"
              style={{ maxWidth: "450px", background: "rgba(255,255,255,0.9)" }}
            >
              <div className="text-center mb-5">
                <h3 className="fw-bold text-dark mb-1">Đăng Nhập Quản Trị</h3>
                <p className="text-muted small">Dành cho Nhà máy & Đối tác</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    e.target.u.value === "admin" &&
                    e.target.p.value === "123"
                  ) {
                    setIsAdmin(true);
                    setPage("admin");
                  } else alert("Sai mật khẩu! (Gợi ý: admin / 123)");
                }}
              >
                <div className="form-floating mb-3">
                  <input
                    name="u"
                    className="form-control border-0 bg-light rounded-3 fw-bold text-primary"
                    placeholder="name"
                    required
                  />
                  <label className="text-muted">Tài khoản</label>
                </div>
                <div className="form-floating mb-4">
                  <input
                    name="p"
                    type="password"
                    className="form-control border-0 bg-light rounded-3 fw-bold text-primary"
                    placeholder="pass"
                    required
                  />
                  <label className="text-muted">Mật khẩu</label>
                </div>
                <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-6 shadow-md">
                  ĐĂNG NHẬP HỆ THỐNG
                </button>
                <div className="text-center mt-4 pt-2 border-top">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage("home");
                    }}
                    className="text-decoration-none text-muted small"
                  >
                    <ArrowLeft size={14} /> Quay lại trang chủ
                  </a>
                </div>
              </form>
            </div>
          </div>
        )}

        {page === "admin" && isAdmin && (
          <AdminPage
            onLogout={() => {
              setIsAdmin(false);
              setPage("home");
            }}
          />
        )}
        {page === "user" && <UserPage onBack={() => setPage("home")} />}
      </div>
    </div>
  );
}
