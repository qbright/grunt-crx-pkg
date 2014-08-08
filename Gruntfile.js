/*
 * grunt-crx-pkg
 * https://github.com/qbright/grunt-crx-pkg
 *
 * Copyright (c) 2014 zqbright
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    // Configuration to be run (and then tested).
    crx_pkg: {
      pkgcrx: {
        options: {
          pem:"",
          srcFolder:"yygame-videoOptimization",
          destFolder:"test.crx"
        }
      },
    },


  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['crx_pkg']);

};
