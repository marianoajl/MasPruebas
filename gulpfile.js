

/* PLUGINS
* --------------------------------------------------
*  Load Gulp plugins
* -------------------------------------------------- */
// Gulp
const gulp = require("gulp");
// Gulp API series and  parallel
const { series, parallel } = require("gulp");
// Prefijo CSS
const autoprefixer = require("autoprefixer");
// Sirve y sincroniza los últimos cambios
const browserSync = require("browser-sync").create();
//Un archivo temporal basada almacenamiento en caché de proxy ( en este caso para la task images)
const cache = require("gulp-cache");
// Relacionado con el json
const data = require("gulp-data");
// Necesario para FS poder corroborar que un archivo existe y eliminarlo
const del = require("del");
// Minifica imagenes
const imagemin = require("gulp-imagemin");
// Detecta errores en el código js
const jshint = require("gulp-jshint");
// Automatiza compilacion sass
const sass = require("gulp-sass");

sass.compiler = require("sass");
// Plumber que se encarga de evitar que gulp watch deje de funcionar en caso de un error.
const plumber = require("gulp-plumber");
//Ayuda a producir CSS mejor y mejor estructurado con BEM y SUIT
const postcss = require("gulp-postcss");
// Achica el CSS 
const cssnano = require("cssnano");
// Muestra el tamaño de tu proyecto
const size = require("gulp-size");
// Mapeo de css
const sourcemaps = require("gulp-sourcemaps");
// mergequeries = require('gulp-merge-media-queries'),
const nunjucksRender = require("gulp-nunjucks-render");
// Se combina con since last run
const dependents = require('gulp-dependents');
// File System module
const fs = require('fs');
//  Beautify HTML files.
const htmlbeautify = require('gulp-html-beautify');
// Prettier CSS Files.
const prettier = require("gulp-prettier");
// Limpia el CSS Flies.
const cleanCSS = require("gulp-clean-css");

/* VARS
 * --------------------------------------------------
 *  Variables and project paths
 * -------------------------------------------------- */

const config = {
   global: {
      input: "src",
      output: "dist",
   },

   fonts: {
      input: "src/fonts/**/*",
      output: "dist/content/fonts",
   },
   html: {
      input: "src/views/**/*.{html,njk}",
      pages: ["src/views/*.{html,njk}"],
      layouts: "src/views/layouts/*.{html,njk}",
      build: "dist/**/*.html",
      data: "./src/data.json",
   },
   images: {
      input: "src/images/**/*",
      output: "dist/content/img",
   },
   scripts: {
      input: "src/js/**/*.js",
      output: "dist/content/js",
   },
   static: {
      input: ["src/*.*", "!src/*.{html,njk}", "!src/data.json"],
      ouput: "dist/**/*",
   },

   styles: {
      input: "src/scss/**/*.{scss,sass}",
      output: "dist/content/css",
      all: "src/scss/**/*.{scss,sass}",
   },
};

/* STYLES TASK
 * --------------------------------------------------
 *  Compile SCSS, autoprefix and make sourcemap
 * -------------------------------------------------- */
function styles() {
   
   let optionsPrettier = {
      arrowParens: "always",
      bracketSameLine: false,
      bracketSpacing: true,
      embeddedLanguageFormatting: "auto",
      htmlWhitespaceSensitivity: "css",
      insertPragma: false,
      jsxSingleQuote: false,
      printWidth: 80,
      proseWrap: "preserve",
      quoteProps: "preserve",
      requirePragma: false,
      semi: true,
      singleQuote: false,
      trailingComma: "es5",
      useTabs: false,
      vueIndentScriptAndStyle: false,
      tabWidth: 4,
   };

   return (
      gulp
         .src(config.styles.input, { since: gulp.lastRun(styles) })
         .pipe(dependents()) // find sass files to re-compile
         .pipe(sourcemaps.init())
         .pipe(
            sass({ includePaths: ["./node_modules"] }).on(
               "error",
               sass.logError
            )
         )
         .pipe(postcss([cssnano(), autoprefixer()]))
         .pipe(cleanCSS({ level: 1 })) // Minifica el código. Si lo pongo debajo de Prettier lo deja minificado + elimina comentarios.
         .pipe(sourcemaps.write({ addComment: false }))
         .pipe(prettier(optionsPrettier)) // Aplica Prettier sobre los CSS
         //.pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError)) // Minifica el CSS.
         .pipe(gulp.dest(config.styles.output))
         .pipe(browserSync.stream())
   );
}

