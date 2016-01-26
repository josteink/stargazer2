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
            "User-agent": "Stargazors^2 (request, nodejs)"
        }
    };
    return options;
};

var getStartGazors = function(callback, stargazors) {
    if (!stargazors) {
        stargazors = [];
    }
    
    var options = getUrlRequest("https://api.github.com/repos/josteink/wsd-mode/stargazers");
    req(options, function(error, response, body) {
        var json = JSON.parse(body);

        // TODO: analyze headers for pagination information. recurse to obtain all stargazors
        // Looks like this:
        // $ response.headers.link
        // '<https://api.github.com/repositories/27537947/stargazers?client_id=gfdgdfgclient_secret=sdfsfds&page=2>; rel="next", <https://api.github.com/repositories/27537947/stargazers?client_id=dfgdfgdfgfd&client_secret=dfgfdgfd&page=9>; rel="last"'
        callback(json);
    });
};

var getCompanies = function(stargazors, callback, companies) {

    if (!companies)
    {
        companies = [];
    }

    if (!stargazors || stargazors.length === 0)
    {
        callback(companies);
    }
    else
    {
        console.log("Processing... (" + stargazors.length + " remaining)");

        var remaining = stargazors.splice(1);
        var stargazor = stargazors[0];

        var options = getUrlRequest(stargazor.url);
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



getStartGazors(function(stargazors) {
    console.log(stargazors);
    getCompanies(stargazors, function(companies) {
        console.log(companies);
    }) ;
});
