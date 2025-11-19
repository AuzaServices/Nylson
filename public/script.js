const form = document.getElementById("cadastroForm");
const video = document.getElementById("video");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

// Ativar câmera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => console.error("Erro ao acessar câmera:", err));

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Captura foto da câmera
  canvas.width = 320;
  canvas.height = 240;
  ctx.drawImage(video, 0, 0, 320, 240);
  const fotoBase64 = canvas.toDataURL("image/png");

  // Captura localização
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;

    const formData = new FormData(form);
    formData.append("fotoCamera", fotoBase64);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    const response = await fetch("/cadastro", {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    alert(result.mensagem);
  });
});