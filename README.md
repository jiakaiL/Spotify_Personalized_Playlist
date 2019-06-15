
![demo](demo.gif)

# Spotify Accounts Authentication + Building Playlist Based on User's Top Songs

This project contains basic Authentiacation from the tutorial codes from Spotify Web API for [authenticating against the Spotify Web API](https://developer.spotify.com/web-api/authorization-guide/).

After Login with your spotify account, the following function will be executed.
In order to add songs to specific user's playlist, you need to change userID on the top. 
My part: starting line 108, main function is: 1. getting the current user's list of top songs listened; 2. search top spng's singer's top songs 3. create a playlist named "customized" and asynchronously handle multiple requests; 4. add songs to playlist (set to public).



## Installation

These examples run on Node.js. On [its website](http://www.nodejs.org/download/) you can find instructions on how to install it. You can also follow [this gist](https://gist.github.com/isaacs/579814) for a quick and easy way to install Node.js and npm.

Once installed, clone the repository and install its dependencies running:

    $ npm install

### Using your own credentials
You will need to register your app and get your own credentials from the Spotify for Developers Dashboard.

To do so, go to [your Spotify for Developers Dashboard](https://beta.developer.spotify.com/dashboard) and create your application. For the examples, we registered these Redirect URIs:

* http://localhost:8888 (needed for the implicit grant flow)
* http://localhost:8888/callback

Once you have created your app, replace the `client_id`, `redirect_uri` and `client_secret` in the examples with the ones you get from My Applications.

## Running the code
In order to run the different examples, open the folder with the name of the flow you want to try out, and run its `app.js` file. For instance, to run the Authorization Code example do:

    $ cd authorization_code
    $ node app.js

Then, open `http://localhost:8888` in a browser.



