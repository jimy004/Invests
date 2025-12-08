//----------------------------------------------------------------------------
// Formulario de fondos
const accionSelectFond = document.getElementById("accionFond");
const inputsFond = document.querySelectorAll("#formFondos input:not([name=isin])");

function ajustarCamposFond() {
    const accion = accionSelectFond.value;

    if (accion === "insertar") {
        inputsFond.forEach(input => input.disabled = false);
    } else if (accion === "modificar") {
        inputsFond.forEach(input => input.disabled = false);
    } else if (accion === "eliminar") {
        inputsFond.forEach(input => input.disabled = true);
    }
}

accionSelectFond.addEventListener("change", ajustarCamposFond);
ajustarCamposFond();


//----------------------------------------------------------------------------
// Cargar tabla de fondos vía AJAX
function cargarTablaFond() {
    fetch('../php/tabla_fondos_ajax.php')
        .then(response => response.text())
        .then(html => {
            document.getElementById('tablaFondos').innerHTML = html;
            activarOrdenTabla();
        })
        .catch(error => console.error('Error al cargar la tabla:', error));
}

    

// Cargar al inicio
cargarTablaFond();

function activarOrdenTabla() {
    const tabla = document.getElementById("tablaFondos");
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
// Enviar formulario de fondos vía AJAX
const formFondos = document.getElementById('formFondos');

if (formFondos) {
    formFondos.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevenir el envío tradicional
        
        const formData = new FormData(this);
        
        fetch('../php/crud_fondo.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                // Limpiar formulario
                formFondos.reset();
                // Cambiar a modo insertar
                document.getElementById('accionFond').value = 'insertar';
                // Ajustar campos según el modo
                ajustarCamposFond();
                // Actualizar tabla
                cargarTablaFond();
                // Actualizar total
                cargarTotalFondos();
                // Actualizar gráficos (recargando la página)
                location.reload();
            }
            // Deseleccionar filas si existían
            document.querySelectorAll('.fila-seleccionada').forEach(f => {
                f.classList.remove('fila-seleccionada');
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
function cargarHistorialFond(page = 1) {
    fetch(`../php/historial_fondos.php?page=${page}`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('historialFondos').innerHTML = html;
        })
        .catch(err => console.error('Error al cargar historial:', err));
}

// Cargar al inicio
cargarHistorialFond();


//----------------------------------------------------------------------------
// Cargar gráficos de fondos
fetch('../php/graficos_fondo.php')
    .then(res => res.json())
    .then(data => {

        // === Distribución de activos (Pie) ===
        Highcharts.chart('graficoDistribucionFond', {
            chart: {
                type: 'pie'
            },
            title: {
                text: 'Distribución de Fondos'
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
        Highcharts.chart('graficoRentabilidadFond', {
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

        Highcharts.chart('graficoEvolucionFond', {
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
const accionHistorialFondSelect = document.getElementById("accionHistorialFond");
const historialFondInputs = document.querySelectorAll("#formHistorialFond input");

function ajustarCamposHistorialFond() {
    if (!accionHistorialFondSelect) return; // Protección contra null
    
    const accion = accionHistorialFondSelect.value;

    if (accion === "insertar") {
        historialFondInputs.forEach(input => {
            input.disabled = false;
            // Solo fecha y valor son requeridos para insertar
            if (input.name === 'fecha' || input.name === 'valor') {
                input.required = true;
            } else {
                input.required = false;
            }
        });
    } else if (accion === "modificar") {
        historialFondInputs.forEach(input => {
            input.disabled = false;
            // Solo fecha es requerida para modificar
            if (input.name === 'fecha') {
                input.required = true;
            } else {
                input.required = false;
            }
        });
    } else if (accion === "eliminar") {
        historialFondInputs.forEach(input => {
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

if (accionHistorialFondSelect) {
    accionHistorialFondSelect.addEventListener("change", ajustarCamposHistorialFond);
    ajustarCamposHistorialFond();
}

const formHistorialFond = document.getElementById('formHistorialFond');
if (formHistorialFond) {
    formHistorialFond.addEventListener('submit', function (e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        // Validación adicional del lado del cliente
        const accion = formData.get('accion');
        const valor = formData.get('valor');
        
        if ((accion === 'insertar' || (accion === 'modificar' && valor)) && valor && parseFloat(valor) <= 0) {
            alert('El valor debe ser mayor que 0');
            return;
        }
        
        fetch('../php/crud_historial_fondo.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                formHistorialFond.reset();
                // Recargar el historial para mostrar los cambios
                const currentPage = 1;
                cargarHistorialFond(currentPage);
                // También recargar el total
                cargarTotalFondos();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        });
    });
}

//----------------------------------------------------------------------------
// Cargar y mostrar el valor total de fondos
function cargarTotalFondos() {
    fetch('../php/get_total_fondos.php')
        .then(response => response.text())
        .then(total => {
            const displayElement = document.getElementById('totalFondosDisplay');
            if (displayElement) {
                displayElement.textContent = `${total} €`;
            }
        })
        .catch(error => {
            console.error('Error al cargar total de fondos:', error);
            const displayElement = document.getElementById('totalFondosDisplay');
            if (displayElement) {
                displayElement.textContent = 'Error al cargar';
            }
        });
}

// Cargar al inicio
document.addEventListener('DOMContentLoaded', function() {
    cargarTotalFondos();
});

// También recargar después de enviar formularios
if (formFondos) {
    formFondos.addEventListener('submit', function () {
        setTimeout(cargarTotalFondos, 500);
    });
}

if (formHistorialFond) {
    formHistorialFond.addEventListener('submit', function () {
        setTimeout(cargarTotalFondos, 500);
    });
}

// Cargar también al inicio por si acaso
cargarTotalFondos();

//----------------------------------------------------------------------------
// Agregar funcionalidad de clic en filas de fondos
document.addEventListener('DOMContentLoaded', function() {
    // Usar delegación de eventos para las filas de fondos
    document.addEventListener('click', function(e) {
        const fila = e.target.closest('.fila-fondo');
        
        if (fila) {
            e.preventDefault();
            
            // Obtener todos los datos de la fila
            const datosFondo = {
                isin: fila.getAttribute('data-isin'),
                nombre: fila.getAttribute('data-nombre'),
                cantidad: fila.getAttribute('data-cantidad'),
                precio_promedio: fila.getAttribute('data-precio_promedio'),
                moneda: fila.getAttribute('data-moneda'),
                riesgo: fila.getAttribute('data-riesgo'),
                politica: fila.getAttribute('data-politica'),
                tipo: fila.getAttribute('data-tipo'),
                gestora: fila.getAttribute('data-gestora'),
                geografia: fila.getAttribute('data-geografia')
            };
            
            // Rellenar el formulario
            rellenarFormularioFondo(datosFondo);
            
            // Cambiar a modo "modificar"
            const selectAccion = document.getElementById('accionFond');
            if (selectAccion) {
                selectAccion.value = 'modificar';
            }
            
            // Resaltar la fila seleccionada
            document.querySelectorAll('.fila-fondo').forEach(f => {
                f.classList.remove('fila-seleccionada');
            });
            fila.classList.add('fila-seleccionada');
            
            // Mostrar mensaje
            mostrarMensaje(`Fondo "${datosFondo.nombre}" cargado en formulario`);
            
            // Hacer scroll al formulario
            const formulario = document.getElementById('formFondos');
            if (formulario) {
                formulario.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
    
    // Función para rellenar el formulario
    function rellenarFormularioFondo(datos) {
        const formulario = document.getElementById('formFondos');
        if (!formulario) return;
        
        // Rellenar cada campo
        formulario.querySelector('input[name="isin"]').value = datos.isin || '';
        formulario.querySelector('input[name="nombre"]').value = datos.nombre || '';
        formulario.querySelector('input[name="cantidad"]').value = datos.cantidad || '';
        formulario.querySelector('input[name="precio_promedio"]').value = datos.precio_promedio || '';
        formulario.querySelector('input[name="moneda"]').value = datos.moneda || '';
        formulario.querySelector('input[name="riesgo"]').value = datos.riesgo || '';
        formulario.querySelector('input[name="politica"]').value = datos.politica || '';
        formulario.querySelector('input[name="tipo"]').value = datos.tipo || '';
        formulario.querySelector('input[name="gestora"]').value = datos.gestora || '';
        formulario.querySelector('input[name="geografia"]').value = datos.geografia || '';
    }


//----------------------------------------------------------------------------  
// Agregar botón para limpiar formulario
if (document.getElementById('formFondos') && !document.getElementById('btnLimpiarFondos')) {
    const form = document.getElementById('formFondos');
    const btnSubmit = form.querySelector('button[type="submit"]');
    
    const btnLimpiar = document.createElement('button');
    btnLimpiar.id = 'btnLimpiarFondos';
    btnLimpiar.type = 'button';
    btnLimpiar.textContent = 'Limpiar';
    btnLimpiar.className = 'btn-limpiar'; // Añade clase CSS

    btnLimpiar.addEventListener('click', function() {
        // Limpiar formulario
        form.reset();
        document.getElementById('accionFond').value = 'insertar';
        
        // Deseleccionar filas
        document.querySelectorAll('.fila-seleccionada').forEach(f => {
            f.classList.remove('fila-seleccionada');
        });
        
        // Mostrar mensaje
        mostrarMensaje('Formulario limpiado', 'info');
    });
    
    // Insertar botón después del botón de submit
    btnSubmit.parentNode.insertBefore(btnLimpiar, btnSubmit.nextSibling);
}
});