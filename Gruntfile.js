module.exports = function(grunt) {

    "use strict";


    var _ = grunt.util._;

    var serverTest = grunt.option("unit-test");
    var clientTest = grunt.option("integration-test");


    var config = {
        isPackaged: false,
        isProduction: false,
        lessPrecompiled: true
    };


    var serverSources = {
        // all JavaScript sources, excluding 3rd party libraries
        js: [], // determined automatically

        // all unit test files
        tests: (serverTest || clientTest) ? (serverTest ? [serverTest] : []) : [
            "missions",
            "schedular"
        ]
    };


    var clientSources = {
        // all JavaScript sources, excluding 3rd party libraries
        js: [], // determined automatically

        // all 3rd party JS libraries
        libs: [], // determined automatically

        // all LESS files
        less: [], // determined automatically

        // LESS files which need to be imported from the root
        lessRoots: ["bootstrap", "select2", "theme", "ci-joe"],

        // all CSS files
        css: [], // determined automatically

        // all Handlebars templates
        tmpl: [], // determined automatically

        // all integration test files
        tests: (serverTest || clientTest) ? (clientTest ? [clientTest] : []) : [
            "firstcampaign",
            "firstmission",
            "scheduleoptions",
            "updatecampaign"
        ],

        // translation files
        translations: [
            "en-US",
            "nl-NL"
        ]
    };


    /**
     * Auto-detect sources.
     */
    grunt.file.recurse(".", function(abspath, rootdir, subdir, filename) {
        if (!subdir) {
            return;
        }

        var dotIndex = filename.lastIndexOf(".");
        var basename = (dotIndex === -1 ? filename : filename.slice(0, dotIndex));
        var extension = (dotIndex === -1 ? "" : filename.slice(dotIndex + 1));

        if (subdir === "app" || subdir === "lib") {
            if (extension === "js") {
                serverSources.js.push(subdir + "/" + basename);
            }
        } else if (subdir === "www/css") {
            if (extension === "css") {
                clientSources.css.push(basename);
            } else if (extension === "less") {
                clientSources.less.push(basename);
            }
        } else if (subdir === "www/js") {
            if (extension === "js") {
                clientSources.js.push(basename);
            }
        } else if (subdir === "www/js/lib") {
            if (extension === "js") {
                if (basename === "less" || basename === "require") {
                    // less.js will be added dynamically if LESS precompilation is disabled
                    // require.js is never packaged
                } else {
                    clientSources.libs.push(basename);
                }
            }
        } else if (subdir.slice(0, 7) === "www/js/") {
            if (extension === "js") {
                clientSources.js.push(subdir.slice(7) + "/" + basename);
            }
        } else if (subdir === "www/tmpl") {
            if (extension === "handlebars") {
                clientSources.tmpl.push(basename);
            }
        }
    });

    // sort them all to guarantee consistency in builds
    serverSources.js.sort();
    clientSources.css.sort();
    clientSources.js.sort();
    clientSources.less.sort();
    clientSources.libs.sort();
    clientSources.tmpl.sort();


    /**
     * Creates a list of paths from a list of basenames.
     */
    function createPaths(prefix, fileNames, extension) {
        if (prefix instanceof Array) {
            extension = fileNames;
            fileNames = prefix;
            prefix = "";
        }
        return fileNames.map(function(fileName) {
            return prefix + fileName + (extension || "");
        });
    }


    /**
     * Creates a list of paths for Require.js config.
     */
    function createRequirePaths(options) {
        options = options || {};

        var paths = {};
        var jsPrefix = (config.isPackaged ? "" : "/js/");
        var buildPrefix = (config.isPackaged ? "../../www/build/" : "/build/");
        if (options.compiled) {
            clientSources.js.forEach(function(baseName) {
                paths[baseName] = "application";
            });
            clientSources.libs.forEach(function(baseName) {
                paths[baseName] = "application";
            });
            clientSources.tmpl.forEach(function(baseName) {
                paths["tmpl/" + baseName] = "application";
            });
            clientSources.translations.forEach(function(locale) {
                paths["translations/" + locale] = "translations/" + locale;
            });
        } else {
            clientSources.js.forEach(function(baseName) {
                paths[baseName] = jsPrefix + baseName;
            });
            clientSources.libs.forEach(function(baseName) {
                paths[baseName] = jsPrefix + "lib/" + baseName;
            });
            clientSources.tmpl.forEach(function(baseName) {
                paths["tmpl/" + baseName] = buildPrefix + "tmpl/" + baseName;
            });
            clientSources.translations.forEach(function(locale) {
                paths["translations/" + locale] = buildPrefix + "translations/" + locale;
            });
        }
        return paths;
    }


    /**
     * Command for merging PO files with updated POT file.
     */
    function msgmergeCommand() {
        var dir = "www/translations/";
        var pot = dir + "messages.pot";
        var result = clientSources.translations.map(function(locale) {
            var po = dir + locale + ".po";
            return "if [ -f \"" + po + "\" ]; then\n" +
                   "    echo \"Updating " + po + "\"\n" +
                   "    msgmerge " + po + " " + pot + " > .new.po.tmp\n" +
                   "    exitCode=$?\n" +
                   "    if [ $exitCode -ne 0 ]; then\n" +
                   "        echo \"Msgmerge failed with exit code $?\"\n" +
                   "        rm .new.po.tmp\n" +
                   "        exit $exitCode\n" +
                   "    fi\n" +
                   "    mv .new.po.tmp " + po + "\n" +
                   "fi\n";
        }).join("");
        return result;
    }


    function init() {

        /**
         * Main config
         */
        grunt.initConfig({
            pkg: grunt.file.readJSON("package.json"),

            casperjs: {
                options: {
                    verbose: true,
                    logLevel: "debug"
                },
                files: createPaths("tests/integration/test", clientSources.tests, ".js")
            },

            clean: ["www/build", "build"],

            csso: {
                options: {
                    restructure: true
                },
                all: {
                    files: {
                        "www/build/all.css":
                                    createPaths("www/css/", clientSources.css, ".css")
                            .concat(createPaths("www/build/css/", clientSources.lessRoots, ".css"))
                    }
                }
            },

            handlebars: {
                options: {
                    namespace: "Joe.Templates",
                    amd: true,
                    processContent: function(content) {
                        return content.replace(/^[\x20\t]+/mg, '').replace(/[\x20\t]+$/mg, "")
                                      .replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, "\n");
                    },
                    processName: function(path) {
                        // refer to templates by the key defined in clientSources.tmpl
                        for (var i = 0; i < clientSources.tmpl.length; i++) {
                            var name = clientSources.tmpl[i];
                            if (path.indexOf("tmpl/" + name + ".handlebars") > -1) {
                                return name;
                            }
                        }
                    }
                },
                all: {
                    files: _.object(
                        createPaths("www/build/tmpl/", clientSources.tmpl, ".js"),
                        createPaths("www/tmpl/", clientSources.tmpl, ".handlebars")
                    )
                }
            },

            jshint: {
                options: {
                    browser: true,
                    camelcase: false,
                    curly: true,
                    devel: true,
                    eqeqeq: true,
                    indent: 4,
                    noarg: true,
                    node: true,
                    nonew: true,
                    predef: ["casper", "define", "module", "require", "-event"],
                    strict: true,
                    trailing: true,
                    undef: true,
                    unused: true
                },
                gruntfile: "Gruntfile.js",
                serverSources: createPaths(_.filter(serverSources.js, function(src) {
                    return src !== "lib/laces";
                }), ".js"),
                serverTests: createPaths("tests/unit/test", serverSources.tests, ".js"),
                clientSources: createPaths("www/js/", _.filter(clientSources.js, function(src) {
                    return src.slice(0, 10) !== "bootstrap/";
                }), ".js"),
                clientTests: createPaths("tests/integration/test", clientSources.tests, ".js")
            },

            less: {
                options: {
                    paths: ["www/img"],
                    strictMath: true
                },
                all: {
                    files: _.object(
                        createPaths("www/build/css/", clientSources.lessRoots, ".css"),
                        createPaths("www/css/", clientSources.lessRoots, ".less")
                    )
                }
            },

            nodeunit: {
                options: {
                    verbose: true,
                    logLevel: "debug"
                },
                all: createPaths("tests/unit/test", serverSources.tests, ".js")
            },

            po2json: {
                all: {
                    files: _.object(
                        createPaths("www/translations/", clientSources.translations, ".js"),
                        createPaths("www/translations/", clientSources.translations, ".po")
                    ),
                    options: {
                        requireJs: true
                    }
                }
            },

            requirejs: {
                options: {
                    appDir: "www/js/",
                    baseUrl: "./",
                    dir: "build",
                    enforceDefine: true,
                    optimize: "none",
                    optimizeCss: false,
                    keepBuildDir: true,
                    fileExclusionRegExp: /^\.|^Gruntfile.js$|^node_modules/,
                    paths: createRequirePaths(),
                    preserveLicenseComments: false,
                    shim: {
                        "bootstrap/alert": { deps: ["jquery"], exports: "$.fn.alert" },
                        "bootstrap/collapse": { deps: ["jquery"], exports: "$.fn.collapse" },
                        "bootstrap/modal": { deps: ["jquery"], exports: "$.fn.modal" },
                        "bootstrap/popover": { deps: ["bootstrap/tooltip", "jquery"],
                                                         exports: "$.fn.popover" },
                        "bootstrap/tooltip": { deps: ["jquery"], exports: "$.fn.tooltip" },
                        "bootstrap/transition": { deps: ["jquery"],
                                                  exports: "$.fn.emulateTransitionEnd" },
                        "canvasloader": { deps: [], exports: "CanvasLoader" },
                        "handlebars": { exports: "Handlebars" },
                        "jquery.pnotify": { deps: ["jquery"], exports: "$.pnotify" },
                        "jquery.storage": { deps: ["jquery"], exports: "$.localStorage" },
                        "select2": { deps: ["jquery"], exports: "Select2" },
                        "setzerotimeout": { exports: "setZeroTimeout" }
                    }
                },
                all: {
                    options: {
                        modules: [
                            {
                                name: "application"
                            }
                        ]
                    }
                }
            },

            shell: {
                options: {
                    failOnError: true
                },
                mkBuildDir: {
                    command: "mkdir build; mkdir build/www"
                },
                mkCssDir: {
                    command: "mkdir www/build/css"
                },
                ln: {
                    command: "ln -s ../../img www/build/css/img;" +
                             "ln -s ../favicon.png www/build/;" +
                             "ln -s ../translations www/build/translations"
                },
                lnNoLess: {
                    command: "ln -s ../img www/build/img"
                },
                cleanupBuild: {
                    // the build directory contains a lot of crust (mostly due to require.js),
                    // which we would not want to be included for distribution... for this reason we
                    // remove every file and directory from the build directory that does not match
                    // the production regex
                    command: "mkdir www2;" +
                             "cp www/build/all.css www2;" +
                             "cp www/build/index.html www2;" +
                             "cp www/build/favicon.png www2;" +
                             "cp -R www/fonts www2;" +
                             "cp -R www/img www2;" +
                             "cp www/js/lib/require.js www2;" +
                             "mkdir www2/translations;" +
                             "cp www/translations/*.js www2/translations;" +
                             "rm -Rf www;" +
                             "cp build/application.js www2;" +
                             "rm -Rf build;" +
                             "mv www2 www;"
                },
                copyTemplates: {
                    command: "cp -R www/build/tmpl build/www/tmpl"
                },
                msgmerge: {
                    command: msgmergeCommand()
                }
            },

            watch: {
                less: {
                    files: ["www/css/**.less"],
                    tasks: ["less"]
                },
                templates: {
                    files: ["www/tmpl/**.handlebars"],
                    tasks: ["handlebars"]
                },
                options: {
                    nospawn: true
                }
            },

            xgettext: {
                all: {
                    files: {
                        handlebars: createPaths("www/tmpl/", clientSources.tmpl, ".handlebars"),
                        javascript: createPaths("www/js/", clientSources.js, ".js")
                    },
                    options: {
                        functionName: "i18n",
                        potFile: "www/translations/messages.pot",
                        processMessage: function(message) {
                            return message.replace(/\s+/g, " "); // simplify whitespace
                        }
                    }
                }
            }

        });

        grunt.loadNpmTasks("grunt-casperjs");
        grunt.loadNpmTasks("grunt-csso");
        grunt.loadNpmTasks("grunt-contrib-clean");
        grunt.loadNpmTasks("grunt-contrib-handlebars");
        grunt.loadNpmTasks("grunt-contrib-jshint");
        grunt.loadNpmTasks("grunt-contrib-less");
        grunt.loadNpmTasks("grunt-contrib-nodeunit");
        grunt.loadNpmTasks("grunt-contrib-requirejs");
        grunt.loadNpmTasks("grunt-contrib-watch");
        grunt.loadNpmTasks("grunt-gettext");
        grunt.loadNpmTasks("grunt-shell");


        /**
         * Generate Qt Creator .files file.
         */
        grunt.registerTask("files-file", "Generate CI-Joe.files for Qt Creator", function() {
            var lines = [
                "config/app.yaml",
                "create_release.sh",
                "Gruntfile.js",
                "joe.sh",
                "package.json",
                "README.md",
                "node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js",
                "slave.sh",
                "run_tests.sh",
                "tests/integration/testerutil.js",
                "tools/install-git-hooks.sh",
                "tools/git-pre-commit",
                "www/index.html.tmpl"
            ];
            lines = lines.concat(createPaths(serverSources.js, ".js"));
            lines = lines.concat(createPaths("tests/unit/test", serverSources.tests, ".js"));
            lines = lines.concat(createPaths("tests/integration/test", clientSources.tests, ".js"));
            lines = lines.concat(createPaths("www/css/", clientSources.css, ".css"));
            lines = lines.concat(createPaths("www/css/", clientSources.less, ".less"));
            lines = lines.concat(createPaths("www/js/", clientSources.js, ".js"));
            lines = lines.concat(createPaths("www/js/lib/", clientSources.libs, ".js"));
            lines = lines.concat(createPaths("www/tmpl/", clientSources.tmpl, ".handlebars"));
            grunt.file.write("CI-Joe.files", lines.join("\n"));
            grunt.log.ok("CI-Joe.files written.");
        });


        /**
         * Process index.html.tmpl.
         */
        grunt.registerTask("index", "Generate index.html depending on configuration", function() {
            var tmpl = grunt.file.read("www/index.html.tmpl");
            grunt.file.write("www/build/index.html", grunt.template.process(tmpl));
        });


        /**
         * Expose the config object to Grunt so it can be used from the index.html template.
         */
        grunt.config("externalConfig", config);
        for (var key in config) {
            grunt.config(key, config[key]);
        }


        /**
         * Generate the client-side require.js configuration set in the HTML head.
         */
        var requirejsConfig = grunt.config("requirejs").options;
        if (config.isPackaged) {
            requirejsConfig.paths = createRequirePaths({ compiled: true });
        }
        grunt.config("requirejsConfig", requirejsConfig);


        /**
         * Generate paths for all CSS includes in the HTML head.
         */
        var cssIncludes = [];
        if (config.isPackaged) {
            cssIncludes.push("/all.css");
        } else {
            clientSources.lessRoots.forEach(function(lessFileName) {
                if (config.lessPrecompiled) {
                    cssIncludes.push("/build/css/" + lessFileName + ".css");
                } else {
                    cssIncludes.push("/css/" + lessFileName + ".less");
                }
            });
            clientSources.css.forEach(function(cssFileName) {
                cssIncludes.push("/css/" + cssFileName + ".css");
            });
        }
        grunt.config("cssIncludes", cssIncludes);
    }

    grunt.registerTask("default", "Default tasks", function() {
        var tasks = ["jshint", "clean", "handlebars", "shell:ln", "index"];

        var qtCreator = !!grunt.option("qt-creator");
        if (qtCreator) {
            tasks.unshift("files-file");
        }

        var noLess = !!grunt.option("no-less");
        if (noLess) {
            config.lessPrecompiled = false;
            clientSources.libs.push("less");
            tasks.splice(4, 0, "shell:mkCssDir", "shell:lnNoLess");
        } else {
            tasks.splice(4, 0, "less");
        }

        var watch = !!grunt.option("watch");
        if (watch) {
            tasks.push("watch");
        }

        init();

        grunt.task.run(tasks);
    });

    grunt.registerTask("dist", "Default tasks", function() {
        var tasks = ["jshint", "clean", "handlebars", "shell:mkBuildDir", "shell:copyTemplates",
                     "less", "csso", "requirejs", "index", "po2json", "shell:cleanupBuild"];

        config.isPackaged = true;

        init();

        grunt.task.run(tasks);
    });

    grunt.registerTask("msgmerge", "Merges a new .pot with the existing .po files", function() {
        init();

        grunt.task.run(["shell:msgmerge"]);
    });

    grunt.registerTask("po2json", "Converts PO files to JSON resources", function() {
        init();

        grunt.task.run(["po2json"]);
    });

    grunt.registerTask("tests", "Run tests", function() {
        init();

        var tasks = ["jshint"];
        if (serverSources.tests.length > 0) {
            tasks.push("nodeunit");
        }
        if (clientSources.tests.length > 0) {
            tasks.push("casperjs");
        }

        grunt.task.run(tasks);
    });

    grunt.registerTask("xgettext", "Extracts translatable messages and generates a new .pot file",
                       function() {
        init();

        grunt.task.run(["xgettext"]);
    });

};
