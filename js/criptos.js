//----------------------------------------------------------------------------
// Formulario de criptomonedas
const accionSelect = document.getElementById("accion");
const inputs = document.querySelectorAll("#formCripto input:not([name=ticker])");

function ajustarCampos() {
    const accion = accionSelect.value;

    if (accion === "insertar") {
        inputs.forEach(input => input.disabled = false);
    } else if (accion === "modificar") {
        inputs.forEach(input => input.disabled = false);
    } else if (accion === "eliminar") {
        inputs.forEach(input => input.disabled = true);
    }
}

accionSelect.addEventListener("change", ajustarCampos);
ajustarCampos();


//----------------------------------------------------------------------------
// Cargar tabla de criptomonedas vía AJAX
function cargarTabla() {
    fetch('../php/tabla_criptos_ajax.php')
        .then(response => response.text())
        .then(html => {
            document.getElementById('tablaActivos').innerHTML = html;
            activarOrdenTabla(); // 🔥 activar ordenación después de insertar la tabla
        })
        .catch(error => console.error('Error al cargar la tabla:', error));
}


// Cargar al inicio
cargarTabla();

function activarOrdenTabla() {
    const tabla = document.getElementById("tablaActivos");
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
// Enviar formulario de criptomonedas vía AJAX
const formCripto = document.getElementById('formCripto');

if (formCripto) {
    formCripto.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevenir el envío tradicional
        
        const formData = new FormData(this);
        
        fetch('../php/crud_cripto.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                // Limpiar formulario
                formCripto.reset();
                // Cambiar a modo insertar
                document.getElementById('accion').value = 'insertar';
                // Ajustar campos según el modo
                ajustarCampos();
                // Actualizar tabla
                cargarTabla();
                // Actualizar total
                cargarTotalCriptos();
                // Actualizar gráficos (recargando la página)
                location.reload();
            }
            // Deseleccionar filas si existían
            document.querySelectorAll('.fila-seleccionada-cripto').forEach(f => {
                f.classList.remove('fila-seleccionada-cripto');
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        });
    });
}


//----------------------------------------------------------------------------
// Cargar historial paginado
function cargarHistorial(page = 1) {
    fetch(`../php/historial_criptos.php?page=${page}`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('historialCriptos').innerHTML = html;
        })
        .catch(err => console.error('Error al cargar historial:', err));
}

// Cargar al inicio
cargarHistorial();


