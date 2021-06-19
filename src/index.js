
// Copied from https://github.com/nodejs/node/blob/master/lib/_http_server.js as of June, 2021
const STATUS_CODES = {
    100: 'Continue',                   // RFC 7231 6.2.1
    101: 'Switching Protocols',        // RFC 7231 6.2.2
    102: 'Processing',                 // RFC 2518 10.1 (obsoleted by RFC 4918)
    103: 'Early Hints',                // RFC 8297 2
    200: 'OK',                         // RFC 7231 6.3.1
    201: 'Created',                    // RFC 7231 6.3.2
    202: 'Accepted',                   // RFC 7231 6.3.3
    203: 'Non-Authoritative Information', // RFC 7231 6.3.4
    204: 'No Content',                 // RFC 7231 6.3.5
    205: 'Reset Content',              // RFC 7231 6.3.6
    206: 'Partial Content',            // RFC 7233 4.1
    207: 'Multi-Status',               // RFC 4918 11.1
    208: 'Already Reported',           // RFC 5842 7.1
    226: 'IM Used',                    // RFC 3229 10.4.1
    300: 'Multiple Choices',           // RFC 7231 6.4.1
    301: 'Moved Permanently',          // RFC 7231 6.4.2
    302: 'Found',                      // RFC 7231 6.4.3
    303: 'See Other',                  // RFC 7231 6.4.4
    304: 'Not Modified',               // RFC 7232 4.1
    305: 'Use Proxy',                  // RFC 7231 6.4.5
    307: 'Temporary Redirect',         // RFC 7231 6.4.7
    308: 'Permanent Redirect',         // RFC 7238 3
    400: 'Bad Request',                // RFC 7231 6.5.1
    401: 'Unauthorized',               // RFC 7235 3.1
    402: 'Payment Required',           // RFC 7231 6.5.2
    403: 'Forbidden',                  // RFC 7231 6.5.3
    404: 'Not Found',                  // RFC 7231 6.5.4
    405: 'Method Not Allowed',         // RFC 7231 6.5.5
    406: 'Not Acceptable',             // RFC 7231 6.5.6
    407: 'Proxy Authentication Required', // RFC 7235 3.2
    408: 'Request Timeout',            // RFC 7231 6.5.7
    409: 'Conflict',                   // RFC 7231 6.5.8
    410: 'Gone',                       // RFC 7231 6.5.9
    411: 'Length Required',            // RFC 7231 6.5.10
    412: 'Precondition Failed',        // RFC 7232 4.2
    413: 'Payload Too Large',          // RFC 7231 6.5.11
    414: 'URI Too Long',               // RFC 7231 6.5.12
    415: 'Unsupported Media Type',     // RFC 7231 6.5.13
    416: 'Range Not Satisfiable',      // RFC 7233 4.4
    417: 'Expectation Failed',         // RFC 7231 6.5.14
    418: 'I\'m a Teapot',              // RFC 7168 2.3.3
    421: 'Misdirected Request',        // RFC 7540 9.1.2
    422: 'Unprocessable Entity',       // RFC 4918 11.2
    423: 'Locked',                     // RFC 4918 11.3
    424: 'Failed Dependency',          // RFC 4918 11.4
    425: 'Too Early',                  // RFC 8470 5.2
    426: 'Upgrade Required',           // RFC 2817 and RFC 7231 6.5.15
    428: 'Precondition Required',      // RFC 6585 3
    429: 'Too Many Requests',          // RFC 6585 4
    431: 'Request Header Fields Too Large', // RFC 6585 5
    451: 'Unavailable For Legal Reasons', // RFC 7725 3
    500: 'Internal Server Error',      // RFC 7231 6.6.1
    501: 'Not Implemented',            // RFC 7231 6.6.2
    502: 'Bad Gateway',                // RFC 7231 6.6.3
    503: 'Service Unavailable',        // RFC 7231 6.6.4
    504: 'Gateway Timeout',            // RFC 7231 6.6.5
    505: 'HTTP Version Not Supported', // RFC 7231 6.6.6
    506: 'Variant Also Negotiates',    // RFC 2295 8.1
    507: 'Insufficient Storage',       // RFC 4918 11.5
    508: 'Loop Detected',              // RFC 5842 7.2
    509: 'Bandwidth Limit Exceeded',
    510: 'Not Extended',               // RFC 2774 7
    511: 'Network Authentication Required' // RFC 6585 6
};

