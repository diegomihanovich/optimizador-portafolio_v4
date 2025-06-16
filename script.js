// Este código se ejecutará cuando todo el contenido del HTML se haya cargado
document.addEventListener('DOMContentLoaded', () => {

    // 1. Guardamos en variables los elementos del HTML con los que vamos a interactuar
    const botonOptimizar = document.getElementById('optimizar-btn');
    const tickersInput = document.getElementById('tickers-input');
    
    // --- INICIO DEL CÓDIGO NUEVO ---
    // Le enseñamos a la caja de texto a reaccionar a la tecla "Enter"
    tickersInput.addEventListener('keydown', (event) => {
        // Si la tecla que se presionó fue 'Enter'...
        if (event.key === 'Enter') {
            // ...prevenimos el comportamiento por defecto (que es recargar la página)
            event.preventDefault();
            // ...y hacemos "clic" en el botón por código. ¡Un truco genial!
            botonOptimizar.click();
        }
    });
    // --- FIN DEL CÓDIGO NUEVO ---

    // 2. Le decimos al botón que se ponga a "escuchar" un evento: el 'click'
    botonOptimizar.addEventListener('click', () => {
        
        // Cuando alguien haga click, se ejecutará este código:
        
        // 3. Obtenemos los valores seleccionados por el usuario
        const perfilRiesgo = document.querySelector('input[name="perfil"]:checked').value;
        const periodo = document.querySelector('input[name="periodo"]:checked').value;
        const tickers = tickersInput.value;

        // 4. Creamos un "paquete" con toda la información
        const seleccionUsuario = {
            perfil: perfilRiesgo,
            periodo: periodo,
            activos: tickers
        };

        // 5. ¡El truco de magia! Mostramos este paquete en la consola del desarrollador.
        console.log("El usuario ha seleccionado:");
        console.log(seleccionUsuario);

        alert("¡Recibimos tu selección! Revisa la consola para ver los detalles (Clic derecho -> Inspeccionar -> Consola).");

    });
});
