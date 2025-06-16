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

// --- FUNCIONES DE AYUDA (VERSIÓN FINAL Y ROBUSTA) ---

async function fetchDataForTicker(ticker) {
    const periodoAños = document.querySelector('input[name="periodo"]:checked').value;
    const rango = `${periodoAños}y`;

    const urlYahoo = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${rango}&interval=1d`;
    const urlProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(urlYahoo)}`;

    const respuesta = await fetch(urlProxy);
    if (!respuesta.ok) throw new Error(`Error de red para ${ticker}`);

    const datosCrudos = await respuesta.json();
    const datos = JSON.parse(datosCrudos.contents);

    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN FINAL! ---
    // Esta es la validación más robusta.
    // 1. Primero pregunta si la "oficina" (datos.chart) está vacía (es null).
    // 2. Si no está vacía, pregunta si adentro hay una nota de error (datos.chart.error).
    if (!datos.chart || datos.chart.error) {
        // Si cualquiera de las dos es cierta, lanzamos un error claro.
        const mensajeError = datos.chart ? datos.chart.error.description : `No se encontraron datos para el ticker "${ticker}"`;
        throw new Error(mensajeError);
    }
    
    return { ticker, data: datos.chart.result[0] };
}

function organizarDatosPorFecha(respuestas) {
    const tablaFinal = {};
    if (respuestas.length === 0 || !respuestas[0].data.timestamp) {
        return tablaFinal; // Devuelve tabla vacía si no hay datos
    }

    const timestamps = respuestas[0].data.timestamp;

    for (let i = 0; i < timestamps.length; i++) {
        const ts = timestamps[i] * 1000;
        const fecha = new Date(ts).toISOString().split('T')[0];
        tablaFinal[fecha] = {};

        respuestas.forEach(resp => {
            const ticker = resp.ticker;
            if (resp.data.indicators.quote[0].close) {
                const precioCierre = resp.data.indicators.quote[0].close[i];
                if (precioCierre !== null) {
                    tablaFinal[fecha][ticker] = precioCierre;
                }
            }
        });
    }
    // Filtramos días en los que algún ticker no tenga datos, para tener una tabla consistente
    for (const fecha in tablaFinal) {
        if (Object.keys(tablaFinal[fecha]).length < respuestas.length) {
            delete tablaFinal[fecha];
        }
    }
    return tablaFinal;
}
