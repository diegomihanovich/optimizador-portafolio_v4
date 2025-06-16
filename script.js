// --- SCRIPT.JS VERSIÓN "INDEPENDENCIA TOTAL" ---

document.addEventListener('DOMContentLoaded', () => {
    const botonOptimizar = document.getElementById('optimizar-btn');
    const tickersInput = document.getElementById('tickers-input');

    const iniciarOptimizacion = async () => {
        const tickersString = tickersInput.value;
        if (!tickersString.trim()) {
            alert("Por favor, ingresa al menos un ticker.");
            return;
        }
        alert("¡Recibido! Buscando y procesando datos...");
        try {
            const tickers = tickersString.split(',').map(ticker => ticker.trim().toUpperCase());
            const resultadosPromesas = await Promise.allSettled(
                tickers.map(ticker => fetchDataForTicker(ticker))
            );
            const respuestasExitosas = resultadosPromesas.filter(res => res.status === 'fulfilled').map(res => res.value);
            const respuestasFallidas = resultadosPromesas.filter(res => res.status === 'rejected');
            if (respuestasFallidas.length > 0) {
                const errores = respuestasFallidas.map(res => res.reason.message).join('\n');
                console.error("Algunos tickers fallaron:\n", errores);
                alert(`Algunos tickers fallaron. Revisa la consola.`);
            }
            if (respuestasExitosas.length === 0) {
                throw new Error("No se pudieron obtener datos para ninguno de los tickers ingresados.");
            }

            const datosOrganizados = organizarDatosPorFecha(respuestasExitosas);
            console.log("¡Datos organizados y listos!", datosOrganizados);

            const metricasFinancieras = calcularMetricas(datosOrganizados);
            
            console.log("¡Métricas financieras calculadas!", metricasFinancieras);
            alert("¡Métricas calculadas con éxito! Estamos listos para el paso final.");

        } catch (error) {
            console.error("Hubo un error crítico en el proceso:", error);
            alert(`Hubo un error crítico: ${error.message}`);
        }
    };

    botonOptimizar.addEventListener('click', iniciarOptimizacion);
    tickersInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            iniciarOptimizacion();
        }
    });
});

async function fetchDataForTicker(ticker) {
    const periodoAños = document.querySelector('input[name="periodo"]:checked').value;
    const rango = `${periodoAños}y`;
    const urlYahoo = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${rango}&interval=1d`;
    const urlProxy = `https://corsproxy.io/?${encodeURIComponent(urlYahoo)}`;
    const respuesta = await fetch(urlProxy);
    if (!respuesta.ok) throw new Error(`Error de red para ${ticker}`);
    const datos = await respuesta.json(); 
    if (!datos.chart || datos.chart.error) {
        const mensajeError = datos.chart?.error?.description || `No se encontraron datos para el ticker "${ticker}"`;
        throw new Error(mensajeError);
    }
    return { ticker, data: datos.chart.result[0] };
}

function organizarDatosPorFecha(respuestas) {
    if (respuestas.length === 0) return {};
    const tablaFinal = {};
    const primerActivo = respuestas[0];
    const timestamps = primerActivo.data.timestamp;
    for (let i = 0; i < timestamps.length; i++) {
        const ts = timestamps[i] * 1000;
        const fecha = new Date(ts).toISOString().split('T')[0];
        let filaCompleta = true;
        const filaTemporal = {};
        for (const resp of respuestas) {
            const ticker = resp.ticker;
            const precioCierre = resp.data.indicators.quote[0].close[i];
            if (precioCierre !== null) {
                filaTemporal[ticker] = precioCierre;
            } else {
                filaCompleta = false;
                break;
            }
        }
        if (filaCompleta) {
            tablaFinal[fecha] = filaTemporal;
        }
    }
    return tablaFinal;
}

// --- NUEVA FUNCIÓN AUXILIAR PARA CALCULAR LA COVARIANZA MANUALMENTE ---
function _calcularCovarianzaManual(serieA, serieB) {
    const mediaA = math.mean(serieA);
    const mediaB = math.mean(serieB);
    let cov = 0;
    const n = serieA.length;
    for (let i = 0; i < n; i++) {
        cov += (serieA[i] - mediaA) * (serieB[i] - mediaB);
    }
    return cov / (n - 1);
}

function calcularMetricas(datosOrganizados) {
    console.log("Ejecutando la versión AUTOSUFICIENTE de calcularMetricas...");

    const fechas = Object.keys(datosOrganizados).sort();
    const tickers = Object.keys(datosOrganizados[fechas[0]]);
    const nActivos = tickers.length;

    const seriesDePrecios = tickers.map(ticker => 
        fechas.map(fecha => datosOrganizados[fecha][ticker])
    );

    const seriesDeRendimientos = seriesDePrecios.map(serie => {
        const rendimientos = [];
        for (let i = 1; i < serie.length; i++) {
            const rendimiento = (serie[i] / serie[i-1]) - 1;
            rendimientos.push(rendimiento);
        }
        return rendimientos;
    });

    const rendimientosEsperados = seriesDeRendimientos.map(serie => math.mean(serie));
    const volatilidades = seriesDeRendimientos.map(serie => math.std(serie));

    // --- ¡AQUÍ ESTÁ EL CAMBIO CLAVE! ---
    // Construimos la Matriz de Covarianza usando NUESTRA PROPIA FUNCIÓN
    const matrizCovarianza = [];
    for (let i = 0; i < nActivos; i++) {
        matrizCovarianza[i] = [];
        for (let j = 0; j < nActivos; j++) {
            const cov = _calcularCovarianzaManual(seriesDeRendimientos[i], seriesDeRendimientos[j]);
            matrizCovarianza[i][j] = cov;
        }
    }

    const diasDeMercado = 252;
    const rendimientosAnualizados = rendimientosEsperados.map(r => r * diasDeMercado);
    const volatilidadesAnualizadas = volatilidades.map(v => v * Math.sqrt(diasDeMercado));
    const matrizCovAnualizada = math.multiply(matrizCovarianza, diasDeMercado);
    
    return {
        tickers,
        rendimientosAnualizados,
        volatilidadesAnualizadas,
        matrizCovarianza: matrizCovAnualizada
    };
}
