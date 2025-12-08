document.addEventListener("DOMContentLoaded", async () => {
    await cargarResumen();
    await cargarInversionesSelect();
});

async function cargarResumen() {
    try {
        const res = await fetch('../php/resumen.php');
        const resumen = await res.json();

        const tbody = document.querySelector('#tabla-resumen tbody');
        tbody.innerHTML = '';

        resumen.forEach(fila => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fila.nombre}</td>
                <td>${fila.usd}</td>
                <td>${fila.eur}</td>
                <td>${fila.inv_inicial}</td>
                <td>${fila.rentabilidad}</td>
                <td>${fila.diferencia}</td>
                <td>${fila.peso}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error cargando resumen:', error);
    }
}

// Llenar el <select> de inversiones
async function cargarInversionesSelect() {
    const select = document.getElementById('inversion');
    try {
        const res = await fetch('../php/get_inversiones.php');
        const inversiones = await res.json();
        select.innerHTML = '';
        inversiones.forEach(inv => {
            const option = document.createElement('option');
            option.value = inv.id;
            option.textContent = inv.tipo;
            select.appendChild(option);
        });
    } catch (err) {
        console.error(err);
    }
}

// Enviar formulario para modificar inversión
document.getElementById('form-modificar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('inversion').value;
    const cantidad = document.getElementById('cantidad').value;

    try {
        const res = await fetch('../php/modificar_inversion.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `id=${id}&cantidad=${cantidad}`
        });
        const texto = await res.text();
        document.getElementById('mensaje').textContent = texto;

        // Recargar tabla resumen
        await cargarResumen();
    } catch (err) {
        console.error(err);
    }
});
