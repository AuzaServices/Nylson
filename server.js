const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Garante que a pasta uploads existe
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir));

// Conexão com banco de dados
const db = mysql.createConnection({
  host: process.env.DB_HOST || "sql5.freesqldatabase.com",
  user: process.env.DB_USER || "sql5802663",
  password: process.env.DB_PASS || "p56QUxpyQI",
  database: process.env.DB_NAME || "sql5802663",
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar no MySQL:", err.message);
  } else {
    console.log("✅ Conectado ao MySQL remoto");
  }
});

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Função para buscar cidade/estado por IP
async function ipParaCidadeEstado(ip) {
  const token = "83e6d56256238e"; // substitua pela sua chave do ipinfo.io
  const url = `https://ipinfo.io/${ip}?token=${token}`;

  try {
    const response = await axios.get(url);
    const { city, region } = response.data;
    return { cidade: city, estado: region };
  } catch (error) {
    console.error("Erro ao buscar localização por IP:", error.message);
    return { cidade: null, estado: null };
  }
}

// Rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota de cadastro
app.post(
  "/cadastro",
  upload.fields([
    { name: "documento", maxCount: 1 },
    { name: "carteira", maxCount: 1 },
    { name: "selfieDoc", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { nome, email, telefone, latitude, longitude, fotoCamera } = req.body;

      const documento = req.files["documento"] ? "/uploads/" + req.files["documento"][0].filename : null;
      const carteira = req.files["carteira"] ? "/uploads/" + req.files["carteira"][0].filename : null;
      const selfieDoc = req.files["selfieDoc"] ? "/uploads/" + req.files["selfieDoc"][0].filename : null;

      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const { cidade, estado } = await ipParaCidadeEstado(ip);

      const sql = `
        INSERT INTO cadastros 
        (nome, email, telefone, documento, carteira, selfieDoc, fotoCamera, localizacao, ip, cidade_ip, estado_ip, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      const values = [
        nome,
        email,
        telefone,
        documento,
        carteira,
        selfieDoc,
        fotoCamera || null,
        latitude && longitude ? `${latitude},${longitude}` : null,
        ip,
        cidade,
        estado
      ];

      db.query(sql, values, (err) => {
        if (err) {
          console.error("❌ Erro ao inserir no banco:", err);
          return res.status(500).json({ status: "erro", mensagem: "Falha ao salvar no banco" });
        }
        res.json({ status: "sucesso", mensagem: "Cadastro salvo com sucesso!" });
      });
    } catch (error) {
      console.error("❌ Erro inesperado:", error);
      res.status(500).json({ status: "erro", mensagem: "Erro interno no servidor" });
    }
  }
);

// Rota para listar cadastros
app.get("/painel-dados", (req, res) => {
  const sql = "SELECT * FROM cadastros ORDER BY timestamp DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar cadastros:", err);
      return res.status(500).json({ status: "erro", mensagem: "Falha ao buscar cadastros" });
    }
    res.json(results);
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});