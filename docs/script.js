// Configura aquí la URL de tu Apps Script Web App (deployment URL que termina en /exec)
// Ejemplo: const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby.../exec";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz85jSXQjpNtbSSbtiZTqBj19XF2ayn7s9WeP8bGpeGeVS5gFnz55T2k7veGajKC1Yprg/exec"; // URL de despliegue (actualizado)

// Endpoints por hoja (el Apps Script espera ?sheet=Empaquetado | ?sheet=Merma)
const APPS_SCRIPT_URL_EMPAQUETADOS = WEB_APP_URL ? WEB_APP_URL + "?sheet=Empaquetado" : "";
const APPS_SCRIPT_URL_MERMA = WEB_APP_URL ? WEB_APP_URL + "?sheet=Merma" : "";

function generarNonce() {
    try {
        if (window.crypto && window.crypto.getRandomValues) {
            const arr = new Uint32Array(4);
            window.crypto.getRandomValues(arr);
            return Array.from(arr).map(n => n.toString(16)).join('');
        }
    } catch (_) {}
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function enviarFormulario(formId, url) {
    const form = document.getElementById(formId);
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        if (!url) {
            document.getElementById("mensaje").textContent = "Configura la URL del Apps Script (WEB_APP_URL)";
            return;
        }
        // Evitar envíos dobles (doble click, redoble toque)
        if (form.dataset.submitting === "1") {
            return; // ya se está enviando
        }
        form.dataset.submitting = "1";
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Enviando..."; }
        const msgEl = document.getElementById("mensaje");
        if (msgEl) msgEl.textContent = "Enviando...";
        const datos = new FormData(form);
        // Idempotencia: token anti-duplicado
        const nonce = generarNonce();
        datos.append('nonce', nonce);
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
            if (msgEl) msgEl.textContent = ok ? "¡Formulario enviado correctamente!" : "Error al enviar el formulario.";
            form.reset();
            // Limpiar cantidades después de reset si la lista existe
            const qtyInputs = form.querySelectorAll('.prod-qty');
            qtyInputs.forEach(i => i.value = "");
            setTimeout(() => {
                if (msgEl) msgEl.textContent = "";
            }, 3000);
        })
        .catch(error => {
            if (msgEl) msgEl.textContent = "Error al enviar el formulario.";
        })
        .finally(() => {
            form.dataset.submitting = "0";
            const btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.disabled = false; btn.textContent = "Enviar"; }
        });
    });
}

enviarFormulario("empaquetados-form", APPS_SCRIPT_URL_EMPAQUETADOS);
enviarFormulario("merma-form", APPS_SCRIPT_URL_MERMA);
