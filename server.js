const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configuração do MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "cadastros_db"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar no MySQL:", err.message);
  } else {
    console.log("✅ Conectado ao MySQL");
  }
});

// Configuração do Multer (upload de arquivos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Rota de cadastro
app.post(
  "/cadastro",
  upload.fields([
    { name: "documento", maxCount: 1 },
    { name: "carteira", maxCount: 1 },
    { name: "selfieDoc", maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const { nome, email, telefone, latitude, longitude, fotoCamera } = req.body;

      const documento = req.files["documento"] ? "/uploads/" + req.files["documento"][0].filename : null;
      const carteira = req.files["carteira"] ? "/uploads/" + req.files["carteira"][0].filename : null;
      const selfieDoc = req.files["selfieDoc"] ? "/uploads/" + req.files["selfieDoc"][0].filename : null;

      const sql = `
        INSERT INTO cadastros 
        (nome, email, telefone, documento, carteira, selfieDoc, fotoCamera, localizacao, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      const values = [
        nome,
        email,
        telefone,
        documento,
        carteira,
        selfieDoc,
        fotoCamera,
        latitude && longitude ? `${latitude},${longitude}` : null
      ];

      db.query(sql, values, (err) => {
        if (err) {
          console.error("❌ Erro ao inserir no banco:", err.message);
          return res.status(500).json({ status: "erro", mensagem: "Falha ao salvar no banco" });
        }
        res.json({ status: "sucesso", mensagem: "Cadastro salvo com sucesso!" });
      });
    } catch (error) {
      console.error("❌ Erro inesperado:", error.message);
      res.status(500).json({ status: "erro", mensagem: "Erro interno no servidor" });
    }
  }
);

// Rota para listar cadastros no painel
app.get("/painel-dados", (req, res) => {
  const sql = "SELECT * FROM cadastros ORDER BY timestamp DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar cadastros:", err.message);
      return res.status(500).json({ status: "erro", mensagem: "Falha ao buscar cadastros" });
    }
    res.json(results);
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});