// Cargar el header de forma dinámica
document.addEventListener("DOMContentLoaded", () => {
    fetch("header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
        })
        .catch(err => console.error("Error cargando header:", err));
});

// Cargar el footer de forma dinámica
document.addEventListener("DOMContentLoaded", () => {
    fetch("footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        })
        .catch(err => console.error("Error cargando footer:", err));
});

// Versión simplificada - un solo hover card que cambia de clase
document.addEventListener('DOMContentLoaded', function () {
    const hoverCard = document.createElement('div');
    hoverCard.id = 'global-hover-card';
    hoverCard.className = 'hover-card';
    document.body.appendChild(hoverCard);

    let hoverTimeout;

    document.addEventListener('mouseover', function (e) {
        // Buscar cualquier fila que tenga data-hover-content
        const targetRow = e.target.closest('tr[data-hover-content]');
        
        if (targetRow) {
            console.log('Fila encontrada:', targetRow.className);
            clearTimeout(hoverTimeout);
            
            const content = targetRow.getAttribute('data-hover-content');
            const isAccion = targetRow.classList.contains('fila-accion') || 
                            targetRow.classList.contains('fila-tabla-accion');
            
            // Cambiar clase según el tipo
            if (isAccion) {
                hoverCard.className = 'hover-card-accion';
            } else {
                hoverCard.className = 'hover-card';
            }
            
            hoverCard.innerHTML = content;
            hoverCard.style.display = 'block';
            positionHoverCard(e, hoverCard);
        }
    });

    document.addEventListener('mousemove', function (e) {
        if (hoverCard.style.display === 'block') {
            positionHoverCard(e, hoverCard);
        }
    });

    document.addEventListener('mouseout', function (e) {
        const targetRow = e.target.closest('tr[data-hover-content]');
        if (targetRow) {
            hoverTimeout = setTimeout(() => {
                hoverCard.style.display = 'none';
            }, 100);
        }
    });

    hoverCard.addEventListener('mouseenter', function () {
        clearTimeout(hoverTimeout);
    });

    hoverCard.addEventListener('mouseleave', function () {
        hoverTimeout = setTimeout(() => {
            hoverCard.style.display = 'none';
        }, 100);
    });

    function positionHoverCard(e, cardElement) {
        const cardWidth = cardElement.offsetWidth;
        const cardHeight = cardElement.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let x = e.clientX + 15;
        let y = e.clientY + 15;

        if (x + cardWidth > windowWidth) {
            x = e.clientX - cardWidth - 15;
        }

        if (y + cardHeight > windowHeight) {
            y = e.clientY - cardHeight - 15;
        }

        cardElement.style.left = x + 'px';
        cardElement.style.top = y + 'px';
    }

    window.addEventListener('scroll', function () {
        hoverCard.style.display = 'none';
    });
});

// Función para mostrar mensaje
function mostrarMensaje(texto, tipo) {
    // Eliminar mensaje anterior si existe
    const mensajeAnterior = document.querySelector('.mensaje');
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }

    // Crear nuevo mensaje
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje ${tipo}`;
    mensaje.textContent = texto;

    document.body.appendChild(mensaje);

    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
        mensaje.classList.add('desapareciendo');
        setTimeout(() => mensaje.remove(), 300);
    }, 3000);
}