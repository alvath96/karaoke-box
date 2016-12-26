$(document).ready(function() {
  karaokeUrl = 'localhost:5000/';
  currSong = null;

  function playMusic(song) {
    // display song title, singer, seconds, srt etc.
  }

  function stopMusic() {
    // stop music?
  }

  $.ajax({
    url: 'test.json',
    dataType: 'json',
    success: function (data) {   
      currSong = data.currSong;
      if (currSong != null) {
        playMusic(currSong);
      }

      songs = data.songs;
      $.each(songs, function (key, song) {
        $('#songs').append('<div class="well"><div class="container-fluid"><div class="row"><div class="col-xs-4 col-sm-2"><a href="#" class="thumbnail"><img src="..." alt="..."></a></div><div class="col-xs-4 col-sm-5"><h2>' + song.title + '</h2><p>' + song.singer + '</p></div><div class="col-xs-4 col-sm-4"><a class="music-play" href="#" song_id=" style="text-align:center;"' + song.song_id + '"><i class="glyphicon glyphicon-play" style="font-size:200%; color: #2ecc71;"></i></a></div></div></div>');
      });

      $('.music-play').click(function (e) {
        song_id = $(this).attr('song_id');
        console.log(song_id);

        $.ajax({
          url: baseUrl + 'play',
          method: 'POST',
          data: song_id,
          success: function (data) {
            console.log('haha');
            if (data.status == 'success') {
              playMusic(data.currSong);
              $('#current').show();
            }
          },
          error: function (status, err) {
            console.log(err);
          }
        })
      });

      $('.music-stop').click(function (e) {
        song_id = currSong.song_id;

        $.ajax({
          url: baseUrl + 'stop',
          method: 'POST',
          data: song_id,
          success: function (data) {
            console.log('haha');
            if (data.status == 'success') {
              stopMusic();
              $('#current').hide();
            }
          },
          error: function (status, err) {
            console.log(err);
          }
        })
      });
    }
  });
});
