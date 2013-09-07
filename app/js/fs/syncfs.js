/*global define chrome _ */
define(function(require, exports, module) {

    // As syncfs does not yet support creating directories, we'll use it as a flat namespace
    // https://groups.google.com/a/chromium.org/forum/#!topic/chromium-apps/v-uK6IPOCE8
    function decodePath(path) {
        return "/" + path.replace(/\|/g, "/");
    }

    function encodePath(path) {
        return path.substring(1).replace(/\//g, "|", path);
    }

    return function(callback) {
        chrome.syncFileSystem.requestFileSystem(function(fs) {
            var operations = {
                listFiles: function(callback) {
                    var reader = fs.root.createReader();
                    reader.readEntries(function(entries) {
                        var results = [];
                        for(var i = 0; i < entries.length; i++) {
                            var entry = entries[i];
                            if(entry.name !== ".zedstate") {
                                results.push(decodePath(entry.name));
                            }
                        }
                        callback(null, results);
                    }, callback);
                },
                readFile: function(path, callback) {
                    var encodedPath = encodePath(path);
                    fs.root.getFile(encodedPath, {}, function(f) {
                        var fileReader = new FileReader();
                        fileReader.onload = function(e) {
                            callback(null, e.target.result);
                        };
                        f.file(function(file) {
                            fileReader.readAsText(file);
                        });
                    }, callback);
                },
                writeFile: function(path, content, callback) {
                    var encodedPath = encodePath(path);
                    fs.root.getFile(encodedPath, {
                        create: true
                    }, function(fileEntry) {
                        fileEntry.createWriter(function(fileWriter) {
                            fileWriter.onwriteend = function() {
                                callback();
                            };
                            fileWriter.onerror = function(e) {
                                callback(e.toString());
                            };

                            var blob = new Blob([content]);
                            fileWriter.write(blob);
                        }, callback);
                    }, callback);
                },
                deleteFile: function(path, callback) {
                    var encodedPath = encodePath(path);
                    fs.root.getFile(encodedPath, {}, function(fileEntry) {
                        fileEntry.remove(function() {
                            callback();
                        }, callback);
                    });
                },
                getUrl: function(path, callback) {
                    var encodedPath = encodePath(path);
                    fs.root.getFile(encodedPath, {}, function(fileEntry) {
                        callback(null, fileEntry.toURL());
                    });
                },
                watchFile: function() {
                    // TODO
                },
                unwatchFile: function() {
                    // TODO
                }
            };
            callback(null, operations);
            operations.writeFile("/welcome.md", require("text!../../notes.md"), function(err) {
                if(err) {
                    console.error(err);
                }
            });
        });
    };
});