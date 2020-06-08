const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: (!__dirname.includes("/node_modules/") && process.env.LOG_LEVEL ) || 'fatal',
});

const http				= require('http');

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

	    if ( err instanceof HTTPError )
		status_code		= err.status;
	    else if ( err instanceof AuthError )
		status_code		= 401;
	    else if ( err instanceof InputError )
		status_code		= 400;
	    else
		status_code		= 500;
	    name			= err.name || err.constructor.name;
	    message			= err.message || String(err);
	    stack			= err.stack;
	}

	this.status			= status_code;
	this.status_name		= http.STATUS_CODES[ status_code ] || "Custom Status Code";

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
	    .add( ...allowed.map(m => m.toUpperCase()) );

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