/* SCRIPTS TASK
 * --------------------------------------------------
 *  Lint JS file(s) and report errors in console
 * -------------------------------------------------- */
function scripts() {
   return gulp
      .src(config.scripts.input)
      .pipe(plumber())
      .pipe(jshint())
      .pipe(gulp.dest(config.scripts.output))
      .pipe(browserSync.stream());
}

/* CLEAR TASK
 * --------------------------------------------------
 *  Clear cache if needed
 * -------------------------------------------------- */
function clean() {
   return del(config.global.output);
}

/* FONTS TASK
 * --------------------------------------------------
 *  Get fonts for folder
 * -------------------------------------------------- */

function fonts() {
   return gulp.src(config.fonts.input).pipe(gulp.dest(config.fonts.output));
}

/* IMAGES TASK
 * --------------------------------------------------
 *  Compress images - PNG, JPG, GIF and SVG
 *  Doesn't remove IDs from SVG files
 * -------------------------------------------------- */

function images() {
   return gulp
      .src(config.images.input)
      .pipe(plumber())
      .pipe(
         cache(
            imagemin([
               imagemin.optipng({ optimizationLevel: 6 }),
               imagemin.gifsicle({ interlaced: true }),
               imagemin.svgo({
                  plugins: [{ cleanupIDs: false }],
               }),
            ])
         )
      )
      .pipe(gulp.dest(config.images.output));
}

/* SIZE TASK
 * --------------------------------------------------
 *  Display size of dist folder
 * -------------------------------------------------- */

function fileSize() {
   return gulp
      .src(config.static.ouput)
      .pipe(size({ title: "Deployment build:", gzip: true }));
}

/* NUNJUCKS TASK
* --------------------------------------------------
*  Render Nunjucks template(s) to HTML and sync
*  data from data.json on change
* -------------------------------------------------- */

function views() {
   let optionsBeautify = {
      indent_size: 4,
      indent_level: 0,
      preserve_newlines: false,
   };
   return gulp
      .src(config.html.pages, { base: "src/views" })
      .pipe(plumber())
      .pipe(
            data(function () {
               return require(config.html.data);
               return JSON.parse(fs.readFileSync(config.html.data));
            })
      )
      .pipe(
            nunjucksRender({
               path: ["src/views"],
            })
      )
      .pipe(htmlbeautify(optionsBeautify))
      .pipe(gulp.dest(config.global.output))
      .pipe(browserSync.stream());
}

/* DEFAULT TASK 
* --------------------------------------------------
*  Creates a dev build with hot reloading
*  located in the dist/ folder
* -------------------------------------------------- */

// Task dev. Correr "gulp build" antes
function dev() {
   browserSync.init({
      server: {
         baseDir: "./dist",
         index: "/view5.html",
      },
   });
   gulp.watch("src/scss/**/*.scss", styles);
   gulp.watch("src/js/**/*.js", scripts);
   // gulp.watch("src/js/**/*.json", scripts); // copia los *.json y los deja en /dist/content/js
   gulp.watch("src/views/**/*.njk", views);
}

exports.styles = styles;
exports.images = images;
exports.fonts = fonts;
exports.scripts = scripts;
exports.views = views;
exports.clean = clean;
exports.dev = dev;
exports.build = series(
   clean,
   parallel(styles, views, scripts, fonts, images),
   fileSize
);
