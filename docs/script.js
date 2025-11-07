// Configura aquí la URL de tu Apps Script Web App (deployment URL que termina en /exec)
// Ejemplo: const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby.../exec";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbygvu8qFAekQ4HFuSQY0lF2S-lu1m-8JPvn7_gNkx9Ytmnu0GfOx0rCH7HYxsIIjAUvjw/exec"; // URL de despliegue

// Endpoints por hoja (el Apps Script espera ?sheet=Empaquetado | ?sheet=Merma)
const APPS_SCRIPT_URL_EMPAQUETADOS = WEB_APP_URL ? WEB_APP_URL + "?sheet=Empaquetado" : "";
const APPS_SCRIPT_URL_MERMA = WEB_APP_URL ? WEB_APP_URL + "?sheet=Merma" : "";

function enviarFormulario(formId, url) {
    const form = document.getElementById(formId);
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        if (!url) {
            document.getElementById("mensaje").textContent = "Configura la URL del Apps Script (WEB_APP_URL)";
            return;
        }
        const datos = new FormData(form);
        // Agregar solo los productos con cantidad > 0 como JSON
        try {
            const qtyInputs = form.querySelectorAll('.prod-qty');
            const seleccionados = [];
            qtyInputs.forEach(inp => {
                const val = parseInt(inp.value, 10);
                if (!isNaN(val) && val > 0) {
                    seleccionados.push({
                        codigo: inp.dataset.codigo,
                        descripcion: inp.dataset.desc || '',
                        unidad: inp.dataset.unidad || '',
                        cantidad: val
                    });
                }
            });
            if (seleccionados.length) {
                datos.append('productos_json', JSON.stringify(seleccionados));
            }
            // Identificar a qué hoja va (para depuración opcional en backend)
            if (url.includes('Empaquetado')) datos.append('sheet', 'Empaquetado');
            if (url.includes('Merma')) datos.append('sheet', 'Merma');
        } catch(_) { /* no-op */ }
        fetch(url, {
            method: "POST",
            body: datos
        })
        .then(async (response) => {
            let txt = await response.text();
            let ok = response.ok;
            try { const j = JSON.parse(txt); ok = j.ok !== undefined ? j.ok : ok; } catch(e) {}
            document.getElementById("mensaje").textContent = ok ? "¡Formulario enviado correctamente!" : "Error al enviar el formulario.";
            form.reset();
            // Limpiar cantidades después de reset si la lista existe
            const qtyInputs = form.querySelectorAll('.prod-qty');
            qtyInputs.forEach(i => i.value = "");
            setTimeout(() => {
                document.getElementById("mensaje").textContent = "";
            }, 3000);
        })
        .catch(error => {
            document.getElementById("mensaje").textContent = "Error al enviar el formulario.";
        });
    });
}

enviarFormulario("empaquetados-form", APPS_SCRIPT_URL_EMPAQUETADOS);
enviarFormulario("merma-form", APPS_SCRIPT_URL_MERMA);
