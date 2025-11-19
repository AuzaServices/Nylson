const form = document.getElementById("cadastroForm");
const video = document.getElementById("video");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

// Ativar câmera assim que a página carrega
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    console.log("✅ Câmera habilitada");
  })
  .catch(err => {
    console.error("Erro ao acessar câmera:", err);
    alert("❌ É obrigatório permitir acesso à câmera para continuar.");
  });

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 📸 Captura foto no momento do envio
  canvas.width = 320;
  canvas.height = 240;
  ctx.drawImage(video, 0, 0, 320, 240);
  const fotoBase64 = canvas.toDataURL("image/png");

  if (!fotoBase64 || fotoBase64.length < 100) {
    alert("❌ É obrigatório capturar a foto para enviar o cadastro.");
    return;
  }

  // 🌍 Captura localização
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;

    const formData = new FormData(form);
    formData.append("fotoCamera", fotoBase64);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    try {
      const response = await fetch("/cadastro", {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      alert(result.mensagem);
    } catch (err) {
      console.error("Erro ao enviar cadastro:", err);
      alert("❌ Falha ao enviar cadastro.");
    }
  }, () => {
    alert("❌ Não foi possível obter localização. Ative a geolocalização para continuar.");
  });
});