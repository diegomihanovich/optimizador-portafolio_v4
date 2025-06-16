// Este código se ejecutará cuando todo el contenido del HTML se haya cargado
document.addEventListener('DOMContentLoaded', () => {

    // 1. Guardamos en variables los elementos del HTML con los que vamos a interactuar
    const botonOptimizar = document.getElementById('optimizar-btn');
    const tickersInput = document.getElementById('tickers-input');
    
    // OYENTE #1: Le enseñamos a la caja de texto a reaccionar a la tecla "Enter"
    // Este "secretario" se encarga de la tecla Enter.
    tickersInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevenimos que la página se recargue
            botonOptimizar.click(); // Hacemos "clic" en el botón por código
        }
    });

    // OYENTE #2: Le decimos al botón que se ponga a "escuchar" un evento: el 'click'
    // Este "secretario" se encarga de los clics.
    botonOptimizar.addEventListener('click', () => {
        
        // Cuando alguien haga click, se ejecutará este código:
        
        const perfilRiesgo = document.querySelector('input[name="perfil"]:checked').value;
        const periodo = document.querySelector('input[name="periodo"]:checked').value;
        const tickers = tickersInput.value;

        const seleccionUsuario = {
            perfil: perfilRiesgo,
            periodo: periodo,
            activos: tickers
        };

        console.log("El usuario ha seleccionado:");
        console.log(seleccionUsuario);

        alert("¡Recibimos tu selección! Revisa la consola para ver los detalles (Clic derecho -> Inspeccionar -> Consola).");
    });
});
