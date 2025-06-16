document.addEventListener('DOMContentLoaded', () => {

    const botonOptimizar = document.getElementById('optimizar-btn');
    const tickersInput = document.getElementById('tickers-input');

    // OYENTE #1: Escucha la tecla Enter
    tickersInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            botonOptimizar.click();
        }
    });

    // OYENTE #2: Escucha el clic del botón. 
    // ¡Ahora la función es "async" para poder usar "await"!
    botonOptimizar.addEventListener('click', async () => {
        
        // 1. Obtenemos la selección del usuario (esto es igual que antes)
        const perfilRiesgo = document.querySelector('input[name="perfil"]:checked').value;
        const periodoAños = document.querySelector('input[name="periodo"]:checked').value;
        const tickers = tickersInput.value;

        // Validamos que el usuario haya escrito algo
        if (!tickers) {
            alert("Por favor, ingresa al menos un ticker.");
            return; // Detenemos la ejecución si no hay tickers
        }

        // --- ¡AQUÍ EMPIEZA LA MAGIA NUEVA! ---

        console.log("Iniciando la búsqueda de datos para:", tickers);
        alert("¡Recibido! Estamos buscando los datos en Yahoo Finance. Esto puede tardar unos segundos...");

        try {
            // 2. Preparamos las fechas
            const fechaFin = new Date();
            const fechaInicio = new Date();
            fechaInicio.setFullYear(fechaInicio.getFullYear() - periodoAños);

            // Convertimos las fechas a "timestamps", que es como a Yahoo Finance le gusta
            const periodoInicio = Math.floor(fechaInicio.getTime() / 1000);
            const periodoFin = Math.floor(fechaFin.getTime() / 1000);

            // 3. Construimos la URL para pedir los datos.
            // Por ahora, pediremos los datos del PRIMER ticker que el usuario escriba.
            const primerTicker = tickers.split(',')[0].trim(); // Tomamos solo el primero y le quitamos espacios
            
            const urlYahoo = `https://query1.finance.yahoo.com/v7/finance/download/${primerTicker}?period1=${periodoInicio}&period2=${periodoFin}&interval=1d&events=history`;
            
            // 4. Usamos nuestro "intermediario amigo" para evitar problemas de CORS
            const urlProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(urlYahoo)}`;

            // 5. ¡Llamamos al mensajero! Usamos "await" para esperar la respuesta
            const respuesta = await fetch(urlProxy);
            const datos = await respuesta.json(); // Le pedimos que nos de el contenido

            // 6. Por ahora, solo mostraremos en la consola lo que recibimos.
            // El contenido real de Yahoo está dentro de "datos.contents"
            console.log("¡Datos recibidos de Yahoo Finance!");
            console.log(datos.contents);

            alert("¡Datos recibidos con éxito! Revisa la consola para ver la respuesta de Yahoo Finance.");

        } catch (error) {
            // Si algo sale mal (ej: el ticker no existe), atrapamos el error
            console.error("Hubo un error al buscar los datos:", error);
            alert("Hubo un error al buscar los datos. Asegúrate de que el ticker sea correcto y vuelve a intentarlo.");
        }
    });
});
