// Copyright IBM Corp. 2014,2017. All Rights Reserved.
// Node module: loopback-connector-remote
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

/* global module:false */
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
      '<%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    mochaTest: {
      'integration': {
        src: 'test/integration/*.js',
        options: {
          reporter: 'dot',
        },
      },
      'integration-xml': {
        src: 'test/integration/*.js',
        options: {
          reporter: 'xunit',
          captureFile: 'xintegration.xml',
        },
      },
      'unit': {
        src: 'test/*.js',
        options: {
          reporter: 'dot',
        },
      },
      'unit-xml': {
        src: 'test/*.js',
        options: {
          reporter: 'xunit',
          captureFile: 'xunit.xml',
        },
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-mocha-test');

  // Default task.
  grunt.registerTask('default', ['unit', 'integration']);

  if (process.env.JENKINS_HOME) {
    grunt.registerTask('unit', ['mochaTest:unit-xml']);
    grunt.registerTask('integration', ['mochaTest:integration-xml']);
  } else {
    grunt.registerTask('unit', ['mochaTest:unit']);
    grunt.registerTask('integration', ['mochaTest:integration']);
  }
};
