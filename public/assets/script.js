let rec;
let mediaRecorder;
let audioChunks = [];
mediaRecorder = null;


if (!("webkitSpeechRecognition" in window)) {
    alert("Disculpa, no puedes usar la API");
} else {
    rec = new webkitSpeechRecognition();
    rec.lang = "es-AR";
    rec.continuous = true;
    rec.interim = true;
    rec.addEventListener("result", iniciar);

    // Configuración de MediaRecorder con intervalo de 1000 ms
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }

                if (audioChunks.length>300){ //20 seg aprox
                    mediaRecorder.stop();
                    console.log('max');
                }
            };

            mediaRecorder.onstop = () => {
                // Llamar a la función para verificar y enviar el contenido
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const transcript = document.getElementById('texto').innerHTML;
                // verificarContenido(transcript, audioBlob);

                // Limpiar para la próxima grabación
                audioChunks = [];
                console.log('reinicia los chunks');
                mediaRecorder.start(1);
            };

            // Iniciar grabación automáticamente con intervalo de 1000 ms
            mediaRecorder.start(1);
        })
        .catch(error => {
            console.error('Error al acceder al micrófono:', error);
        });
}

function iniciar(event) {
    console.log('leyendo');
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        document.getElementById('texto').innerHTML = transcript;

        // Verificar si el transcript contiene una mala palabra
        const malasPalabras = [
            "mala",
            "palabra",
            "mala palabra",
            "te ves sexy",
            "ejemplo"
        ];

        for (const palabra of malasPalabras) {
            if (transcript.toLowerCase().includes(palabra.toLowerCase())) {
                // Llamar a la función para enviar el post HTTP con la mala palabra y audio
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                console.log('iniciar');
                enviarMalaPalabra(transcript, audioBlob);
                mediaRecorder.stop();
                break; // Terminar el bucle si se encuentra una mala palabra
            }
        }
    }
}


function enviarMalaPalabra(transcript, audioBlob) {
    // Crear un objeto FormData y agregar el mensaje y el audio codificado
    const formData = new FormData();
    formData.append('mensaje', transcript);
    formData.append('fecha', '2023/11/05');
    formData.append('descripcion', 'Audio de posible acoso');
    formData.append('camara_id', '1');
    formData.append('es_queja', '0');
    formData.append('tipo', 'Audio');

    // Agregar el blob de audio al FormData
    formData.append('file', audioBlob, 'audio.wav');

    // Puedes ajustar la URL y otros parámetros según tu aplicación
    const url = 'http://127.0.0.1:8001/api/evento/evidencia'; // Reemplazar con la URL correcta

    // Utilizar fetch para enviar un POST HTTP con FormData
    fetch(url, {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}

rec.start();
