from flask import Flask
from flask import request
from flask import Response
from flask import render_template
from flask import g

import os
from mutagen.mp3 import MP3
import signal
import threading
import subprocess
import uuid
import time
import sqlite3
import json

app = Flask(__name__, static_url_path='')
app.debug = True

DATABASE = '/home/pi/db.karaokebox'
karaoke_script = {}

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    
    def make_dicts(cursor, row):
        return dict((cursor.description[idx][0], value)
            for idx, value in enumerate(row))

    db.row_factory = make_dicts
    return db

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def run_script(song_id, song_file):
    global karaoke_script
    command = ['/home/pi/lightshowpi/py/synchronized_lights.py', '--file=' + song_file]
    karaoke_script['process'] = subprocess.Popen(command)
    print karaoke_script

def check_pid():
    if ('process' in karaoke_script):
        print karaoke_script['process'].pid, os.system("sudo kill -0 %s" % (karaoke_script['process'].pid))

    time_passed = 0
    if ('start_time' in karaoke_script):
        time_passed = time.time() - karaoke_script['start_time']

    return (len(karaoke_script) > 0 and 'length' in karaoke_script and time_passed < karaoke_script['length'])

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/list")
def list():
    songs = query_db('select * from songs')
    
    curr_song = None
    
    if check_pid():
        curr_song = {
            'song_id': karaoke_script['song_id'], 
            'title': karaoke_script['title'], 
            'singer': karaoke_script['singer'], 
            'current_time': time.time() - karaoke_script['start_time']
        }

    data = {'status': 'success', 'curr_song': curr_song, 'songs': songs}
    jsonData = json.dumps(data)
    return Response(jsonData, mimetype='application/json')

@app.route("/play", methods=['POST'])
def play():
    global karaoke_script
    song_id = request.form.get('song_id', '')

    if (song_id == ''):
        return Response(json.dumps({'status': 'error', 'message': 'song id is required'}), mimetype='application/json');

    if check_pid():
        return Response(json.dumps({'status': 'error', 'message': 'other song is currently playing'}), mimetype='application/json');

    song = query_db('select * from songs where song_id = ?', [song_id], one=True)
    print song
    if song is None:
      return Response(json.dumps({'status': 'error', 'message': 'song is not found'}), mimetype='application/json');
    
    song_file = song['file']
    
    karaoke_script['song_id'] = song_id
    karaoke_script['title'] = song['title']
    karaoke_script['singer'] = song['singer']
    karaoke_script['start_time'] = time.time()
    karaoke_script['length'] = MP3(song['file']).info.length

    threading.Thread(target=lambda: run_script(song_id, song_file)).start()

    return Response(json.dumps({'status': 'success', 'message': 'song \"' + song_id + '\" is played',
            'song_id': song_id, 'title': song['title'], 'singer': song['singer'], 'current_time': 0}), mimetype='application/json');

@app.route("/stop", methods=['POST'])
def stop(): 
    global karaoke_script
    song_id = request.form.get('song_id', '')
    
    if (song_id == ''):
        return Response(json.dumps({'status': 'error', 'message': 'song id is required'}), mimetype='application/json');

    if ('song_id' in karaoke_script and song_id != karaoke_script['song_id']):
        return Response(json.dumps({'status': 'error', 'message': 'cannot stop song'}), mimetype='application/json');
    
    if ('process' in karaoke_script):
        os.system("sudo kill -SIGINT %s" % (karaoke_script['process']).pid)
    	
    karaoke_script = {}
    return Response(json.dumps({'status': 'success', 'message': 'song stopped'}), mimetype='application/json');

@app.route("/current", methods=['GET'])
def current():
    global karaoke_script

    if not check_pid():
        karaoke_script = {}
        return Response(json.dumps({'status': 'success', 'message': 'no song played', 'song_id': None}),
                mimetype='application/json')

    return Response(json.dumps({
                'status': 'success',
                'message': 'song \"' + karaoke_script['song_id'] + '\" is playing',
                'song_id': karaoke_script['song_id'],
                'title': karaoke_script['title'],
                'singer': karaoke_script['singer'],
                'current_time': time.time() - karaoke_script['start_time']
            }), mimetype='application/json');

if __name__ == "__main__":
    app.run(host='0.0.0.0')

