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
      <td>${c.cidade_ip && c.estado_ip ? `${c.cidade_ip} - ${c.estado_ip}` : "-"}</td>
      <td>${new Date(c.timestamp).toLocaleString()}</td>
      <td><a href="${c.documento}" target="_blank">Abrir</a></td>
      <td><a href="${c.carteira}" target="_blank">Abrir</a></td>
      <td><a href="${c.selfieDoc}" target="_blank">Abrir</a></td>
      <td>
        ${c.fotoCamera
          ? `<img src="${c.fotoCamera}" width="100" height="80" alt="Foto da câmera" />`
          : "-"}
      </td>
      <td>
        <button class="apagarBtn" data-id="${c.id}" style="background:red;color:white;border:none;padding:5px 10px;cursor:pointer;">X</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Adiciona evento aos botões de apagar
  document.querySelectorAll(".apagarBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");

      // Modal de confirmação
      if (confirm("Tem certeza que deseja apagar este cadastro?")) {
        try {
          const response = await fetch(`/cadastro/${id}`, {
            method: "DELETE"
          });

          if (!response.ok) {
            throw new Error("Erro ao apagar cadastro");
          }

          const result = await response.json();
          alert(result.mensagem);

          // Recarrega a tabela
          carregarCadastros();
        } catch (err) {
          console.error("Erro ao apagar:", err);
          alert("❌ Falha ao apagar cadastro.");
        }
      }
    });
  });
}

carregarCadastros();