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
        $('#songs').append('<div class="well"><div class="container"><div class="row"><div class="col-md-8"><h1>' + song.title + '</h1><p>' + song.singer + '</p></div><div class="col-md-2"><a class="music-play" href="#" song_id="' + song.song_id + '"><i class="glyphicon glyphicon-play"></i>play</a></div></div></div>');
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
            }
          },
          error: function (status, err) {
            console.log(err);
          }
        })
      });

      $('.music-stop').click(function (e) {
        song_id = currSong.song_id

        $.ajax({
          url: baseUrl + 'stop',
          method: 'POST',
          data: song_id,
          success: function (data) {
            console.log('haha');
            if (data.status == 'success') {
              stopMusic();
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
