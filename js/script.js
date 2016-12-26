$(document).ready(function() {
  var karaokeUrl = 'http://10.0.0.1:5000/';
  
  var curr_song = null;

  var ival;  
  var lyrics = null;
  var currentLyrics = -1;
  var keys = null;

  function toSeconds(t) {
    var s = 0.0
    if(t) {
      var p = t.split(':');
      for(i=0;i<p.length;i++)
        s = s * 60 + parseFloat(p[i].replace(',', '.'))
    }

    var last = parseFloat(p[p.length - 1].replace(',', '.'));
  
    if (last == parseInt(last, 10)) {
      return (s + '.000');
    } else {
      return s;    
    }
  }

  function strip(s) {
    return s.replace(/^\s+|\s+$/g,"");
  }

  function parseSubtitle(subtitleElement, srt) {
    // var videoId = subtitleElement.attr('data-video');
    subtitleElement.text('');
    srt = srt.replace(/\r\n|\r|\n/g, '\n')
    
    var subtitles = {};
    srt = strip(srt);
    var srt_ = srt.split('\n\n');
    for(s in srt_) {
        st = srt_[s].split('\n');
    
        if(st.length >=2) {
          n = st[0];
          i = strip(st[1].split(' --> ')[0]);
          o = strip(st[1].split(' --> ')[1]);
          t = st[2];
          if(st.length > 2) {
            for(j=3; j<st.length;j++)
              t += '\n'+st[j];
          }
          is = toSeconds(i);
          os = toSeconds(o);

          subtitles[is] = {i:i, o: o, t: t};
        }
    }

    currentLyrics = -1;
    lyrics = subtitles;
    keys = Object.keys(subtitles);
  }

  function showLyrics(currentTime) {
    var cnt = -1;
    for(s in lyrics) {
      if(s > currentTime)
        break
      cnt = s;
    }
    
    if(cnt > 0) {
      if(cnt != currentLyrics) {
        var idx = keys.indexOf(cnt);
        if (idx > 0) {
          // console.log(idx - 1, keys[idx - 1], lyrics[keys[idx - 1]].t);
          prev = lyrics[keys[idx - 1]].t
        } else prev = '';

        if (idx != -1 && idx < keys.length) {
          curr = lyrics[keys[idx]].t;
        } else curr = '';

        if (idx != -1 && idx < keys.length - 1) {
          next = lyrics[keys[idx + 1]].t;
        } else next = '';
        
        $('#lyrics').html(prev + '<br /> >>> ' + curr + '<br />' + next);

        currentLyrics = cnt;
      } else if(lyrics[cnt].o < currentTime) {
        $('#lyrics').html('');
      }
    }
  }

  function playMusic(song) {
    curr_song = song;
    console.log(song);

    $('#song').children('.container').remove();
    $('#song').append('<div class="container"><div class ="row"><div class="col-xs-8 col-sm-8"><h4>'+ song.title +' - ' + song.singer + '</h4><br><h3 id="lyrics"></h3></div><div class="col-xs-4 col-sm-4"><a class="music-stop" href="#" song_id="' + song.song_id + '"><i class="glyphicon glyphicon-stop" style="font-size:200%; color: #c0392b;"></i></a></div></div></div>')
    
    $('.music-stop').click(function (e) {
      e.preventDefault();

      song_id = $(this).attr('song_id');
      
      $.ajax({
        url: karaokeUrl + 'stop',
        method: 'POST',
        data: {song_id},
        success: function (data) {
          stopMusic();
        }
      });
    });

    var lyricsElement = $('#lyrics');
    var srtUrl = karaokeUrl + 'lyrics/' + song.song_id + '.srt';

    if(srtUrl) {
      $(this).load(srtUrl, function (responseText, textStatus, req) { 
        parseSubtitle(lyricsElement, responseText);
        setTimeout(showLyrics(0), 1000);
      });
    } else {
      console.log('no lyrics');
    }
  }

  function stopMusic() {
    $('#song').children('.container').remove();
    $('#song').append('<div class="container"><h3>No song is playing...</h3></div>');
    
    curr_song = null;
    currentLyrics = -1;
    lyrics = null;
    keys = null;
  }

  function querySong() {
    $.ajax({
      url: karaokeUrl + 'current',
      success: function (data) {
        if (data.song_id == null) {
          stopMusic();
        } else if (curr_song == null) {
          playMusic(data);
        } else {
          showLyrics(data.current_time);
        }
      }
    })
  }

  $.ajax({
    url: karaokeUrl + 'list',
    dataType: 'json',
    success: function (data) {
      songs = data.songs;
      $.each(songs, function (key, song) {
        $('#songs').append('<div class="well"><div class="container-fluid"><div class="row"><div class="col-xs-4 col-sm-2"><a href="#" class="thumbnail"><img src="' + karaokeUrl + 'albums/' + song.song_id + '.png" alt="..."></a></div><div class="col-xs-4 col-sm-5"><h2>' + song.title + '</h2><p>' + song.singer + '</p></div><div class="col-xs-4 col-sm-4"><a class="music-play" href="#" style="text-align:center;" song_id="' + song.song_id + '"><i class="glyphicon glyphicon-play" style="font-size:200%; color: #2ecc71;"></i></a></div></div></div>');
      });

      curr_song = data.curr_song;
      if (curr_song != null) {
        playMusic(curr_song);
      }
      ival = setInterval(querySong, 100);

      $('.music-play').click(function (e) {
        e.preventDefault();

        if (curr_song == null) {
          song_id = $(this).attr('song_id');
          $.ajax({
            url: karaokeUrl + 'play',
            method: 'POST',
            dataType: 'json',
            data: {song_id},
            success: function (data) {
              playMusic(data);
            }
          });
        }
      });
    }
  });
});
