module.exports = function(grunt) {
  require('jit-grunt')(grunt);

  grunt.initConfig({

    postcss: {
      options: {
        map: {
            inline: false,
            annotation: 'public/css/maps/'
        },

        processors: [
          require('autoprefixer')({browsers: '> 5%'}),
          require('cssnano')()
        ]
      },
      dist: {
        src: ['public/css/style.css', 'public/css/widget.css']
          }
    },

    less: {
      development: {
        options: {
          compress: true,
          yuicompress: true,
          optimization: 2
        },
        files: {
          "public/css/style.css": "public/less/main.less",
          "public/css/widget.css": "public/less/widget.less",
          "public/css/stats.css": "public/less/stats.less"
        }
      }
    },

    watch: {
      styles: {
        files: ['public/less/**/*.less'],
        tasks: ['less', 'postcss'],
        options: {
          nospawn: true
        }
      }
    }
  });

  grunt.registerTask('default', ['less', 'postcss', 'watch']);
};