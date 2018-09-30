module.exports = function (grunt) {
  var pkg = grunt.file.readJSON('package.json');
  var root = "h:\\pj\\www\\html\\";
  //プラグインごとの設定
  grunt.initConfig({
    watch: {
      compress: {
        files: [root + '*.html', root + '*.htm'],
        tasks: ['compress']
      }
    },
    compress: {
      options: {
        mode: 'gzip',
        level: 9
      }
    }
  });
  
  //grunt.loadNpmTasks('grunt-jslint');//まだ設定してない。
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  grunt.loadNpmTasks('grunt-contrib-compress');
  
  
  // デフォルトタスクなどのタスク名を設定
  grunt.registerTask('default', ['watch', 'gzip']);
}
