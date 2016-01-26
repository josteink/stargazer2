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
    if (url.indexOf("?") == -1) {
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

var splitStringBy = function(string, splitter, results) {
    if (!results) {
        results = [];
    }

    // NPE prevention
    if (!string) {
        return "";
    };
    
    var splitterPos = string.indexOf(splitter);
    if (splitterPos == -1) {
        results.push(string);
        return results;
    } else {
        var item = string.substring(0, splitterPos);
        results.push(item);
        var rest = string.substring(splitterPos + splitter.length);
        return splitStringBy(rest, splitter, results);
    }
};

var getLastPage = function(headerText) {

    // analyze headers for pagination information. recurse to obtain all stargazers
    // Looks like this:
    // $ response.headers.link
    // '<https://api.github.com/repositories/27537947/stargazers?client_id=gfdgdfgclient_secret=sdfsfds&page=2>; rel="next", <https://api.github.com/repositories/27537947/stargazers?client_id=dfgdfgdfgfd&client_secret=dfgfdgfd&page=9>; rel="last"'
    var subHeaders = splitStringBy(headerText, ", ");

    for (var i = 0; i < subHeaders.length; i++) {
        var subHeader = subHeaders[i];
        var parts = splitStringBy(subHeader, "; ");

        if (parts[1] === 'rel="last"') {
            var link = parts[0];
            var marker = "page=";
            var pagePos = link.indexOf(marker);
            // includes trailing >
            var pageG = link.substring(pagePos + marker);
            var page = pageG.substring(0,pageG.length-1);
            return page;
        }
    }

    // found nothing. assume only one page.
    return 1;
};

var getStargazers = function(url, callback, page, stargazers) {
    if (!stargazers) {
        stargazers = [];
    }

    if (!page) {
        page = 1;
    }
    var pagedUrl = url + "?page="+page;
    var options = getUrlRequest(pagedUrl);

    req(options, function(error, response, body) {
        if (response.statusCode !== 200) {
            console.log("Error getting stargazer list: " + response.statusCode);
            console.log(response.body);
        } else {
            var json = JSON.parse(body);
            stargazers = stargazers.concat(json);
            console.log("Found " + stargazers.length + "...");

            var lastPage = getLastPage(response.headers.link);
            if (page > lastPage || lastPage == 1) {
                callback(stargazers);
            }
            else {
                page++;
                getStargazers(url, callback, page, stargazers);
            }
        }
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
                }

                // recurse with the remaining files.
                getCompanies(remaining, callback, companies);
            }
        });
    }
};


// check for parameters
if (config.clientId === "your appId here") {

    console.log("Application unconfigured. Please update appsettings.json");

} else if (process.argv.length <= 2) {

    console.log("Usage: node app.js <reponame> (josteink/stargazer without the https)");

} else {

    var url = "https://api.github.com/repos/" + process.argv[2] + "/stargazers";
    getStargazers(url, function(stargazers) {
        // console.log(stargazers);
        getCompanies(stargazers, function(companies) {
            console.log(companies);
        }) ;
    });
}
