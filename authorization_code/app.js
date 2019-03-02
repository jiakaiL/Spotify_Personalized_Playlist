/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */


var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var async = require('async');




var client_id = 'dbdfa179b5c24e1a9dc51a3c7fe66eb3'; // Your client id
var client_secret = 'a4c846230dce4a2088e49b6b71e21805'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var userID = '12172962695'; // this is the spotify userID, change it to the user's playlist you want to modify

var country = 'CA';  // country market
var playlist_size = 50; //maximum quantity is 100



/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-top-read playlist-modify-public playlist-modify-private user-read-recently-played';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        console.log(access_token);
        // get top_tracks 
        var track_url = 'https://api.spotify.com/v1/me/top/tracks';
        var option = {
        	url: track_url,
        	headers: {
        		'Authorization' : 'Bearer ' + access_token
        	},
        	json: true
        };

        // get the user's playlist, it customize exists, delete it and create a new one named customized
        var cust_playlist = 'customized';
        var get_list_url = 'https://api.spotify.com/v1/users/'+userID+'/playlists'// get user's playlist
        var option_get_list = {
        	url: get_list_url,
        	headers: {
        		'Authorization' : 'Bearer ' + access_token
        	},
        	json: true
        };

        var option_create_list = {
        	url: get_list_url,
        	headers: {
        		'Authorization' : 'Bearer ' + access_token
        	},
        	body:{
        		'name': cust_playlist,
        		'public': true
        	},
        	json: true
        };

        var option_recent = {
        		url: 'https://api.spotify.com/v1/me/player/recently-played',
        		headers: {
        			'Authorization' : 'Bearer ' + access_token
        			},
        		json: true
        };

        // done playist part
        // -----------------------------------------------


        // top songs the user most frequently listen to 
        // when build a new playlist, exclude these songs
        // top_tracks will contain user's top songs and recently listened songs
        var top_tracks = new Set();
        // top songs' artists the user most frequently listen to 
        // use the artists to find their related songs and artists
        var top_artists = new Set();

        request.get(option, function(error,res,body) {
        	for (var i = 0; i < body.items.length; i++) {
        		var curr = body.items[i];
        		var aTrack = {};
        		aTrack[curr.name] = curr.uri.slice(14);
        		top_tracks.add(aTrack);
        		for (var j=0; j<curr.artists.length; j++) {
        			var oneArtist = {};
        			oneArtist[curr.artists[j].name] = curr.artists[j].uri.slice(15);
        			top_artists.add(oneArtist);
        		}
        	}
        	
        	// recently listened songs by the current user
        	request.get(option_recent, function(error, res, body) {
        		for (var i=0; i<body.items.length; i++) {
        			var curr = body.items[i];
        			var aTrack = {};
        			aTrack[curr.track.name] = curr.track.uri.slice(14);
        			top_tracks.add(aTrack);
        		}
        		var listTODO = [];
        		for (let artist of top_artists) {
        			var artist_url = 'https://api.spotify.com/v1/artists/'+ Object.values(artist)[0]+'/top-tracks?country=' + country;
        			var option_artist_topSong = {
        				url: artist_url,
        				headers: {
        				'Authorization' : 'Bearer ' + access_token
        				},
        				json: true
        			}
        			listTODO.push(option_artist_topSong);
        			function httpGet(option,callback) {
        				request.get(option, function(err, res, body) {
        					callback(err,body);
        				});
        			}
        		}
        		
        		// async funciton to deal with multiple API get
        		var list_add = new Set();
        		var obj_exclude = {};
        		for (let song of top_tracks){
        			obj_exclude[Object.keys(song)[0]] = Object.values(song)[0]; 
        		}	
        		async.map(listTODO, httpGet, function(err, res){
        			if (err) return console.log(err);
        			console.log(res[0].tracks.length);
        			for (let one of res) {
        				for (let song of one.tracks){
        					var track = {};
        					track[song.name] = song.uri.slice(14);
        					if (!Object.values(obj_exclude).includes(Object.values(track)[0])) {
        						list_add.add(track);
        						break;
        					}
        				}
        			}
        			var obj_add = {};
        			for (let song of list_add){
        				obj_add[Object.keys(song)[0]] = 'spotify:track:'+ Object.values(song)[0]; 
        			}
        			var json_urls = {};
        			json_urls['uris'] = Object.values(obj_add);
        			// var option_add_songs = {
        			// 	url: 'https://api.spotify.com/v1/playlists/{playlist_id}/tracks'
        			// 	body: json_urls,
        			// 	headers: {
        			// 	'Authorization' : 'Bearer ' + token
        			// 	},
        			// 	json: true
        			// }

        			request.get(option_get_list, function(error, res, body){
        				// console.log(body);
        				var user_playlist = {}
        				for (let list of body.items){
        					user_playlist[list.name] = list.id;
        				}
        				// console.log(user_playlist);
        				if (Object.keys(user_playlist).includes(cust_playlist)){
        					var del_list_url = 'https://api.spotify.com/v1/playlists/'+ user_playlist[cust_playlist]+'/followers' //unfollow or delete playlist
        					// console.log(del_list_url);
        					var option_del_list = {
        						url: del_list_url,
        						headers: {
        							'Authorization' : 'Bearer ' + access_token
        						},
        						json: true
        					};
        					request.delete(option_del_list);
        					request.post(option_create_list, function(err, res, body) {
        						console.log(body.id);
        						var playlist_id = body.id;
        						var option_playlist_add_track = {
        							url: 'https://api.spotify.com/v1/playlists/' + playlist_id+'/tracks',
        							body: json_urls,
        							headers: {
        							'Authorization' : 'Bearer ' + access_token,
        							'Accept' : 'application/json'
        							},
        							json: true
        						}
        						request.post(option_playlist_add_track);
        					});
        				} else {
        					request.post(option_create_list, function(err, res, body) {
        						console.log(body.id);
        						var playlist_id = body.id;
        						var option_playlist_add_track = {
        							url: 'https://api.spotify.com/v1/playlists/' + playlist_id+'/tracks',
        							body: json_urls,
        							headers: {
        							'Authorization' : 'Bearer ' + access_token,
        							'Accept' : 'application/json'
        							},
        							json: true
        						}
        						request.post(option_playlist_add_track);
        						console.log(option_playlist_add_track);
        						console.log('add tracks successfully')
        					});
        				}
        			});
        		});
        	});
        });


        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


console.log('Listening on 8888');
app.listen(8888);



