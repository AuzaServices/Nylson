async function carregarCadastros() {
  const res = await fetch("/painel-dados");
  const cadastros = await res.json();

  const tbody = document.getElementById("cadastrosBody");
  tbody.innerHTML = "";

  cadastros.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${c.nome}</td>
      <td>${c.email}</td>
      <td>${c.telefone}</td>
      <td>${c.localizacao}</td> <!-- mostra Cidade - Estado -->
      <td>${new Date(c.timestamp).toLocaleString()}</td>
      <td><a href="${c.documento}" target="_blank">Abrir</a></td>
      <td><a href="${c.carteira}" target="_blank">Abrir</a></td>
      <td><a href="${c.selfieDoc}" target="_blank">Abrir</a></td>
      <td>
  ${c.fotoCamera
    ? `<img src="data:image/png;base64,${c.fotoCamera}" width="100" height="80" alt="Foto da câmera" />`
    : "-"}
</td>
    `;
    tbody.appendChild(tr);
  });
}

carregarCadastros();