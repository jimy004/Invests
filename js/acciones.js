//----------------------------------------------------------------------------
// Formulario de acciones
const accionSelectAcc = document.getElementById("accionAcc");
const inputsAcc = document.querySelectorAll("#formAcciones input:not([name=ticker])");

function ajustarCamposAcc() {
    const accion = accionSelectAcc.value;

    if (accion === "insertar") {
        inputsAcc.forEach(input => input.disabled = false);
    } else if (accion === "modificar") {
        inputsAcc.forEach(input => input.disabled = false);
    } else if (accion === "eliminar") {
        inputsAcc.forEach(input => input.disabled = true);
    }
}

accionSelectAcc.addEventListener("change", ajustarCamposAcc);
ajustarCamposAcc();


//----------------------------------------------------------------------------
// Cargar tabla de acciones vía AJAX
function cargarTablaAcc() {
    fetch('../php/tabla_acciones_ajax.php')
        .then(response => response.text())
        .then(html => {
            document.getElementById('tablaAcciones').innerHTML = html;
            activarOrdenTabla(); // 🔥 activar ordenación después de insertar la tabla
        })
        .catch(error => console.error('Error al cargar la tabla:', error));
}
// Cargar al inicio
cargarTablaAcc();

function activarOrdenTabla() {
    const tabla = document.getElementById("tablaAcciones");
    if (!tabla) return;

    const ths = tabla.querySelectorAll("th");
    let sortState = {}; // recordar el orden asc/desc

    ths.forEach((th, index) => {
        th.style.cursor = "pointer";
        th.addEventListener("click", () => {
            const tbody = tabla.querySelector("tbody");
            const rows = Array.from(tbody.querySelectorAll("tr"));

            const col = index;
            const tipo = th.dataset.col;
            const asc = !sortState[tipo]; // alternar

            rows.sort((a, b) => {
                let t1 = a.children[col].innerText.trim();
                let t2 = b.children[col].innerText.trim();

                // Quitar $ y comas
                t1 = t1.replace(/[$,]/g, "");
                t2 = t2.replace(/[$,]/g, "");

                // Convertir a número si procede
                const n1 = parseFloat(t1);
                const n2 = parseFloat(t2);

                if (!isNaN(n1) && !isNaN(n2)) {
                    return asc ? n1 - n2 : n2 - n1;
                }

                // Comparación alfabética
                return asc ? t1.localeCompare(t2) : t2.localeCompare(t1);
            });

            sortState[tipo] = asc;

            // Redibujar la tabla
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}

//----------------------------------------------------------------------------
// Enviar formulario de acciones vía AJAX
const formAcciones = document.getElementById('formAcciones');

if (formAcciones) {
    formAcciones.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        fetch('../php/crud_accion.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // Primero obtener como texto para ver qué devuelve
            return response.text();
        })
        .then(text => {
            console.log('Respuesta del servidor (texto):', text);
            
            try {
                // Intentar convertir a JSON
                const data = JSON.parse(text);
                return data;
            } catch (error) {
                console.error('No es JSON válido. Contenido:', text.substring(0, 200));
                // Si no es JSON, es un error del servidor
                throw new Error('El servidor respondió con un error. ¿Está funcionando PHP?');
            }
        })
        .then(data => {
            console.log('Datos parseados:', data);
            
            if (data && data.message) {
                alert(data.message);
            } else {
                alert('Respuesta inesperada del servidor');
            }
            
            if (data.success) {
                formAcciones.reset();
                document.getElementById('accionAcc').value = 'insertar';
                ajustarCamposAcc();
                cargarTablaAcc();
                cargarTotalAcciones();
                location.reload();
            }
            
            document.querySelectorAll('.fila-seleccionada-accion').forEach(f => {
                f.classList.remove('fila-seleccionada-accion');
            });
        })
        .catch(error => {
            console.error('Error completo:', error);
            alert('Error: ' + error.message + '\n\nRevisa la consola para más detalles.');
        });
    });
}


//----------------------------------------------------------------------------
// Cargar historial paginado
function cargarHistorialAcc(page = 1) {
    fetch(`../php/historial_acciones.php?page=${page}`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('historialAcciones').innerHTML = html;
        })
        .catch(err => console.error('Error al cargar historial:', err));
}

// Cargar al inicio
cargarHistorialAcc();



