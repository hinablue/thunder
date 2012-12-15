/*!
 * thunder
 * Copyright(c) 2012 dreamerslab <ben@dreamerslab.com>
 * MIT Licensed
 *
 * @fileoverview
 * A lightning fast JavaScript template engine.
 */

var fs = require( 'fs' );

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
        var tmpl = options.cache
            ? exports.cache[path] || (exports.cache[path] = exports.compile(str, options))
            : exports.compile(str, options);
        if ('function' != typeof fn) {
            return tmpl(options);
        } else {
            fn( null, tmpl(options));
        }
    } catch(err) {
        if ('function' != typeof fn) {
            throw err;
        } else {
            fn( err );
        }
    }
};

exports.renderFile = function( path, options, fn ) {
    var key = path + ':string';

    if ('function' == typeof options) {
        fn = options, options = {};
    }

    try {
        options.filename = path;
        var str = options.cache
            ? exports.cache[key] || (exports.cache[key] = fs.readFileSync(path, 'utf8'))
            : fs.readFileSync(path, 'utf8');
        exports.render( str, options, fn );
    } catch(err) {
        fn(err);
    }
};

exports.clear = function() {
    exports.cache = {};
};

exports.__express = exports.renderFile;