//
// Besides the generic Error constructor, there are seven other core error constructors in
// JavaScript. For client-side exceptions, see Exception handling statements.
//
// EvalError
//
//     Creates an instance representing an error that occurs regarding the global function eval().
//
// InternalError
//
//     Creates an instance representing an error that occurs when an internal error in the
//     JavaScript engine is thrown. E.g. "too much recursion".
//
// RangeError
//
//     Creates an instance representing an error that occurs when a numeric variable or parameter is
//     outside of its valid range.
//
// ReferenceError
//
//     Creates an instance representing an error that occurs when de-referencing an invalid
//     reference.
//
// SyntaxError
//
//     Creates an instance representing a syntax error that occurs while parsing code in eval().
//
// TypeError
//
//     Creates an instance representing an error that occurs when a variable or parameter is not of
//     a valid type.
//
// URIError
//
//     Creates an instance representing an error that occurs when encodeURI() or decodeURI() are
//     passed invalid parameters.
//

const $type			= Symbol.for("type");
const $serious			= Symbol.for("@whi/serious-error-types");


//
// Custom error's group
//
class SeriousError extends Error {
    [$type]			= $serious;
    [Symbol.toStringTag]	= SeriousError.name;

    static [Symbol.hasInstance] ( instance ) {
	// The type property must match our unique symbol otherwise we would match error classes
	// that coincidentally have the same name.
	if ( instance[$type] !== $serious )
	    return false;

	// Automatically passes if we are checking against our root class
	if ( this.name === SeriousError.name )
	    return true;

	if ( instance.constructor.name === this.name )
	    return true;
	if ( instance[Symbol.toStringTag] === this.name )
	    return true;

	// Check all parent classes of instance for matching class name.
	let parent		= instance.constructor;
	let count		= 0;
	while ( parent = Object.getPrototypeOf(parent) ) {
	    if ( ! parent.name )
		break;
	    if ( parent.name === this.name )
		return true;
	    if ( count > 100 )
		throw new Error("Oops...it appears that SeriousError.hasInstance() found an infinite loop");
	    count++;
	}
	return false;
    };

    static [Symbol.toPrimitive] ( hint ) {
	return hint === "number" ? null : `[${this.name} {}]`;
    }

    constructor( ...params ) {
	super( ...params );

	if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, this.constructor);
	}

	this.name		= this.constructor.name;
    }

    [Symbol.toPrimitive] ( hint ) {
	return hint === "number" ? null : this.toString();
    }

    toString () {
	return `[${this.constructor.name}( ${this.message} )]`;
    }

    toJSON ( debug = false ) {
	return {
	    "error":	this.name,
	    "message":	this.message,
	    "stack":	debug === true
		? typeof this.stack === "string" ? this.stack.split("\n") : this.stack
		: undefined,
	};
    }
}


//
// Input Errors
//
class InputError extends SeriousError {
    [Symbol.toStringTag]	= InputError.name;
}

class MissingInputError extends InputError {
    [Symbol.toStringTag]	= MissingInputError.name;

    constructor( context, name ) {
	super(`Missing required input ${context} (${name})`);

	this.context		= context;
	this.input_name		= name;
    }
}

class InvalidInputError extends InputError {
    [Symbol.toStringTag]	= InvalidInputError.name;

    constructor( context, name, given, expected ) {
	super(`Invalid ${context} (${name}) type '${given}', expected type ${expected}`);

	this.context		= context;
	this.input_name		= name;
	this.given		= given;
	this.expected		= expected;
    }
}

class MissingArgumentError extends InputError {
    [Symbol.toStringTag]	= MissingArgumentError.name;

    constructor( position, name ) {
	super(`Missing required argument ${position} (${name})`);

	this.position		= position;
	this.position_name	= name;
    }
}

class InvalidArgumentError extends InputError {
    [Symbol.toStringTag]	= InvalidArgumentError.name;

    constructor( position, name, given, expected ) {
	super(`Invalid argument ${position} (${name}) type '${given}', expected type ${expected}`);

	this.position		= position;
	this.position_name	= name;
	this.given		= given;
	this.expected		= expected;
    }
}


