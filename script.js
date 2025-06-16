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
            // Convertimos el string de tickers en un array limpio
            const tickers = tickersString.split(',').map(ticker => ticker.trim().toUpperCase());
            
            // Usamos Promise.all para buscar los datos de TODOS los tickers en paralelo.
            // ¡Es mucho más rápido!
            const respuestasCrudas = await Promise.all(
                tickers.map(ticker => fetchDataForTicker(ticker))
            );

            // Ahora "traducimos" cada respuesta CSV a un formato que JS entiende (JSON)
            const datosParseados = respuestasCrudas.map((respuesta, index) => {
                const csvData = respuesta.datos.contents;
                const ticker = tickers[index];
                // Usamos Papa Parse, nuestro traductor!
                const parsed = Papa.parse(csvData, {
                    header: true, // La primera fila es el encabezado
                    dynamicTyping: true // Convierte números y booleanos automáticamente
                });
                return { ticker, data: parsed.data };
            });

            // Finalmente, organizamos todo en una sola tabla, alineada por fecha
            const datosOrganizados = organizarDatosPorFecha(datosParseados);

            console.log("¡Datos organizados y listos para calcular!");
            console.log(datosOrganizados);
            alert("¡Datos procesados con éxito! Revisa la consola para ver la tabla de datos estructurada.");

        } catch (error) {
            console.error("Hubo un error en el proceso:", error);
            alert("Hubo un error en el proceso. Revisa la consola para más detalles.");
        }
    });
});

// --- NUEVAS FUNCIONES DE AYUDA ---

// Función dedicada a buscar datos para UN solo ticker
async function fetchDataForTicker(ticker) {
    const periodoAños = document.querySelector('input[name="periodo"]:checked').value;
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setFullYear(fechaInicio.getFullYear() - periodoAños);

    const periodoInicio = Math.floor(fechaInicio.getTime() / 1000);
    const periodoFin = Math.floor(fechaFin.getTime() / 1000);

    const urlYahoo = `https://query1.finance.yahoo.com/v7/finance/download/${ticker}?period1=${periodoInicio}&period2=${periodoFin}&interval=1d&events=history`;
    const urlProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(urlYahoo)}`;

    const respuesta = await fetch(urlProxy);
    if (!respuesta.ok) {
        throw new Error(`Error al buscar datos para ${ticker}`);
    }
    const datos = await respuesta.json();
    return { ticker, datos };
}

// Función que toma los datos de todos los tickers y los organiza por fecha
function organizarDatosPorFecha(datosParseados) {
    const tablaFinal = {};

    datosParseados.forEach(activo => {
        activo.data.forEach(fila => {
            // Nos aseguramos que la fila tenga una fecha y un precio de cierre
            if (fila.Date && fila['Adj Close'] !== null) {
                const fecha = fila.Date;

                // Si la fecha no existe en nuestra tabla, la creamos
                if (!tablaFinal[fecha]) {
                    tablaFinal[fecha] = {};
                }

                // Agregamos el precio de cierre ajustado del activo para esa fecha
                tablaFinal[fecha][activo.ticker] = fila['Adj Close'];
            }
        });
    });

    return tablaFinal;
}
