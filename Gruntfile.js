module.exports = function(grunt) {

    "use strict";

    var sources = {
        // all JavaScript sources, excluding 3rd party libraries
        js: [], // determined automatically

        // all JavaScript test files
        tests: [
        ]
    };


    /**
     * Auto-detect JS sources
     */
    grunt.file.recurse("app", function(abspath, rootdir, subdir, filename) {
        if (filename.substr(-3) === ".js") {
            sources.js.push("app/" + (subdir ? subdir + "/" : "") +
                            filename.substr(0, filename.length - 3));
        }
    });
    grunt.file.recurse("lib", function(abspath, rootdir, subdir, filename) {
        if (filename.substr(-3) === ".js") {
            sources.js.push("lib/" + (subdir ? subdir + "/" : "") +
                            filename.substr(0, filename.length - 3));
        }
    });
    sources.js.sort();


    /**
     * Creates a list of paths from a list of basenames.
     */
    function createPaths(prefix, fileNames, extension) {
        if (prefix instanceof Array) {
            extension = fileNames;
            fileNames = prefix;
            prefix = "";
        }
        var paths = [];
        fileNames.forEach(function(fileName) {
            paths.push(prefix + fileName + (extension || ""));
        });
        return paths;
    }


    /**
     * Main config
     */
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        jshint: {
            options: {
                browser: false,
                camelcase: false,
                curly: true,
                devel: true,
                eqeqeq: true,
                indent: 4,
                noarg: true,
                node: true,
                nonew: true,
                predef: [],
                strict: true,
                trailing: true,
                undef: true,
                unused: true
            },
            all: ["Gruntfile.js"]
                     .concat(createPaths(sources.js, ".js"))
                     .concat(createPaths("tests/test", sources.tests, ".js"))
        },

        nodeunit: {
            options: {
                verbose: true,
                logLevel: "debug"
            },
            all: createPaths("tests/", sources.tests, "-test.js")
        }
    });


    /**
     * Generate Qt Creator .files file.
     */
    grunt.registerTask("files-file", "Generate CI-Joe.files for Qt Creator", function() {
        var lines = [
            "config/app.yaml",
            "Gruntfile.js",
            "package.json",
            "README.md",
            "node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js",
            "tools/install-git-hooks.sh",
            "tools/git-pre-commit"
        ];
        lines = lines.concat(createPaths(sources.js, ".js"));
        lines = lines.concat(createPaths("tests/", sources.tests, "-test.js"));
        grunt.file.write("CI-Joe.files", lines.join("\n"));
        grunt.log.ok("CI-Joe.files written.");
    });


    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-nodeunit");

    grunt.registerTask("tests", ["jshint", "nodeunit"]);

    grunt.registerTask("default", "Default tasks", function() {
        var qtCreator = !!grunt.option("qt-creator");

        var tasks = ["jshint", "nodeunit"];

        if (qtCreator) {
            tasks.unshift("files-file");
        }

        grunt.task.run(tasks);
    });

};
