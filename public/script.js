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

// Máscara para telefone no padrão (XX) 9XXXX-XXXX
// Máscara para telefone no padrão (XX) 9XXXX-XXXX
const telefoneInput = document.getElementById("telefone");
if (telefoneInput) {
  telefoneInput.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, ""); // remove tudo que não for número

    // Limita a 11 dígitos (2 DDD + 9 número)
    valor = valor.substring(0, 11);

    if (valor.length > 0) {
      valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
      valor = valor.replace(/(\d{5})(\d{4})$/, "$1-$2");
    }

    e.target.value = valor;
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validação do telefone
  const telefone = document.getElementById("telefone").value;
  const regexTelefone = /^\(\d{2}\)\s9\d{4}-\d{4}$/;

  if (!regexTelefone.test(telefone)) {
    alert("❌ Telefone inválido. Use o formato (XX) 9XXXX-XXXX.");
    return;
  }

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