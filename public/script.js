const form = document.getElementById("cadastroForm");
const video = document.getElementById("video");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

// Bloqueia todos os campos e o botão inicialmente
Array.from(form.elements).forEach(el => el.disabled = true);

// Função para liberar os campos após autorização da câmera
async function habilitarFormulario() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Libera os campos e o botão
    Array.from(form.elements).forEach(el => el.disabled = false);

    console.log("✅ Câmera autorizada, formulário liberado.");
  } catch (err) {
    console.error("Erro ao acessar câmera:", err);
    alert("❌ É obrigatório permitir acesso à câmera para continuar.");
  }
}

// Chama a função assim que a página carregar
window.addEventListener("load", habilitarFormulario);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    // Captura a foto
    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, 320, 240);
    const fotoBase64 = canvas.toDataURL("image/png");

    if (!fotoBase64 || fotoBase64.length < 100) {
      alert("❌ É obrigatório capturar a foto para enviar o cadastro.");
      return;
    }

    const formData = new FormData(form);
    formData.append("fotoCamera", fotoBase64);

    // Envia para o backend
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
});