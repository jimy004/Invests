document.addEventListener("DOMContentLoaded", async () => {
    await cargarResumen();
    await cargarInversionesSelect();
    
    // Configurar botón para actualizar todos los precios
    configurarBotonActualizarTodos();
});

async function cargarResumen() {
    try {
        const res = await fetch('../php/resumen.php');
        const resumen = await res.json();

        const tbody = document.querySelector('#tabla-resumen tbody');
        tbody.innerHTML = '';

        resumen.forEach(fila => {
            const tr = document.createElement('tr');
            
            // Crear celdas con clases CSS para rentabilidad y diferencia
            tr.innerHTML = `
                <td>${fila.nombre}</td>
                <td>${fila.usd}</td>
                <td>${fila.eur}</td>
                <td>${fila.inv_inicial}</td>
                <td class="${fila.rentabilidad_clase || ''}">${fila.rentabilidad}</td>
                <td class="${fila.diferencia_clase || ''}">${fila.diferencia}</td>
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
        const resultado = await res.json(); // Cambiado a JSON
        
        // Usar mostrarMensaje en lugar de mostrar en #mensaje
        if (resultado.success) {
            mostrarMensaje(resultado.mensaje, 'exito');
        } else {
            mostrarMensaje(resultado.mensaje, 'error');
        }
        
        // Limpiar el campo de mensaje anterior si existe
        document.getElementById('mensaje').textContent = '';
        
        // Recargar tabla resumen
        await cargarResumen();
        
        // Opcional: limpiar el formulario
        document.getElementById('form-modificar').reset();
        
    } catch (err) {
        console.error(err);
        mostrarMensaje('Error al procesar la solicitud', 'error');
    }
});

//----------------------------------------------------------------------------
// Función para actualizar todos los precios
async function actualizarTodosLosPrecios() {
    const btn = document.getElementById('btnActualizarTodosPrecios');
    const statusSpan = document.getElementById('actualizacionStatusInicio');
    
    if (btn) btn.disabled = true;
    if (statusSpan) statusSpan.textContent = 'Actualizando...';
    
    try {
        mostrarMensaje('Actualizando precios... Por favor espera.', 'info');
        
        // Primero actualizar criptomonedas
        const resultadoCriptos = await actualizarPreciosTipo('criptomonedas');
        
        // Luego acciones
        const resultadoAcciones = await actualizarPreciosTipo('acciones');
        
        // Finalmente fondos
        const resultadoFondos = await actualizarPreciosTipo('fondos');
        
        // Mostrar resumen
        const mensaje = `
            ✅ Actualización completada:
            - Criptomonedas: ${resultadoCriptos.actualizados} actualizadas, ${resultadoCriptos.errores} errores
            - Acciones: ${resultadoAcciones.actualizados} actualizadas, ${resultadoAcciones.errores} errores
            - Fondos: ${resultadoFondos.actualizados} actualizados, ${resultadoFondos.errores} errores
            
            Total: ${resultadoCriptos.actualizados + resultadoAcciones.actualizados + resultadoFondos.actualizados} activos actualizados
        `;
        
        mostrarMensaje(mensaje, 'exito');
        
        // Recargar el resumen con los nuevos precios
        await cargarResumen();
        
    } catch (error) {
        console.error('Error actualizando precios:', error);
        mostrarMensaje('Error al actualizar precios: ' + error.message, 'error');
    } finally {
        if (btn) btn.disabled = false;
        if (statusSpan) statusSpan.textContent = '';
    }
}

// Función auxiliar para actualizar cada tipo
async function actualizarPreciosTipo(tipo) {
    let url = '';
    
    switch(tipo) {
        case 'criptomonedas':
            url = '../php/actualizar_precios_cripto.php';
            break;
        case 'acciones':
            url = '../php/actualizar_precios_acciones.php';
            break;
        case 'fondos':
            url = '../php/actualizar_precios_fondos.php';
            break;
        default:
            throw new Error('Tipo no válido');
    }
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
    }
    
    return await response.json();
}

// Configurar el botón de actualizar todos
function configurarBotonActualizarTodos() {
    const btn = document.getElementById('btnActualizarTodosPrecios');
    if (btn) {
        btn.addEventListener('click', actualizarTodosLosPrecios);
    }
}