//----------------------------------------------------------------------------
// Cargar gráficos de acciones
fetch('../php/graficos_accion.php')
    .then(res => res.json())
    .then(data => {

        // === Distribución de activos (Pie) ===
        Highcharts.chart('graficoDistribucionAcc', {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'Distribución de Acciones'
            },
            tooltip: {
                pointFormat: '<b>{point.percentage:.2f}%</b>'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}: {point.percentage:.1f} %'
                    }
                }
            },
            series: [{
                name: 'Peso (%)',
                data: data.distribucion
            }]
        });


        // === Rentabilidad mensual (Column) ===
        Highcharts.chart('graficoRentabilidadAcc', {
            chart: { type: 'column' },
            title: { text: 'Rentabilidad Mensual (%)' },
            xAxis: { categories: data.rentabilidad.meses },
            yAxis: { title: { text: 'Rentabilidad (%)' } },
            series: [{
                name: 'Rentabilidad',
                color: '#000000',
                data: data.rentabilidad.valores.map(v => ({
                    y: v,
                    color: v >= 0 ? '#4CAF50' : '#ff3333'
                }))
            }]
        });


        // === Evolución del valor total ===
        const evolucionData = [];
        let anterior = null;

        data.evolucion.forEach(punto => {
            let color = '#4CAF50';
            if (anterior !== null) {
                color = punto.y >= anterior ? '#4CAF50' : '#ff3333';
            }
            evolucionData.push({ y: punto.y, color: color });
            anterior = punto.y;
        });

        Highcharts.chart('graficoEvolucionAcc', {
            chart: { type: 'line' },
            title: { text: 'Evolución del Valor Total (€)' },
            xAxis: { categories: data.evolucion.map(e => e.x) },
            yAxis: { title: { text: 'Valor Total (€)' } },
            series: [{
                name: 'Valor Total',
                color: '#000000',
                data: evolucionData
            }]
        });

    })
    .catch(err => console.error('Error al cargar gráficos:', err));

//----------------------------------------------------------------------------  
// Formulario de historial 
const accionHistorialAccSelect = document.getElementById("accionHistorialAcc");
const historialAccInputs = document.querySelectorAll("#formHistorialAcc input");

function ajustarCamposHistorialAcc() {
    if (!accionHistorialAccSelect) return; // Protección contra null
    
    const accion = accionHistorialAccSelect.value;

    if (accion === "insertar") {
        historialAccInputs.forEach(input => {
            input.disabled = false;
            // Solo fecha y valor son requeridos para insertar
            if (input.name === 'fecha' || input.name === 'valor') {
                input.required = true;
            } else {
                input.required = false;
            }
        });
    } else if (accion === "modificar") {
        historialAccInputs.forEach(input => {
            input.disabled = false;
            // Solo fecha es requerida para modificar
            if (input.name === 'fecha') {
                input.required = true;
            } else {
                input.required = false;
            }
        });
    } else if (accion === "eliminar") {
        historialAccInputs.forEach(input => {
            input.disabled = true;
            input.required = false;
        });
        // Solo fecha es requerida para eliminar
        const fechaInput = document.querySelector("input[name='fecha']");
        if (fechaInput) {
            fechaInput.disabled = false;
            fechaInput.required = true;
        }
    }
}

if (accionHistorialAccSelect) {
    accionHistorialAccSelect.addEventListener("change", ajustarCamposHistorialAcc);
    ajustarCamposHistorialAcc();
}

// Enviar formulario de historial
const formHistorialAcc = document.getElementById('formHistorialAcc');
if (formHistorialAcc) {
    formHistorialAcc.addEventListener('submit', function (e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        fetch('../php/crud_historial_accion.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                formHistorialAcc.reset();
                // Recargar el historial para mostrar los cambios
                const currentPage = 1;
                cargarHistorialAcc(currentPage);
                // También recargar el total
                cargarTotalAcciones();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        });
    });
}

//----------------------------------------------------------------------------
// Cargar y mostrar el valor total de acciones
function cargarTotalAcciones() {
    fetch('../php/get_total_acciones.php')
        .then(response => response.text())
        .then(total => {
            const displayElement = document.getElementById('totalAccionesDisplay');
            if (displayElement) {
                displayElement.textContent = `${total} €`;
            }
        })
        .catch(error => {
            console.error('Error al cargar total de acciones:', error);
            const displayElement = document.getElementById('totalAccionesDisplay');
            if (displayElement) {
                displayElement.textContent = 'Error al cargar';
            }
        });
}

// Cargar al inicio
document.addEventListener('DOMContentLoaded', function() {
    cargarTotalAcciones();
});

// También recargar después de enviar formularios
const formuAcciones = document.getElementById('formAcciones');
if (formuAcciones) {
    formuAcciones.addEventListener('submit', function () {
        setTimeout(cargarTotalAcciones, 500);
    });
}

if (formHistorialAcc) {
    formHistorialAcc.addEventListener('submit', function () {
        setTimeout(cargarTotalAcciones, 500);
    });
}

// Cargar también al inicio por si acaso
cargarTotalAcciones();

