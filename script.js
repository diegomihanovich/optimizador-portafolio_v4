// Este código se ejecutará cuando todo el contenido del HTML se haya cargado
document.addEventListener('DOMContentLoaded', () => {

    // 1. Guardamos en variables los elementos del HTML con los que vamos a interactuar
    const botonOptimizar = document.getElementById('optimizar-btn');
    const tickersInput = document.getElementById('tickers-input');
    
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
        // Esto no se ve en la página, es para que nosotros verifiquemos que funciona.
        console.log("El usuario ha seleccionado:");
        console.log(seleccionUsuario);

        alert("¡Recibimos tu selección! Revisa la consola para ver los detalles (Clic derecho -> Inspeccionar -> Consola).");

    });
});
