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
            
            const respuestasCrudas = await Promise.all(
                tickers.map(ticker => fetchDataForTicker(ticker))
            );

            const datosParseados = respuestasCrudas.map((respuesta, index) => {
                const csvData = respuesta.datos.contents;
                const ticker = tickers[index];
                const parsed = Papa.parse(csvData, {
                    header: true,
                    dynamicTyping: true
                });
                return { ticker, data: parsed.data };
            });

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
        throw new Error(`Error de red al buscar datos para ${ticker}`);
    }
    const datos = await respuesta.json();
    
    // --- AQUÍ ESTÁ LA CORRECCIÓN ---
    // Chequeamos si el contenido existe y, ANTES de revisar si empieza con "Date", le quitamos los espacios en blanco del principio con .trim()
    if (!datos.contents || !datos.contents.trim().startsWith('Date,')) {
        throw new Error(`No se encontraron datos para el ticker "${ticker}". Puede que no exista o no haya datos para el período seleccionado.`);
    }

    return { ticker, datos };
}

// Función que toma los datos de todos los tickers y los organiza por fecha
function organizarDatosPorFecha(datosParseados) {
    const tablaFinal = {};

    datosParseados.forEach(activo => {
        activo.data.forEach(fila => {
            if (fila.Date && fila['Adj Close'] !== null) {
                const fecha = fila.Date;
                if (!tablaFinal[fecha]) {
                    tablaFinal[fecha] = {};
                }
                tablaFinal[fecha][activo.ticker] = fila['Adj Close'];
            }
        });
    });

    return tablaFinal;
}
