$(document).ready(function() {
  karaokeUrl = 'http://10.0.0.1:5000/';
  currSong = null;

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
  function playSubtitles(subtitleElement, srt, currentTime) {
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

    var currentSubtitle = -1;
    var keys = Object.keys(subtitles);
    console.log(keys);
    setTimeout(function () {
      console.log('START');
      var ival = setInterval(function() {
                  var subtitle = -1;
                  for(s in subtitles) {
                    if(s > currentTime)
                      break
                    subtitle = s;
                  }
                  
                  if(subtitle > 0) {
                    if(subtitle != currentSubtitle) {
                      var loc = keys.indexOf(subtitle);
                      subtitleElement.html(subtitles[subtitle].t + '<br />' + subtitles[keys[loc + 1]].t);

                      currentSubtitle=subtitle;
                    } else if(subtitles[subtitle].o < currentTime) {
                      subtitleElement.html('');
                    }
                  }

                  currentTime += 0.1;
                }, 100);
    }, 1500);
  }

  function playMusic(song) {
    var lyricsElement = $('#lyrics');
    var srtUrl = karaokeUrl + 'lyrics/' + song.song_id + '.srt';

    if(srtUrl) {
      $(this).load(srtUrl, function (responseText, textStatus, req) { playSubtitles(lyricsElement, responseText, 0)})
    } else {
      console.log('no lyrics');
    }
  }

  function stopMusic() {
    // stop music?
  }

  $.ajax({
    url: karaokeUrl + 'list',
    dataType: 'json',
    success: function (data) {   
      // currSong = data.currSong;
      // if (currSong != null) {
      //   playMusic(currSong);
      // }

      songs = data;
      $.each(songs, function (key, song) {
        $('#songs').append('<div class="well"><div class="container-fluid"><div class="row"><div class="col-xs-4 col-sm-2"><a href="#" class="thumbnail"><img src="' + karaokeUrl + 'albums/' + song.song_id + '.png" alt="..."></a></div><div class="col-xs-4 col-sm-5"><h2>' + song.title + '</h2><p>' + song.singer + '</p></div><div class="col-xs-4 col-sm-4"><a class="music-play" href="#" style="text-align:center;" song_id="' + song.song_id + '"><i class="glyphicon glyphicon-play" style="font-size:200%; color: #2ecc71;"></i></a></div></div></div>');
      });

      $('.music-play').click(function (e) {
        song_id = $(this).attr('song_id');
        console.log(song_id);

        $.ajax({
          url: karaokeUrl + 'play',
          method: 'POST',
          dataType: 'json',
          data: {song_id},
          success: function (data) {
            console.log('haha');
            playMusic(data);
          }
        })
      });
      // $('.music-stop').click(function (e) {
      //   song_id = currSong.song_id;

      //   $.ajax({
      //     url: baseUrl + 'stop',
      //     method: 'POST',
      //     data: song_id,
      //     success: function (data) {
      //       console.log('haha');
      //       if (data.status == 'success') {
      //         stopMusic();
      //         $('#current').hide();
      //       }
      //     }
      //   })
      // });
    }
  });
});
