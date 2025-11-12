// Configura aquí la URL de tu Apps Script Web App (deployment URL que termina en /exec)
// Ejemplo: const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby.../exec";
// Si hay URL guardada en ajustes, úsala; si no, fallback a la fija:
const WEB_APP_URL = (typeof localStorage !== 'undefined' && localStorage.getItem('WEB_APP_URL_DYNAMIC'))
    ? localStorage.getItem('WEB_APP_URL_DYNAMIC')
    : "https://script.google.com/macros/s/AKfycbxOro1KA6gOszvEXQlfCdI99PPGdxrB5Z7n7XJsZSj_YW8aKEPHoUww1Hb_5W5reF0LUA/exec"; // URL por defecto (deployment actual)

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
        // Formatear fecha a dd-mm-aaaa si viene como yyyy-mm-dd
        try {
            const fechaInput = form.querySelector('input[name="fecha"]');
            const raw = fechaInput ? (fechaInput.value||'').trim() : '';
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                const [y,m,d] = raw.split('-');
                datos.set('fecha', `${d}-${m}-${y}`);
            }
        } catch(_) { /* no-op */ }
        // Idempotencia: token anti-duplicado (reutiliza el mismo nonce en reintentos)
        let nonce = form.dataset.nonce || localStorage.getItem(`nonce_${formId}`) || '';
        if (!nonce) {
            nonce = generarNonce();
            form.dataset.nonce = nonce;
            try { localStorage.setItem(`nonce_${formId}`, nonce); } catch(_) {}
        }
        datos.append('nonce', nonce);
        // Agregar solo los productos con cantidad > 0 como JSON
        try {
            const qtyInputs = form.querySelectorAll('.prod-qty');
            const seleccionados = [];
            qtyInputs.forEach(inp => {
                const val = parseInt(inp.value, 10);
                if (!isNaN(val) && val > 0) {
                    const row = inp.closest('.producto-line');
                    const motivoEl = row ? row.querySelector('.merma-motivo') : null;
                    const loteEl = row ? row.querySelector('.merma-lote') : null;
                    seleccionados.push({
                        codigo: inp.dataset.codigo,
                        descripcion: inp.dataset.desc || '',
                        unidad: inp.dataset.unidad || '',
                        cantidad: val,
                        motivo: motivoEl ? (motivoEl.value||'') : '',
                        lote: loteEl ? (loteEl.value||'') : ''
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
            let txt;
            try { txt = await response.text(); } catch(_) { txt = ''; }
            let ok = response.ok;
            let duplicate = false;
            try { const j = JSON.parse(txt); ok = j.ok !== undefined ? j.ok : ok; duplicate = !!j.duplicate; } catch(e) { /* response no JSON */ }
            // Consideramos éxito también si la respuesta es no legible pero status 200 (opaque redirect no-cors)
            if (ok || response.status === 0) {
                if (msgEl) msgEl.textContent = duplicate ? "Registro ya existente (deduplicado)." : "¡Formulario enviado correctamente!";
                // Disparar evento para página de registros
                try {
                    const insertedCount = Array.from(form.querySelectorAll('.prod-qty')).filter(inp => parseInt(inp.value,10)>0).length;
                    const hoja = url.includes('Empaquetado') ? 'Empaquetado' : (url.includes('Merma') ? 'Merma' : '');
                    window.dispatchEvent(new CustomEvent('registroInsertado',{ detail:{ sheet:hoja, productos:insertedCount, nonce: form.dataset.nonce || '' }}));
                } catch(_) {}
                form.reset();
                const qtyInputs = form.querySelectorAll('.prod-qty');
                qtyInputs.forEach(i => i.value = "");
                const contenedores = form.querySelectorAll('.seleccionados');
                contenedores.forEach(c => c.innerHTML = "");
                delete form.dataset.nonce;
                try { localStorage.removeItem(`nonce_${formId}`); } catch(_) {}
                setTimeout(() => { if (msgEl) msgEl.textContent = ""; }, 3000);
            } else {
                if (msgEl) msgEl.textContent = "Error al enviar el formulario. Puedes reintentar.";
            }
        })
        .catch(error => {
            // Fallback: asumimos que puede haber sido un bloqueo de lectura pero el backend insertó la fila.
            if (msgEl) msgEl.textContent = "Posible envío exitoso (respuesta no legible). Verifica en la hoja. Si falta, reintenta.";
            // No limpiamos por si realmente no llegó; conservamos nonce para reintentar.
        })
        .finally(() => {
            // Pequeño enfriamiento para evitar reenvío inmediato
            setTimeout(() => {
                form.dataset.submitting = "0";
                const btn = form.querySelector('button[type="submit"]');
                if (btn) {
                    btn.disabled = false;
                    // Si hay nonce activo, ofrecer reintento; si no, volver a "Enviar"
                    btn.textContent = (form.dataset.nonce || localStorage.getItem(`nonce_${formId}`)) ? "Reintentar" : "Enviar";
                }
            }, 800);
        });
    });
}

// Limpieza manual de formulario
function clearForm(formId){
    const form = document.getElementById(formId);
    if(!form) return;
    form.reset();
    // Limpiar cantidades y contenedores de productos seleccionados
    const qtyInputs = form.querySelectorAll('.prod-qty');
    qtyInputs.forEach(i => i.value = "");
    const contenedores = form.querySelectorAll('.seleccionados');
    contenedores.forEach(c => c.innerHTML = "");
    // Limpiar nonce para permitir nuevo envío independiente
    delete form.dataset.nonce;
    try { localStorage.removeItem(`nonce_${formId}`); } catch(_) {}
    const msgEl = document.getElementById('mensaje');
    if (msgEl) {
        msgEl.textContent = 'Formulario limpiado.';
        setTimeout(()=>{ if(msgEl.textContent==='Formulario limpiado.') msgEl.textContent=''; },2000);
    }
    // Restaurar texto del botón si estaba en otro estado
    const btn = form.querySelector('button[type="submit"]');
    if(btn) btn.textContent = 'Enviar';
}

enviarFormulario("empaquetados-form", APPS_SCRIPT_URL_EMPAQUETADOS);
enviarFormulario("merma-form", APPS_SCRIPT_URL_MERMA);