//----------------------------------------------------------------------------
// Cargar gráficos de criptomonedas
fetch('../php/graficos_cripto.php')
    .then(res => res.json())
    .then(data => {

        // === Distribución de activos (Pie) ===
        Highcharts.chart('graficoDistribucion', {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'Distribución de Criptomonedas'
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
        Highcharts.chart('graficoRentabilidad', {
            chart: { type: 'column' },
            title: { text: 'Rentabilidad Mensual (%)' },
            xAxis: { categories: data.rentabilidad.meses },
            yAxis: { title: { text: 'Rentabilidad (%)' } },
            series: [{
                name: 'Rentabilidad',
                color: '#000000',
                data: data.rentabilidad.valores.map(v => ({
                    y: v,
                    color: v >= 0 ? '#4CAF50' : '#ff3333' // verde positivo, rojo negativo
                }))
            }]
        });


        // Evolución del valor total
        const evolucionData = [];
        let anterior = null;

        data.evolucion.forEach(punto => {
            let color = '#4CAF50'; // por defecto verde
            if (anterior !== null) {
                color = punto.y >= anterior ? '#4CAF50' : '#ff3333';
            }
            evolucionData.push({ y: punto.y, color: color });
            anterior = punto.y;
        });

        Highcharts.chart('graficoEvolucion', {
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
const accionHistorialSelect = document.getElementById("accionHistorialCripto");
const historialInputs = document.querySelectorAll("#formHistorial input");

function ajustarCamposHistorial() {
    if (!accionHistorialSelect) return; // Protección contra null

    const accion = accionHistorialSelect.value;

    if (accion === "insertar") {
        historialInputs.forEach(input => {
            input.disabled = false;
            // Solo fecha y valor son requeridos para insertar
            if (input.name === 'fecha' || input.name === 'valor') {
                input.required = true;
            } else {
                input.required = false;
            }
        });
    } else if (accion === "modificar") {
        historialInputs.forEach(input => {
            input.disabled = false;
            // Solo fecha es requerida para modificar
            if (input.name === 'fecha') {
                input.required = true;
            } else {
                input.required = false;
            }
        });
    } else if (accion === "eliminar") {
        historialInputs.forEach(input => {
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

if (accionHistorialSelect) {
    accionHistorialSelect.addEventListener("change", ajustarCamposHistorial);
    ajustarCamposHistorial();
}

// Enviar formulario de historial
const formHistorial = document.getElementById('formHistorial');
if (formHistorial) {
    formHistorial.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch('../php/crud_historial_cripto.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    formHistorial.reset();
                    // Recargar el historial para mostrar los cambios
                    const currentPage = 1;
                    cargarHistorial(currentPage);
                    // También recargar el total
                    cargarTotalCriptos();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al procesar la solicitud');
            });
    });
}

//----------------------------------------------------------------------------
// Cargar y mostrar el valor total de criptomonedas
function cargarTotalCriptos() {
    fetch('../php/get_total_criptos.php')
        .then(response => response.text())
        .then(total => {
            const displayElement = document.getElementById('totalCriptosDisplay');
            if (displayElement) {
                displayElement.textContent = `${total} $`;
            }
        })
        .catch(error => {
            console.error('Error al cargar total de criptos:', error);
            const displayElement = document.getElementById('totalCriptosDisplay');
            if (displayElement) {
                displayElement.textContent = 'Error al cargar';
            }
        });
}

// Cargar al inicio
document.addEventListener('DOMContentLoaded', function () {
    cargarTotalCriptos();
});

// También recargar después de enviar formularios
const formuCripto = document.getElementById('formCripto');
if (formuCripto) {
    formuCripto.addEventListener('submit', function () {
        setTimeout(cargarTotalCriptos, 500);
    });
}

if (formHistorial) {
    formHistorial.addEventListener('submit', function () {
        setTimeout(cargarTotalCriptos, 500);
    });
}

// Cargar también al inicio por si acaso
cargarTotalCriptos();

//----------------------------------------------------------------------------
// Interacción con filas de criptomonedas
document.addEventListener('DOMContentLoaded', function () {

    // --- Función para llenar formulario ---
    function rellenarFormularioCripto(datos) {
        const form = document.getElementById('formCripto');
        if (!form) return;

        form.querySelector('input[name="nombre"]').value = datos.nombre || '';
        form.querySelector('input[name="ticker"]').value = datos.ticker || '';
        form.querySelector('input[name="cantidad"]').value = datos.cantidad || '';
        form.querySelector('input[name="precio_promedio"]').value = datos.precio_promedio || '';
    }

    // --- Click en filas de criptos ---
    document.addEventListener('click', function (e) {
        const fila = e.target.closest('.fila-cripto');

        if (fila) {
            e.preventDefault();

            const datosCripto = {
                nombre: fila.getAttribute('data-nombre'),
                ticker: fila.getAttribute('data-ticker'),
                cantidad: fila.getAttribute('data-cantidad'),
                precio_promedio: fila.getAttribute('data-precio_promedio'),
                valor_actual: fila.getAttribute('data-valor_actual')
            };

            rellenarFormularioCripto(datosCripto);

            // Modo modificar
            const selectModo = document.getElementById('accion');
            if (selectModo) selectModo.value = 'modificar';

            // Resaltar fila seleccionada
            document.querySelectorAll('.fila-cripto').forEach(f => {
                f.classList.remove('fila-seleccionada-cripto');
            });
            fila.classList.add('fila-seleccionada-cripto');

            mostrarMensaje(`Criptomoneda "${datosCripto.nombre}" cargada en formulario`);

            document.getElementById('formCripto').scrollIntoView({ behavior: 'smooth' });
        }
    });

    // --- Crear botón limpiar ---
    if (document.getElementById('formCripto') && !document.getElementById('btnLimpiarCriptos')) {
        const form = document.getElementById('formCripto');
        const btnSubmit = form.querySelector('button[type="submit"]');

        const btnLimpiar = document.createElement('button');
        btnLimpiar.id = 'btnLimpiarCriptos';
        btnLimpiar.type = 'button';
        btnLimpiar.textContent = 'Limpiar';
        btnLimpiar.className = 'btn-limpiar';

        btnLimpiar.addEventListener('click', function () {
            form.reset();
            document.getElementById('criptoAcc').value = 'insertar';

            document.querySelectorAll('.fila-seleccionada-cripto').forEach(f => {
                f.classList.remove('fila-seleccionada-cripto');
            });

            mostrarMensaje('Formulario limpiado', 'info');
        });

        btnSubmit.parentNode.insertBefore(btnLimpiar, btnSubmit.nextSibling);
    }

});
