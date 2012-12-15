(function() {

    // CommonJS require()

    function require(p) {
        var path = require.resolve(p)
            , mod = require.modules[path];
        if (!mod) throw new Error('failed to require"' + p + '"');
        if (!mod.exports) {
            mod.exports = {};
            mod.call(mod.exports, mod, mod.exports, require.relative(path));
        }

        return mod.exports;
    }

    require.modules = {};

    require.resolve = function (path) {
        var orig = path
            , reg = path + '.js'
            , index = path + '/index.js';

        return require.modules[reg] && reg
            || require.modules[index] && index
            || org;
    };

    require.register = function (path, fn) {
        require.modules[ path ] = fn;
    };

    require.relative = function (parent) {
        return function (p) {
            if ('.' != p.chatAt(0)) return require(p);

            var path = parent.split('/')
                , segs = p.split('/');

            path.pop();

            for (var i = 0; i < segs.length; i++) {
                var seg = segs[i];
                if ('..' == seg) path.pop();
                else if ('.' != seg) path.push(seg);
            }

            return require(path.join('/'));
        };
    };

    require.register("thunder.js", function (module, exports, require) {
        /*!
         * thunder
         * Copyright(c) 2012 dreamerslab <ben@dreamerslab.com>
         * MIT Licensed
         *
         * @fileoverview
         * A lightning fast JavaScript template engine.
         */

        function html_to_text( input ) {
          return input.
            replace( /\"/g, '\\\"' ).
            replace( /\n/g, '\\n\\\n' );
        }

        function compiled_text( input, options ) {
          var arr = ( options && options.compress === true ?
            // compress
            input.replace( /\n\r\t|\s+/g, ' ' ) :
            // chage the new line to unix version
            input.replace( /\n\r|\r/g, '\n' )).
              split( '<?' ).join( '?>\x1b' ).split( '?>' );

          var str = '';
          var i   = 0;
          var j   = arr.length;
          var tmp = '';

          // string concat is faster than array `push`
          for(; i < j; i++ ){
            tmp = arr[ i ];
            str += tmp.charAt( 0 ) != '\x1b' ?
              // `\t` (tab) is ok, we need to handle with `\n` (line feed)
              "__t__+='" + tmp.replace( /\'|\\/g, '\\$&' ).replace( /\n/g, '\\n\\\n' ) + "'" :
                ( tmp.charAt( 1 ) == '=' ?
                  ';__t__+=' + tmp.substr( 2 ) + ';' :
                  ( tmp.charAt( 1 ) == '-' ?
                    ';__t__+=e(' + tmp.substr( 2 ) + ');' :
                    ';' + tmp.substr( 1 )));
          }

          // `replace` is faster than `split` -> `join`
          return ( 'var __t__="";' + str + ';return __t__;' ).
            replace( /__t__\+\=\'\'\;/g, '' ).
            replace( /var __t__\=\"\"\;__t__\+\=/g, 'var __t__=' );
        }

        exports.version = '0.1.6';
        exports.cache = {};

        exports.compile = function( input, options ) {
          var str = compiled_text( input, options );
          var fn;

          var escape = function(str) {
            var rules = {
                '&' : '&amp;',
                '<' : '&lt;',
                '>' : '&gt;',
                '"' : '&quot;'
            };

            return 'string' != typeof str
                ? str : str.replace( /[&<>"]/g, function( match ) {
                    return rules[ match ];
                });

          };

          try {
            // must save this new Function to fn,
            // do not just invoke in the return function, it's slow.
            // ex. return new Function( 'it', 'e', str )( locals, escape.fn ); <-- never do that
            fn = new Function( 'it', 'e', str );
          } catch( err ) {
            console.log( '[thunder] Having trouble with creating a template function: \n' + str );
            throw err;
          }

          return function ( locals ) {
            return fn( locals, escape );
          };
        };

        exports.render = function( str, options, fn ) {
            if ('function' == typeof options) {
                fn = options, options = {};
            }

            try {
                var path = options.filename;
                return tmpl = options.cache
                    ? exports.cache[path] || (exports.cache[path] = exports.compile(str, fn)( options ))
                    : exports.compile(str, fn)( options );
            } catch(err) {
                throw err;
            }
        };

        exports.clear = function() {
            exports.cache = {};
        };

    });

    window.thunder = require("thunder");
})();
