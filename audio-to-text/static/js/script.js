// Expose globally your audio_context, the recorder instance and audio_stream
var audio_context;
var recorder;
var audio_stream;

var isRecording = false

/**
 * Patch the APIs for every browser that supports them and check
 * if getUserMedia is supported on the browser. 
 * 
 */
function Initialize() {
    try {
        // Monkeypatch for AudioContext, getUserMedia and URL
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        // navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia;
        navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        // Store the instance of AudioContext globally
        audio_context = new AudioContext;
        console.log('Audio context is ready !');
        console.log('navigator.mediaDevices.getUserMedia ' + (navigator.mediaDevices.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }
}

//MICRO
let microButton = document.getElementById("circlein")
let outline = document.getElementsByClassName("outline")
let outerBtn = document.getElementById("outer-btn")


/**
 * Starts the recording process by requesting the access to the microphone.
 * Then, if granted proceed to initialize the library and store the stream.
 *
 * It only stops when the method stopRecording is triggered.
 */
function startRecording() {
    // Initialize()
    // Access the Microphone using the navigator.mediaDevices.getUserMedia method to obtain a stream
    // navigator.mediaDevices.getUserMedia()
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            audio_stream = stream
            // Create the MediaStreamSource for the Recorder library
            var input = audio_context.createMediaStreamSource(stream);
            console.log('Media stream succesfully created');

            // Initialize the Recorder Library
            recorder = new Recorder(input);
            console.log('Recorder initialised');

            // Start recording !
            recorder && recorder.record();
            console.log('Recording...');

            // Disable Record button and enable stop button !
            // document.getElementById("start-btn").disabled = true;
            // document.getElementById("stop-btn").disabled = false;
        })
        .catch((err) => {
            console.error(`${err.message}`)
        })
}

/**
 * Stops the recording process. The method expects a callback as first
 * argument (function) executed once the AudioBlob is generated and it
 * receives the same Blob as first argument. The second argument is
 * optional and specifies the format to export the blob either wav or mp3
 */
function stopRecording(callback, AudioFormat) {
    // Stop the recorder instance
    recorder && recorder.stop();
    console.log('Stopped recording.');

    // Stop the getUserMedia Audio Stream !
    audio_stream.getAudioTracks()[0].stop();

    // Disable Stop button and enable Record button !
    // document.getElementById("start-btn").disabled = false;
    // document.getElementById("stop-btn").disabled = true;
    if (typeof (callback) == "function") {
        recorder && recorder.exportWAV(function (blob) {
            callback(blob);

            //clean recorder
            recorder.clear();
        }, (AudioFormat || "audio/wav"));
    }
}

// Initialize everything once the window loads
window.onload = function () {
    Initialize()
    // Handle on start recording button
    // document.getElementById("start-btn").addEventListener("click", function () {
    //     startRecording();
    // }, false);

    // Handle on stop recording button
    microButton.addEventListener("click", function () {
        if (!isRecording) {
            console.log("Cliecker!")
            isRecording = true
            microButton.style.backgroundColor = "#fa465e"
            // microButton.style.animationTimingFunction = "#f0355d"
            for (var i = 0, len = outline.length; i < len; i++) {
                outline[i].style.animation = "pulse-red 3s"
                outline[i].style.animationIterationCount = "infinite"
                outline[i].style.animationTimingFunction = "ease-out"
            }
            outerBtn.style.backgroundColor = "#f03544"
            outerBtn.style.boxShadow = "0px 0px 80px #c43b46"

            startRecording()
        } else {
            var _AudioFormat = "audio/wav";
            stopRecording(function (AudioBLOB) {
                const formData = new FormData();
                formData.append("file", AudioBLOB, 'recording.wav');
                var language = document.getElementById("language").value;
                if (language !== undefined) {
                    formData.append("language", language);
                } else {
                    console.log(typeof (language))
                    formData.append("language", "en-US");
                }


                if (language === "ru-RU") {
                    document.getElementById("transcript").textContent = "Загрузка..."
                } else if (language === "kk-KZ") {
                    document.getElementById("transcript").textContent = "Жүктеу..."
                } else {
                    document.getElementById("transcript").textContent = "Loading..."
                }
                // loading.style.display = "block"; // Show activity indicator

                fetch("/transcript", {
                    method: "POST",
                    body: formData
                }).then(response => {
                    // Check if the response is successful (status code 200)
                    if (!response.ok) {
                        document.getElementById('transcript').textContent = "Bad recording";
                        throw new Error('Network response was not ok');
                    }
                    // Parse the JSON response
                    return response.text();
                }).then(data => {
                    // Handle the transcript data received from the server
                    console.log("Transcript:", data);
                    // You can update your HTML to display the transcript
                    document.getElementById('transcript').textContent = data;
                    loading.style.display = "none"; // Hide activity indicator
                })
                    .catch(error => {
                        // Handle errors
                        console.error('Error:', error);
                        loading.style.display = "none"; // Hide activity indicator
                    });
            }, _AudioFormat);
            isRecording = false

            microButton.style.backgroundColor = "#6BD6E1"
            // microButton.style.animationTimingFunction = "#f0355d"
            for (var i = 0, len = outline.length; i < len; i++) {
                outline[i].style.animation = "pulse 3s"
                outline[i].style.animationIterationCount = "infinite"
                outline[i].style.animationTimingFunction = "ease-out"
            }
            outerBtn.style.backgroundColor = "#50CDDD"
            outerBtn.style.boxShadow = "0px 0px 80px #0084F9"
        }

    }, false)
};

