'use strict';

var req = require("request");
var Config = require("./config").config;
var configProvider = new Config("appsettings.json",{
    "clientId":"your appId here",
    "clientSecret": "your appSecret here"
});
var config = configProvider.load();


var getUrlRequest = function(url) {
    // register client at https://github.com/settings/developers
    var clientId = config.clientId;
    var clientSecret = config.clientSecret;
    var auth = "client_id=" + clientId + "&client_secret=" + clientSecret;
    if (url.indexOf("?" === -1)) {
        url += "?" + auth;
    } else {
        url += "&" + auth;
    }
    var options = {
        url: url,
        headers: {
            "User-agent": "Stargazers^2 (request, nodejs)"
        }
    };
    return options;
};

var getStartGazors = function(url, callback, stargazers) {
    if (!stargazers) {
        stargazers = [];
    }

    var options = getUrlRequest(url);
    req(options, function(error, response, body) {
        var json = JSON.parse(body);

        // TODO: analyze headers for pagination information. recurse to obtain all stargazers
        // Looks like this:
        // $ response.headers.link
        // '<https://api.github.com/repositories/27537947/stargazers?client_id=gfdgdfgclient_secret=sdfsfds&page=2>; rel="next", <https://api.github.com/repositories/27537947/stargazers?client_id=dfgdfgdfgfd&client_secret=dfgfdgfd&page=9>; rel="last"'
        callback(json);
    });
};

var getCompanies = function(stargazers, callback, companies) {

    if (!companies)
    {
        companies = [];
    }

    if (!stargazers || stargazers.length === 0)
    {
        callback(companies);
    }
    else
    {
        console.log("Processing... (" + stargazers.length + " remaining)");

        var remaining = stargazers.splice(1);
        var stargazer = stargazers[0];

        var options = getUrlRequest(stargazer.url);
        req(options, function(error, response, body) {
            if (response.statusCode !== 200) {
                console.log(response);
                callback(companies);
            }
            else
            {
                var json = JSON.parse(body);
                if (json && json.company !== null && json.company !== "") {
                    companies.push(json.company);
                    // recurse with the remaining files.
                }
                setTimeout(function() {
                    getCompanies(remaining, callback, companies);
                }, 200);
            }
        });
    }
};


// check for parameters
if (process.argv.length < 2) {
    
    console.log("run with: node app.js <reponame> (josteink/stargazer without the https)");
    
} else {
    
    var url = "https://api.github.com/repos/" + process.argv[2] + "/stargazers";
    getStartGazors(url, function(stargazers) {
        // console.log(stargazers);
        getCompanies(stargazers, function(companies) {
            console.log(companies);
        }) ;
    });
}
