#!/usr/bin/env node

var path = require('path');
var chalk = require('chalk');

var argv = require('minimist')(process.argv.slice(2), {
    boolean: [
        'help',
        'clearDatastore',
        'prod',
        'build'
    ],
    alias: {
        'c': 'clearDatastore',
        'h': 'help',
        'b': 'build',
        'p': 'prod'
    }
});
var usage = `
Usage: start.js [-c][-h]
    -h help
    -c clear_datastore
    -b build (and don't run)
    -p set NODE_ENV to prod
`;

var shouldBuild = argv.build;
var shouldProd = argv.prod;
if (shouldBuild) {
    shouldProd = true;
}

if (argv.help) {
    console.log(usage);
    process.exit();
}


var projectRoot = path.resolve(__dirname);
var startEngine = require('start-engine');

// options - https://github.com/foreverjs/forever-monitor


var appengineOptions = [
    '--smtp_host=localhost',
    '--smtp_port=1025'
];
if (argv.clearDatastore) {
    appengineOptions.push('--clear_datastore=yes');
}
var appengine = startEngine.MyProcess([
        'bash', '-c', 
        // kill the existing ones
        'lsof -i :8080 | tail -n +2 | awk \'{print $2}\' | uniq | xargs echo | xargs kill -9; ' +
        `dev_appserver.py ${appengineOptions.join(" ")} appengine`
    ], 
    {
        uid: "appengine",
        max: 1,
        watch: false,
        cwd: projectRoot,
        killSignal: 'SIGTERM'
    }, 
    {
        color: chalk.green,
        filter(line, index, isLast) {
            if (line.match(/INFO.+?Detected file changes:/)) {
                this.detected = true;
                this.detectedLine = line;
                this.detectedMediaFilesChanges = 0;
                this.detectedChangeLines = [];
                this.justDetected = false;
                return false;
            }
            var isMediaLine = line.match(/\/media/);
            var isFinalMediaLine = false;
            
            if (this.justDetected && isMediaLine) {
                this.detected = true;
            } else if (this.justDetected && !isMediaLine) {
                this.detected = false;
                isFinalMediaLine = true;
                //line = 'justDetected OFF ' + line;
            }
            if (this.justDetected) {
                this.justDetected = false;
            }
            if (this.detected && isLast) {
                this.justDetected = true;
                this.detected = false;
                //line = 'justDetected ON ' + line;
            }
            if (this.detected || this.justDetected) {
                if (isMediaLine) {
                    this.detectedMediaFilesChanges++;
                } else {
                    this.detectedChangeLines.push(line);
                }
            }
            
            if (line.match(/INFO.+?GET.+?\/media/)) {
                return false;
            }
            if (line.match(/appengine\/media/)) {
                return false;
            }
            if (isFinalMediaLine) {
                var message = 
                    this.detectedLine + '  ' + 
                    this.detectedMediaFilesChanges + ' media files changed and ' +
                    this.detectedChangeLines.length + ' other lines captured';

                this.detectedLine = null;
                this.detectedMediaFilesChanges = null;
                this.detectedChangeLines = null
                return message;
            }
            return line;
        }
    });

var webpack = startEngine.MyProcess(
    path.resolve(__dirname, 'webpack-build.js'),
    {
        uid: "webpack",
        max: 1,
        watch: false,
        cwd: projectRoot
    },
    {
        color: chalk.cyan
    });

if (shouldProd) {
    process.env['NODE_ENV'] = "production";
}

if (shouldBuild) {
    // there's no reason to run appengine in this case
    startEngine.run([
        webpack
    ]);
} else {
    startEngine.run([
        appengine,
        webpack
    ]);
}
