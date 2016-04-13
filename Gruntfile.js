module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        nggettext_extract: {
            pot: {
                files: {
                    'po/template.pot': ['public/views/*.html', 'public/js/*.js']
                }
            }
        },

        nggettext_compile: {
            all: {
                files: {
                    'public/js/translations.js': ['po/*.po']
                }
            }
        },

        concat: {
            options: {
                separator: ";\n"
            },
            angularCommonLibsJs: {
                src: [
                    'node_modules/angular/angular.min.js',
                    'node_modules/angular-animate/angular-animate.min.js',
                    'node_modules/angular-aria/angular-aria.min.js',
                    'node_modules/angular-gettext/dist/angular-gettext.min.js',
                    'node_modules/angular-material/angular-material.min.js',
                    'node_modules/angular-ui-router/release/angular-ui-router.min.js',
                    'node_modules/angular-resource/angular-resource.min.js',
                    'node_modules/angular-local-storage/dist/angular-local-storage.min.js',
                    'node_modules/angular-material-data-table/dist/md-data-table.min.js'
                ],
                dest: '../../public/js/angular-common-libs.js',
                nonull: true
            },

            angularCommonLibsCss: {
                src: [
                    'node_modules/angular-material/angular-material.min.css',
                    'node_modules/angular-material-data-table/dist/md-data-table.min.css'
                ],
                dest: '../../public/css/angular-common-libs.css',
                nonull: true
            }
        },

        uglify: {
            appJs: {
                files: {
                    '../../public/js/app.min.js': ['public/js/Starter.js', 'public/js/StarterController.js', 'public/js/translations.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task(s).
    grunt.registerTask('default', []);
    grunt.registerTask('extract_translations', ['nggettext_extract']);
    grunt.registerTask('compile_translations', ['nggettext_compile']);
    grunt.registerTask('concat_assets', ['concat', 'uglify']);
};
