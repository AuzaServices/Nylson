const express = require("express");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const mysql = require("mysql2");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Conexão com MySQL (freesqldatabase)
const db = mysql.createConnection({
  host: "sql5.freesqldatabase.com",
  user: "sql5802663",
  password: "p56QUxpyQI",
  database: "sql5802663"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao MySQL:", err);
  } else {
    console.log("✅ Conectado ao MySQL!");
  }
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração de uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${timestamp}${ext}`);
  }
});
const upload = multer({ storage });

// Função para converter latitude/longitude em Cidade - Estado
async function getCidadeEstado(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await axios.get(url, { headers: { "User-Agent": "cadastro-app" } });
    const data = res.data;
    const cidade = data.address.city || data.address.town || data.address.village || "";
    const estado = data.address.state || "";
    return `${cidade} - ${estado}`;
  } catch (err) {
    console.error("Erro ao obter localização:", err.message);
    return "Localização desconhecida";
  }
}

// Função para rastrear IP
const IPINFO_TOKEN = "83e6d56256238e";
async function rastrearIP(req) {
  const ipRaw = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  const ipPublico = ipRaw.replace("::ffff:", "");
  let cidade = "Desconhecida";
  let estado = "XX";

  try {
    const response = await axios.get(`https://ipinfo.io/${ipPublico}/json?token=${IPINFO_TOKEN}`);
    const data = response.data;
    cidade = data.city?.trim() || "Desconhecida";
    estado = data.region?.trim() || "XX";
  } catch (err) {
    console.warn("❌ Falha ao consultar localização IP:", err.message);
  }

  return { ip: ipPublico, cidade, estado };
}

// Rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota de cadastro
app.post("/cadastro", upload.fields([
  { name: "documento", maxCount: 1 },
  { name: "carteira", maxCount: 1 },
  { name: "selfieDoc", maxCount: 1 }
]), async (req, res) => {
  const { nome, email, telefone, fotoCamera, latitude, longitude } = req.body;

  // Localização via coordenadas
  const localizacao = await getCidadeEstado(latitude, longitude);

  // Localização via IP
  const { ip, cidade, estado } = await rastrearIP(req);

  // Salva foto da câmera
  let fotoCameraPath = "";
  if (fotoCamera) {
    const base64Data = fotoCamera.replace(/^data:image\/png;base64,/, "");
    fotoCameraPath = `uploads/fotoCamera-${Date.now()}.png`;
    fs.writeFileSync(fotoCameraPath, base64Data, "base64");
  }

  // Caminhos dos arquivos
  const documentoPath = req.files.documento?.[0]?.path || "";
  const carteiraPath = req.files.carteira?.[0]?.path || "";
  const selfieDocPath = req.files.selfieDoc?.[0]?.path || "";

  // Inserir no banco
  const sql = `
    INSERT INTO cadastros 
    (nome, email, telefone, localizacao, documento, carteira, selfieDoc, fotoCamera, ip, cidade_ip, estado_ip, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    nome,
    email,
    telefone,
    localizacao,   // Cidade - Estado via coordenadas
    documentoPath,
    carteiraPath,
    selfieDocPath,
    fotoCameraPath,
    ip,
    cidade,
    estado,
    new Date()
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error("❌ Erro ao inserir:", err.message);
      return res.status(500).json({ status: "erro", mensagem: "Falha ao salvar no banco" });
    }
    res.json({ status: "sucesso", mensagem: "Cadastro salvo com sucesso!", cidade, estado });
  });
});

// Rota para painel de controle
app.get("/painel-dados", (req, res) => {
  const sql = "SELECT * FROM cadastros ORDER BY timestamp DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar cadastros:", err.message);
      return res.status(500).json({ status: "erro", mensagem: "Falha ao buscar dados" });
    }
    res.json(results);
  });
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});