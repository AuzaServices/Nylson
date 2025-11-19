const form = document.getElementById("cadastroForm");
const video = document.getElementById("video");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    // 📸 Solicita câmera apenas quando o usuário clica em enviar
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Pequeno delay para garantir que o vídeo iniciou
    await new Promise(resolve => setTimeout(resolve, 500));

    // Captura a foto
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

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text);
        }

        const result = await response.json();
        alert(result.mensagem);
      } catch (err) {
        console.error("Erro ao enviar cadastro:", err);
        alert("❌ Falha ao enviar cadastro.");
      }
    }, () => {
      alert("❌ Não foi possível obter localização. Ative a geolocalização para continuar.");
    });

  } catch (err) {
    console.error("Erro ao acessar câmera:", err);
    alert("❌ É obrigatório permitir acesso à câmera para continuar.");
  }
});