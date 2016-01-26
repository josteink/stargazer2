
# Stargazers^2

Stargazers^2 is a simple node.js application which allows you to gaze
back at those gazing at your projects. What big companies are using *your* code?

Usage is fairly simple, but needs some preparations.

You need to [register an app at github](https://github.com/settings/developers) to
have access to API keys. This is required to avoid uber-heavy throttling.


````bash
# get dependencies
$ npm install

# run once to create template config-file
$ node app.js

# fill in the settings for your github app
$ $EDITOR appsettings.json

# fill in repo-name. Note do NOT use the full github HTTPS url.
$ node app.js josteink/wsd-mode

# wait
[ 'Google', 'Uber', 'Samsung', 'SUSE', 'Red hat', 'Rackspace', 'Amazon', ... ]

# start planning for world domination
````

That's about it.