//LANGUAGE
const locales = ["ru-RU", "en-US", "kk-KZ", "ar-SA", "zh-CN", "de-DE", "es-ES", "fr-FR", "hi-IN", "it-IT", "in-ID", "ja-JP", "ko-KR", "nl-NL", "no-NO", "pl-PL", "pt-BR", "sv-SE", "fi-FI", "th-TH", "tr-TR", "uk-UA", "vi-VN", "he-IL"];

function getFlagSrc(countryCode) {
    return /^[A-Z]{2}$/.test(countryCode)
        ? `https://flagsapi.com/${countryCode.toUpperCase()}/shiny/64.png`
        : "";
}

const dropdownBtn = document.getElementById("dropdown-btn");
const dropdownContent = document.getElementById("dropdown-content");

function setSelectedLocale(locale) {
    const intlLocale = new Intl.Locale(locale);
    const langName = new Intl.DisplayNames([locale], {
        type: "language",
    }).of(intlLocale.language);

    console.log(intlLocale)
    console.log(langName)

    document.getElementById("language").value = intlLocale.baseName
    if (intlLocale.baseName === "ru-RU") {
        document.getElementById("headingTranscript").textContent = "Транскрипт"
        document.getElementById("labelFile").textContent = "Выберите файл"
        document.getElementById("submitButton").value = "Отправить"
    } else if (intlLocale.baseName === "kk-KZ") {
        document.getElementById("headingTranscript").textContent = "Транскрипт"
        document.getElementById("labelFile").textContent = "Файл таңдау"
        document.getElementById("submitButton").value = "Жіберу"
    } else {
        document.getElementById("headingTranscript").textContent = "Transcript"
        document.getElementById("labelFile").textContent = "Choose File"
        document.getElementById("submitButton").value = "Send"
    }

    dropdownContent.innerHTML = "";

    const otherLocales = locales.filter((loc) => loc !== locale);
    otherLocales.forEach((otherLocale) => {
        const otherIntlLocale = new Intl.Locale(otherLocale);
        const otherLangName = new Intl.DisplayNames([otherLocale], {
            type: "language",
        }).of(otherIntlLocale.language);

        const listEl = document.createElement("li");
        listEl.innerHTML = `${otherLangName}<img src="${getFlagSrc(
            otherIntlLocale.region
        )}" />`;
        listEl.value = otherLocale;
        listEl.addEventListener("mousedown", function () {
            setSelectedLocale(otherLocale);
        });
        dropdownContent.appendChild(listEl);
    });

    dropdownBtn.innerHTML = `<img src="${getFlagSrc(
        intlLocale.region
    )}" />${langName}<span class="arrow-down"></span>`;
}

setSelectedLocale(locales[0]);
const browserLang = new Intl.Locale(navigator.language).language;
for (const locale of locales) {
    const localeLang = new Intl.Locale(locale).language;
    if (localeLang === browserLang) {
        setSelectedLocale(locale);
    }
}