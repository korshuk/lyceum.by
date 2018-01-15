module.exports = function (grunt) {
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

        concat: {
            dist: {
                src: ['public/js/pupils/ready.js', 'public/js/pupils/dropify.js', 'public/js/pupils/material.js', 'public/js/pupils/storage.js', 'public/js/pupils/oauth.js', 'public/js/pupils/ui.js', 'public/js/pupils/app.js'],
                dest: 'public/js/results.js',
            },
            main: {
                src: ['public/js/pupils/ready.js', 'public/js/pupils/material.js', 'public/js/lyceumscript.js'],
                dest: 'public/js/script.js',
            }
        },

        uglify: {
            lyceum: {
                files: {
                    'public/js/script.min.js': ['public/js/script.js'],
                    'public/js/results.min.js': ['public/js/results.js']
                }
            }
        },


        watch: {
            styles: {
                files: ['public/less/**/*.less', 'public/js/pupils/*.js', 'public/js/*.js'],
                tasks: ['less', 'postcss', 'concat', 'uglify'],
                options: {
                    nospawn: true
                }
            }
        }
    });

    grunt.registerTask('default', ['less', 'postcss', 'concat', 'uglify', 'watch']);
};