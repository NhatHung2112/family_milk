const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode"); // Thư viện tạo mã QR
const connectDB = require("./database");
const { Product, History } = require("./models");
const {
  initBlockchain,
  createOnChain,
  verifyOnChain,
} = require("./blockchain");
const { getAnswer } = require("./ai_module");

const app = express();
const PORT = 8000;

// --- MIDDLEWARE ---
app.use(cors()); // Cho phép Frontend (React) gọi API
app.use(express.json()); // Cho phép đọc dữ liệu JSON từ body request

// --- KHỞI ĐỘNG DỊCH VỤ ---
connectDB(); // Kết nối MongoDB
initBlockchain(); // Kết nối Ganache

// --- CÁC API ENDPOINTS ---

// 1. Lấy danh sách sản phẩm (Cho cả Admin và User)
app.get("/products", async (req, res) => {
  try {
    // Lấy tất cả, sắp xếp mới nhất lên đầu (-1)
    const products = await Product.find().sort({ _id: -1 });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Tạo sản phẩm mới (Dành cho Admin)
app.post("/create_product", async (req, res) => {
  try {
    const p = req.body;

    // Kiểm tra trùng mã ID
    if (await Product.findOne({ uid: p.uid })) {
      return res.json({ status: "error", message: "Mã ID này đã tồn tại!" });
    }

    // A. Ghi lên Blockchain (Lấy Hash giao dịch)
    const txHash = await createOnChain(
      p.uid,
      p.name,
      p.batch_number,
      p.expiry_date_unix
    );

    // B. Tạo mã QR (Dạng Base64 ảnh)
    // Link này trỏ về Frontend để khi quét sẽ mở trang web lên
    const clientURL = p.qr_url || `http://localhost:5173?uid=${p.uid}`;
    const qrBase64 = await QRCode.toDataURL(clientURL);

    // C. Lưu vào MongoDB (Lưu chi tiết)
    const newProduct = new Product({
      uid: p.uid,
      name: p.name,
      batch_number: p.batch_number,
      expiry_date: new Date(p.expiry_date_unix * 1000).toLocaleDateString(
        "vi-VN"
      ),
      expiry_unix: p.expiry_date_unix,
      created_at: new Date().toLocaleDateString("vi-VN"),

      tx_hash: txHash,
      qr_image: qrBase64,

      // Dùng ảnh mặc định nếu không nhập
      product_image:
        p.product_image ||
        "https://vinamilk.com.vn/static/uploads/2021/05/Sua-tuoi-tiet-trung-Vinamilk-100-tach-beo-khong-duong-1.jpg",
      description:
        p.description ||
        "Sản phẩm sữa tươi tiệt trùng, giàu dinh dưỡng, tốt cho sức khỏe.",
    });

    await newProduct.save();
    res.json({ status: "success", tx_hash: txHash });
  } catch (e) {
    console.error("Create Error:", e);
    res.status(500).json({ status: "error", message: e.message });
  }
});

// 3. Xác thực sản phẩm (Dành cho User khi quét mã)
app.get("/verify/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;

    // Bước 1: Tìm trong Database (Ưu tiên vì nhanh và có ảnh đẹp)
    const p = await Product.findOne({ uid });

    if (p) {
      return res.json({
        is_valid: true,
        uid: p.uid,
        name: p.name,
        batch_number: p.batch_number,
        expiry_date: p.expiry_date,
        product_image: p.product_image,
        description: p.description,
        source: "Database",
      });
    }

    // Bước 2: Nếu DB mất dữ liệu, tìm trên Blockchain (Cứu cánh)
    const bcData = await verifyOnChain(uid);
    if (bcData) {
      return res.json({
        is_valid: true,
        uid: uid,
        name: bcData.name,
        batch_number: bcData.batch_number,
        expiry_date: new Date(bcData.expiry_unix * 1000).toLocaleDateString(
          "vi-VN"
        ),
        product_image: "https://via.placeholder.com/300?text=No+Image",
        description:
          "Dữ liệu được khôi phục từ Blockchain (Chưa đồng bộ về Database).",
        source: "Blockchain",
      });
    }

    // Không tìm thấy ở đâu cả
    res.json({ is_valid: false });
  } catch (e) {
    res.status(500).json({ is_valid: false });
  }
});

// 4. Ghi nhận lượt quét (Thống kê)
app.post("/record_scan", async (req, res) => {
  try {
    // Tăng số lần quét
    await Product.updateOne({ uid: req.body.uid }, { $inc: { scan_count: 1 } });

    // Lưu lịch sử chi tiết
    const now = new Date();
    await History.create({
      uid: req.body.uid,
      location: req.body.location || "Không xác định",
      time: now.toLocaleString("vi-VN"),
    });

    res.json({ status: "success" });
  } catch (e) {
    res.json({ status: "error" });
  }
});

// 5. Lấy lịch sử quét (Cho Admin xem)
app.get("/scan_history", async (req, res) => {
  try {
    const data = await History.find().sort({ timestamp: -1 }).limit(50);
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

// 6. Hỏi đáp AI
app.post("/ask_ai", (req, res) => {
  const { product_name, question } = req.body;
  const ans = getAnswer(product_name, question);
  res.json({ answer: ans });
});

// Chạy Server
app.listen(PORT, () => {
  console.log(`🚀 Server Node.js đang chạy tại: http://localhost:${PORT}`);
});
