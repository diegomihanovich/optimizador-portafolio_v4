document.addEventListener('DOMContentLoaded', () => {
    // ... (El código del event listener principal es muy similar)
    const botonOptimizar = document.getElementById('optimizar-btn');
    const tickersInput = document.getElementById('tickers-input');

    const iniciarOptimizacion = async () => {
        // ... (Toda la lógica de búsqueda y cálculo es igual)
        const tickersString = tickersInput.value;
        if (!tickersString.trim()) {
            alert("Por favor, ingresa al menos un ticker.");
            return;
        }
        alert("¡Recibido! Iniciando proceso completo...");
        try {
            const tickers = tickersString.split(',').map(ticker => ticker.trim().toUpperCase());
            const resultadosPromesas = await Promise.allSettled(tickers.map(ticker => fetchDataForTicker(ticker)));
            const respuestasExitosas = resultadosPromesas.filter(res => res.status === 'fulfilled').map(res => res.value);
            const respuestasFallidas = resultadosPromesas.filter(res => res.status === 'rejected');
            if (respuestasFallidas.length > 0) {
                const errores = respuestasFallidas.map(res => res.reason.message).join('\n');
                console.error("Algunos tickers fallaron:\n", errores);
                alert(`Algunos tickers fallaron. Revisa la consola.`);
            }
            if (respuestasExitosas.length === 0) throw new Error("No se pudieron obtener datos para ninguno de los tickers.");

            const datosOrganizados = organizarDatosPorFecha(respuestasExitosas);
            const metricasFinancieras = calcularMetricas(datosOrganizados);
            const portafoliosOptimos = optimizarPortafolio(metricasFinancieras);

            // --- ¡CAMBIO FINAL! ---
            // En lugar de console.log y alert, llamamos a nuestra función "artista"
            mostrarResultados(portafoliosOptimos);

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

// --- Las funciones de ayuda (fetchData, organizarDatos, calcularMetricas, optimizarPortafolio) son las mismas que la versión anterior ---
// --- Las incluyo todas para que solo tengas que copiar y pegar un archivo ---

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
// REEMPLAZA SOLAMENTE ESTA FUNCIÓN EN TU SCRIPT.JS

function organizarDatosPorFecha(respuestas) {
    if (respuestas.length === 0) return {};

    // Paso 1: Crear un mapa de precios para cada ticker, con la fecha como clave.
    const datosPorTicker = new Map();
    respuestas.forEach(resp => {
        const precios = new Map();
        for (let i = 0; i < resp.data.timestamp.length; i++) {
            const fecha = new Date(resp.data.timestamp[i] * 1000).toISOString().split('T')[0];
            const precio = resp.data.indicators.quote[0].close[i];
            if (precio !== null) {
                precios.set(fecha, precio);
            }
        }
        datosPorTicker.set(resp.ticker, precios);
    });

    // Paso 2: Encontrar la intersección de fechas (días que existen en TODOS los tickers)
    const tickers = Array.from(datosPorTicker.keys());
    const fechasBase = Array.from(datosPorTicker.get(tickers[0]).keys());
    
    const fechasComunes = fechasBase.filter(fecha => 
        tickers.every(ticker => datosPorTicker.get(ticker).has(fecha))
    );

    // Paso 3: Construir la tabla final usando solo las fechas comunes
    const tablaFinal = {};
    fechasComunes.forEach(fecha => {
        tablaFinal[fecha] = {};
        tickers.forEach(ticker => {
            tablaFinal[fecha][ticker] = datosPorTicker.get(ticker).get(fecha);
        });
    });

    return tablaFinal;
}
function _calcularCovarianzaManual(serieA, serieB) {
    const mediaA = math.mean(serieA);
    const mediaB = math.mean(serieB);
    let cov = 0;
    for (let i = 0; i < serieA.length; i++) {
        cov += (serieA[i] - mediaA) * (serieB[i] - mediaB);
    }
    return cov / (serieA.length - 1);
}
function calcularMetricas(datosOrganizados) {
    const fechas = Object.keys(datosOrganizados).sort();
    const tickers = Object.keys(datosOrganizados[fechas[0]]);
    const nActivos = tickers.length;
    const seriesDePrecios = tickers.map(ticker => fechas.map(fecha => datosOrganizados[fecha][ticker]));
    const seriesDeRendimientos = seriesDePrecios.map(serie => {
        const rendimientos = [];
        for (let i = 1; i < serie.length; i++) {
            rendimientos.push((serie[i] / serie[i-1]) - 1);
        }
        return rendimientos;
    });
    const rendimientosEsperados = seriesDeRendimientos.map(serie => math.mean(serie));
    const volatilidades = seriesDeRendimientos.map(serie => math.std(serie));
    const matrizCovarianza = [];
    for (let i = 0; i < nActivos; i++) {
        matrizCovarianza[i] = [];
        for (let j = 0; j < nActivos; j++) {
            matrizCovarianza[i][j] = _calcularCovarianzaManual(seriesDeRendimientos[i], seriesDeRendimientos[j]);
        }
    }
    const diasDeMercado = 252;
    const rendimientosAnualizados = rendimientosEsperados.map(r => r * diasDeMercado);
    const volatilidadesAnualizadas = volatilidades.map(v => v * Math.sqrt(diasDeMercado));
    const matrizCovAnualizada = math.multiply(matrizCovarianza, diasDeMercado);
    return { tickers, rendimientosAnualizados, volatilidadesAnualizadas, matrizCovarianza: matrizCovAnualizada };
}
function optimizarPortafolio(metricas) {
    const numSimulaciones = 10000;
    const nActivos = metricas.tickers.length;
    const tasaLibreDeRiesgo = 0.02;
    const resultados = [];

    for (let i = 0; i < numSimulaciones; i++) {
        let pesos = [];
        let sumaPesos = 0;
        for (let j = 0; j < nActivos; j++) {
            const pesoAleatorio = Math.random();
            pesos.push(pesoAleatorio);
            sumaPesos += pesoAleatorio;
        }
        pesos = pesos.map(p => p / sumaPesos);
        const rendimientoPortafolio = math.multiply(pesos, metricas.rendimientosAnualizados);
        const volatilidadPortafolio = Math.sqrt(math.multiply(math.multiply(pesos, metricas.matrizCovarianza), pesos));
        const sharpeRatio = (rendimientoPortafolio - tasaLibreDeRiesgo) / volatilidadPortafolio;
        resultados.push({ pesos, rendimiento: rendimientoPortafolio, volatilidad: volatilidadPortafolio, sharpe: sharpeRatio });
    }

    const portafolioConservador = resultados.reduce((a, b) => b.volatilidad < a.volatilidad ? b : a);
    const portafolioModerado = resultados.reduce((a, b) => b.sharpe > a.sharpe ? b : a);
    const portafolioAgresivo = resultados.reduce((a, b) => b.rendimiento > a.rendimiento ? b : a);

    const formatear = (p) => {
        const pesosFormateados = {};
        metricas.tickers.forEach((ticker, i) => {
            pesosFormateados[ticker] = p.pesos[i];
        });
        return { ...p, pesos: pesosFormateados };
    };

    return {
        conservador: formatear(portafolioConservador),
        moderado: formatear(portafolioModerado),
        agresivo: formatear(portafolioAgresivo)
    };
}


// --- ¡NUEVA FUNCIÓN ARTISTA! ---
let miGrafico; // Variable global para guardar la instancia del gráfico

function mostrarResultados(portafolios) {
    const perfilSeleccionado = document.querySelector('input[name="perfil"]:checked').value;
    const portafolioOptimo = portafolios[perfilSeleccionado];

    const contenedorTexto = document.getElementById('texto-resultados');
    const lienzo = document.getElementById('grafico-portafolio');
    
    // 1. Mostrar los resultados en texto
    let htmlResultados = '<h3>Asignación Recomendada:</h3><ul>';
    for (const ticker in portafolioOptimo.pesos) {
        const porcentaje = (portafolioOptimo.pesos[ticker] * 100).toFixed(2);
        htmlResultados += `<li><b>${ticker}:</b> ${porcentaje}%</li>`;
    }
    htmlResultados += '</ul><hr>';
    htmlResultados += `<h4>Métricas del Portafolio:</h4>`;
    htmlResultados += `<p><b>Rendimiento Anual Esperado:</b> ${(portafolioOptimo.rendimiento * 100).toFixed(2)}%</p>`;
    htmlResultados += `<p><b>Volatilidad Anual (Riesgo):</b> ${(portafolioOptimo.volatilidad * 100).toFixed(2)}%</p>`;
    
    contenedorTexto.innerHTML = htmlResultados;

    // 2. Dibujar el gráfico de torta
    // Si ya existe un gráfico, lo destruimos antes de crear uno nuevo
    if (miGrafico) {
        miGrafico.destroy();
    }

    miGrafico = new Chart(lienzo, {
        type: 'pie', // Tipo de gráfico
        data: {
            labels: Object.keys(portafolioOptimo.pesos), // Nombres de los tickers
            datasets: [{
                label: 'Asignación de Portafolio',
                data: Object.values(portafolioOptimo.pesos), // Porcentajes
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribución del Portafolio Óptimo'
                }
            }
        }
    });
}
