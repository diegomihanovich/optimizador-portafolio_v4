document.addEventListener('DOMContentLoaded', () => {
    const botonOptimizar = document.getElementById('optimizar-btn');
    const tickersInput = document.getElementById('tickers-input');

    tickersInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            botonOptimizar.click();
        }
    });

    botonOptimizar.addEventListener('click', async () => {
        const tickersString = tickersInput.value;
        if (!tickersString) {
            alert("Por favor, ingresa al menos un ticker.");
            return;
        }

        alert("¡Recibido! Buscando y procesando datos... Esto puede tardar unos segundos.");

        try {
            const tickers = tickersString.split(',').map(ticker => ticker.trim().toUpperCase());
            
            const respuestas = await Promise.all(
                tickers.map(ticker => fetchDataForTicker(ticker))
            );

            const datosOrganizados = organizarDatosPorFecha(respuestas);

            console.log("¡Datos organizados y listos para calcular!");
            console.log(datosOrganizados);
            alert("¡Datos procesados con éxito! Revisa la consola para ver la tabla de datos estructurada.");

        } catch (error) {
            console.error("Hubo un error en el proceso:", error);
            alert("Hubo un error en el proceso. Revisa la consola para más detalles.");
        }
    });
});

// --- FUNCIONES DE AYUDA REESCRITAS ---

// Función NUEVA para buscar datos en la nueva dirección de Yahoo
async function fetchDataForTicker(ticker) {
    const periodoAños = document.querySelector('input[name="periodo"]:checked').value;
    // La nueva API usa "range" en lugar de fechas exactas, lo cual es más fácil
    const rango = `${periodoAños}y`; // ej: "5y" para 5 años

    // Esta es la NUEVA URL que sí funciona
    const urlYahoo = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${rango}&interval=1d`;
    const urlProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(urlYahoo)}`;

    const respuesta = await fetch(urlProxy);
    if (!respuesta.ok) throw new Error(`Error de red para ${ticker}`);

    const datosCrudos = await respuesta.json();
    const datos = JSON.parse(datosCrudos.contents); // El contenido es un string JSON que hay que parsear

    // Validamos que Yahoo no devolvió un error interno
    if (datos.chart.error) {
        throw new Error(datos.chart.error.description);
    }
    
    // Devolvemos el ticker y el resultado bueno
    return { ticker, data: datos.chart.result[0] };
}

// Función NUEVA para organizar los datos desde el formato JSON
function organizarDatosPorFecha(respuestas) {
    const tablaFinal = {};
    const tickers = respuestas.map(r => r.ticker);

    // Necesitamos las fechas del primer activo como referencia
    const timestamps = respuestas[0].data.timestamp;

    for (let i = 0; i < timestamps.length; i++) {
        // Convertimos el timestamp a una fecha legible YYYY-MM-DD
        const ts = timestamps[i] * 1000;
        const fecha = new Date(ts).toISOString().split('T')[0];

        tablaFinal[fecha] = {};

        // Para cada ticker, buscamos el precio de cierre en el mismo índice (i)
        respuestas.forEach(resp => {
            const ticker = resp.ticker;
            const preciosCierre = resp.data.indicators.quote[0].close;
            // Nos aseguramos que haya un precio para ese día
            if (preciosCierre && preciosCierre[i] !== null) {
                tablaFinal[fecha][ticker] = preciosCierre[i];
            }
        });
    }
    return tablaFinal;
}