//
// Database Errors
//
class DatabaseError extends SeriousError {
    [Symbol.toStringTag]	= DatabaseError.name;

    constructor( message, query ) {
	const sql		= query === undefined ? null : query.toString();
	let table		= "unknown";
	if ( query && query._single )
	    table		= query === undefined ? null : query._single.table;

	super(`${message} for '${table}' using query:\n\n    ${sql}\n`);

	this.table		= table;
	this.query		= sql;
    }
}

class DatabaseQueryError extends DatabaseError {
    [Symbol.toStringTag]	= DatabaseQueryError.name;

    constructor( message, query ) {
	super( message, query );
    }
}

class ItemNotFoundError extends DatabaseError {
    [Symbol.toStringTag]	= ItemNotFoundError.name;

    constructor( query ) {
	super(`Found 0 results`, query);
    }
}


//
// Auth Errors
//
class AuthError extends SeriousError {
    [Symbol.toStringTag]	= AuthError.name;
}

class AuthenticationError extends AuthError {
    [Symbol.toStringTag]	= AuthenticationError.name;

    constructor( msg = "Credential verification failed" ) {
	super( msg );
    }
}

class AuthorizationError extends AuthError {
    [Symbol.toStringTag]	= AuthorizationError.name;

    constructor() {
	super(`Insufficient permissions`);
    }
}


//
// HTTP Response Errors
//
class HTTPError extends SeriousError {
    [Symbol.toStringTag]	= HTTPError.name;

    constructor( status_code = 500, name, message, stack ) {
	super();

	if ( status_code instanceof Error ) {
	    let err			= status_code;

	    name			= err.name || err.constructor.name;
	    message			= err.message || String(err);
	    stack			= err.stack;

	    if ( err instanceof HTTPError )
		status_code		= err.status;
	    else if ( err instanceof AuthError )
		status_code		= 401;
	    else if ( err instanceof InputError )
		status_code		= 400;
	    else if ( err instanceof ItemNotFoundError ) {
		status_code		= 404;
		message			= `Found 0 results for item lookup.`;
	    }
	    else
		status_code		= 500;
	}

	this.status			= status_code;
	this.status_name		= STATUS_CODES[ status_code ] || "Custom Status Code";

	if ( stack !== undefined )
	    this.stack			= stack;

	// By this point, name, message and stack could still be undefined
	if ( name === undefined || message === undefined ) {
	    this.name			= this.status_name;
	    this.message		= name === undefined ? null : name;
	}
	else {
	    this.name			= name;
	    this.message		= message;
	}
    }

    toJSON ( ...args ) {
	return Object.assign({
	    "status":		this.status,
	    "status_name":	this.status_name,
	}, super.toJSON( ...args ) );
    }
}

class HTTPRequestError extends HTTPError {
    [Symbol.toStringTag]	= HTTPRequestError.name;
}

class NotFoundError extends HTTPRequestError {
    [Symbol.toStringTag]	= NotFoundError.name;

    constructor( path, method, allowed = [] ) {
	super( 404, `Could not find any resource for ${method} ${path}` );
    }
}

class MethodNotAllowedError extends HTTPRequestError {
    [Symbol.toStringTag]	= MethodNotAllowedError.name;

    constructor( path, method, allowed = [] ) {
	super( 405, `${path} does not support HTTP request method ${method}` );

	allowed				= (new Set(["GET", "HEAD"]))

	if ( allowed.length )
	    allowed.add( ...allowed.map(m => m.toUpperCase()) );

	this.allowed			= Array.from( allowed.values() );
    }
}

class HTTPResponseError extends HTTPError {
    [Symbol.toStringTag]	= HTTPResponseError.name;
}



module.exports			= {
    SeriousError,

    // Input types
    InputError,
    MissingInputError,
    InvalidInputError,
    MissingArgumentError,
    InvalidArgumentError,

    // Database types
    DatabaseError,
    ItemNotFoundError,
    DatabaseQueryError,

    // Auth types
    AuthError,
    AuthenticationError,
    AuthorizationError,

    // HTTP types
    HTTPError,

    HTTPRequestError,
    NotFoundError,
    MethodNotAllowedError,

    HTTPResponseError,
};
