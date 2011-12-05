if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) == 0;
    };
}

var createView = function(config) {
    var that = {};

    var base_url = config.base_url;

    that.displayCommit = function (commit) {
        var diff = diffAsHtml(commit);
        var commitAsHtml = "<div class=\"commit\"><div class=\"header\">" + commit.committer.name + ": " + commit.message + " <a href=\"" + base_url + commit.url + "\" target=\"_blank\"> view </a></div><div>" + diff + "</div></div>";
        $("#msgid").after(commitAsHtml);
    };

    var diffAsHtml = function (commit) {
        var diff = "<div>";
        if (commit.modified) {
            for (var i = 0; i < commit.modified.length; i++) {
                var lines = commit.modified[i].diff.split(/\n/g);
                for (var y = 0; y < lines.length; y++) {
                    var modClass = "";
                    if (lines[y].startsWith("+")) {
                        modClass = " add";
                    }
                    if (lines[y].startsWith("-")) {
                        modClass = " remove";
                    }
                    diff += "<div class=\"line" + modClass + "\">" + lines[y].replace(/ /g, "&nbsp;").replace(/</g, "&lt;") + "</div>";
                }
            }
        }
        diff += "</div>";
        return diff;
    };

    return that;
};

var createParameterService = function() {
    var that = {};

    that.getParameter = function(name) {
        return decodeURI(
            (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [,null])[1]
        );
    };

    return that;
};

var createGitHubService = function(config) {
    var that = {};
    var base_url = config.base_url;
    var base_api_url = base_url + "/api/v2/json/commits/show";
    var github_user = "dziemid";
    var github_repo = "refactormycode";

    var callback = function() {
    };

    that.fetchCommits = function(range) {
        $.ajax({
            url: base_api_url + "/" + github_user + "/" + github_repo + "/" + range.from,
            dataType: 'jsonp',
            type: 'get',
            success: function(data) {
                var commit = data.commit;
                callback(commit);
                if (range.from != range.to) {
                    that.fetchCommits({from: commit.parents[0].id, to: range.to});
                }
            }
        });
    };

    that.onCommitFetched = function(c) {
        callback = c;
    };

    return that;
};

var createController = function(spec) {
    var that = {};
    var view = spec.view;
    var gitHubService = spec.gitHubService;
    var parameterService = spec.parameterService;

    var bind = function () {
        gitHubService.onCommitFetched(view.displayCommit);
    };

    that.displayCommits = function () {
        var from = parameterService.getParameter("from");
        var to = parameterService.getParameter("to");
        gitHubService.fetchCommits({from : from, to: to});
    };

    bind();
    return that;
};

var createApplication = function() {
    var that = {};
    that.start = function () {
        var config = {base_url : "http://github.com"};
        var view = createView(config);
        var gitHubService = createGitHubService(config);
        var parameterService = createParameterService();
        var controller = createController({view: view, gitHubService: gitHubService, parameterService: parameterService});
        controller.displayCommits();
    };
    return that;
};