//----------------------------------------------------------------------------
// Agregar funcionalidad de clic en filas de acciones
document.addEventListener('DOMContentLoaded', function() {
    // Función para rellenar el formulario
    function rellenarFormularioAccion(datos) {
        const formulario = document.getElementById('formAcciones');
        if (!formulario) return;
        
        // Rellenar cada campo
        formulario.querySelector('input[name="ticker"]').value = datos.ticker || '';
        formulario.querySelector('input[name="nombre"]').value = datos.nombre || '';
        formulario.querySelector('input[name="sector"]').value = datos.sector || '';
        formulario.querySelector('input[name="cantidad"]').value = datos.cantidad || '';
        formulario.querySelector('input[name="precio_promedio"]').value = datos.precio_promedio || '';
        
        // Manejar el campo de dividendos (checkbox o select)
        const dividendosInput = formulario.querySelector('input[name="dividendos"], select[name="dividendos"]');
        if (dividendosInput) {
            if (dividendosInput.type === 'checkbox') {
                dividendosInput.checked = datos.dividendos === '1' || datos.dividendos === true;
            } else {
                dividendosInput.value = datos.dividendos === '1' ? '1' : '0';
            }
        }
    }

    // Usar delegación de eventos para las filas de acciones
    document.addEventListener('click', function(e) {
        const fila = e.target.closest('.fila-accion');
        
        if (fila) {
            e.preventDefault();
            
            // Obtener todos los datos de la fila
            const datosAccion = {
                ticker: fila.getAttribute('data-ticker'),
                nombre: fila.getAttribute('data-nombre'),
                sector: fila.getAttribute('data-sector'),
                valor_actual: fila.getAttribute('data-valor_actual'),
                cantidad: fila.getAttribute('data-cantidad'),
                precio_promedio: fila.getAttribute('data-precio_promedio'),
                dividendos: fila.getAttribute('data-dividendos')
            };
            
            // Rellenar el formulario
            rellenarFormularioAccion(datosAccion);
            
            // Cambiar a modo "modificar"
            const selectAccion = document.getElementById('accionAcc');
            if (selectAccion) {
                selectAccion.value = 'modificar';
            }
            
            // Resaltar la fila seleccionada
            document.querySelectorAll('.fila-accion').forEach(f => {
                f.classList.remove('fila-seleccionada-accion');
            });
            fila.classList.add('fila-seleccionada-accion');
            
            // Mostrar mensaje
            mostrarMensaje(`Acción "${datosAccion.nombre}" cargada en formulario`);
            
            // Hacer scroll al formulario
            const formulario = document.getElementById('formAcciones');
            if (formulario) {
                formulario.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // Agregar botón para limpiar formulario de acciones
    if (document.getElementById('formAcciones') && !document.getElementById('btnLimpiarAcciones')) {
        const form = document.getElementById('formAcciones');
        const btnSubmit = form.querySelector('button[type="submit"]');
        
        const btnLimpiar = document.createElement('button');
        btnLimpiar.id = 'btnLimpiarAcciones';
        btnLimpiar.type = 'button';
        btnLimpiar.textContent = 'Limpiar';
        btnLimpiar.className = 'btn-limpiar';
        
        btnLimpiar.addEventListener('click', function() {
            // Limpiar formulario
            form.reset();
            document.getElementById('accionAcc').value = 'insertar';
            
            // Deseleccionar filas
            document.querySelectorAll('.fila-seleccionada-accion').forEach(f => {
                f.classList.remove('fila-seleccionada-accion');
            });
            
            // Mostrar mensaje
            mostrarMensaje('Formulario limpiado', 'info');
        });
        
        // Insertar botón después del botón de submit
        btnSubmit.parentNode.insertBefore(btnLimpiar, btnSubmit.nextSibling);
    }
});

// Añade esta función en acciones.js, por ejemplo después de la función cargarTablaAcc()

//----------------------------------------------------------------------------
// Actualizar precios desde Yahoo Finance
function actualizarPreciosAcciones() {
    const btn = document.getElementById('btnActualizarPreciosAcciones');
    const statusSpan = document.getElementById('actualizacionStatusAcciones');
    
    if (btn) btn.disabled = true;
    if (statusSpan) statusSpan.textContent = 'Actualizando...';
    
    fetch('../php/actualizar_precios_acciones.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Mostrar mensaje de éxito
                alert(data.message);
                
                // Recargar tabla con nuevos precios
                cargarTablaAcc();
                
                // Recargar total
                cargarTotalAcciones();
                
                // Actualizar gráficos
                location.reload(); // O puedes recargar solo los gráficos
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al actualizar precios');
        })
        .finally(() => {
            if (btn) btn.disabled = false;
            if (statusSpan) statusSpan.textContent = '';
        });
}

document.addEventListener('DOMContentLoaded', function() {
    
    // Botón para actualizar precios de acciones
    const btnActualizarAcc = document.getElementById('btnActualizarPreciosAcciones');
    if (btnActualizarAcc) {
        btnActualizarAcc.addEventListener('click', actualizarPreciosAcciones);
    }
});


