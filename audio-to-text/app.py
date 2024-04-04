from flask import Flask, render_template, request, redirect
import speech_recognition as sr

app = Flask(__name__)


@app.route('/', methods=["GET"])
def index():
    return render_template('index.html')

@app.route('/transcript', methods=["POST", "GET"])
def transcriptAudio():
    transcript = ""
    if request.method == "POST":
        print("FORM DATA RECIEVED")
        if "file" not in request.files:
            return redirect(request.url)
        file = request.files["file"]
        language = "en-US"
        try:
            language = request.form.get("language")
        except:
            pass
        print(language)

        if file.filename == "":
            return redirect(request.url)
        if file:
            recognizer = sr.Recognizer()
            audioFile = sr.AudioFile(file)
            with audioFile as source:
                data = recognizer.record(source)
            text = recognizer.recognize_google(data, language=language)
            transcript = text
            print("RESULT:")
            print(transcript)

    return transcript

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
