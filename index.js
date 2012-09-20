var request = require('request').defaults({json: true}),
    qs = require('querystring'),
    colors = require('colors'),
    argv = require('optimist')
        .default('u', 'charliejames1975')   // YouTube [u]ser
        .default('x', 10)                   // Ma[x] duration
        .default('n', 0)                    // Mi[n] duration
        .default('i', 1)                    // Starting [i]ndex
        .default('r', 25).argv,             // Max [r]esults

    params = function (argv) {
        return qs.stringify({
            alt: 'json',
            "max-results": argv.r,
            "start-index": argv.i
        })
    },
    pretty_minsec = function (seconds) {
        var seconds = parseInt(seconds)||0,
            min = parseInt(seconds / 60), 
            sec = seconds % 60;
            return [min, sec];
    },
    kw_matcher = /(drill|bodyweight|women|how)/i,
    highlighter = function (matcher, term) {
        return term.replace(matcher, function (match) {
            return match.bold.yellow.inverse;
        });
    };

console.log(("Listing videos for '" + argv.u + "' that are between " + (argv.n||0) 
            + " and " + (argv.x+1) + "min long.").cyan);

request('http://gdata.youtube.com/feeds/users/' + argv.u + '/uploads?' + params(argv), function (err, res, body) {
    var match_count = 0;
    if (err) return console.log(err);
    body.feed.entry.sort(function (a, b) {
        return Date.parse(a.published["$t"]) - Date.parse(b.published["$t"]);
    });
    body.feed.entry.forEach(function (entry) {

        if (entry["media$group"] && entry["media$group"]["yt$duration"]) {
            var duration = pretty_minsec(entry["media$group"]["yt$duration"].seconds )
                min = duration[0], 
                sec = duration[1];
            if ((!min && !sec) || min > argv.x) return;
            if (argv.n && min < argv.n) return;
        }

        console.log("\n\n*************************\n".magenta.bold);
        console.log("Title: " + entry.title["$t"]);
        console.log("URL: " + entry.link[0].href);

        if (entry["media$group"] && entry["media$group"]["media$description"]) {
            console.log("Description: " + entry["media$group"]["media$description"]["$t"].split("\n")[0]);
        }
        if (entry.category) {
            var categories = [], keywords = [];
            entry.category.forEach(function (category) {
                if (~category.scheme.indexOf('categories')) {
                    categories.push(highlighter(kw_matcher, category.term));
                }
                if (~category.scheme.indexOf('keyword')) {
                    keywords.push(highlighter(kw_matcher, category.term));
                }
            });
            console.log("Categories: " + categories.join(', '));
            console.log("Keywords: " + keywords.join(', '));
        }
        if (min + sec) console.log("Duration: " + min + ":" + (sec > 10 ? sec : '0' + sec));
        if (entry.published) {
            console.log("Published: " + new Date(Date.parse(entry.published["$t"])));
        }
        match_count++;
    });
    console.log("Found " + match_count + " matching videos.");
});
