from flask import Flask
from flask import request
import os
import threading
import subprocess
import uuid

app = Flask(__name__)
app.debug = True

def run_karaoke(id, song_name):
    subprocess.call('/home/pi/lightshowpi/py/synchronized_lights.py', 'file=' + song_name)
    background_scripts[id] = True

@app.route("/")
def home():
    return "home"
    
@app.route("/karaoke/<song>")
def karaoke():
    return "karaoke page"

@app.route("/play", methods=['POST'])
def play():
    status = os.environ['karaoke']
    song_id = request.form.get('song_id', '')

    if (song_id == ''):
        return 'song is required'

    if (status != 'False'):
        return 'other music is played'

    # find song on database
    song_name = 'Closer.mp3'

    process_id = str(uuid.uuid4())
    background_scripts[process_id] = False
    threading.Thread(target=lambda: run_script(process_id, song_name)).start() 
    os.environ['karaoke'] = song_id

    return 'karaoke'
    
@app.route("/stop", methods=['POST'])
def stop():
    status = os.environ['karaoke']
    song_id = request.form.get('song_id', '')

    if (song_id == ''):
        return 'song is required'
    
    if (status != 'False' and status != song_id):
        return 'forbidden'

    os.environ['karaoke'] = 'False'
    return 'music stopped'

os.environ['karaoke'] = 'False'

if __name__ == "__main__":
    app.run()
