const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
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


//
// Custom error's group
//
class SeriousError extends Error {
    [Symbol.toStringTag]	= "SeriousError";

    constructor( ...params ) {
	super( ...params );

	if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, this.constructor);
	}

	this.name		= this.constructor.name;
    }

    toJSON () {
	return {
	    "error":	this.name,
	    "message":	this.message,
	};
    }
}


//
// Input Errors
//
class InputError extends SeriousError {
}

class MissingArgumentError extends InputError {
    constructor( position, name ) {
	super(`Missing required argument ${position} (${name})`);

	this.position		= position;
	this.position_name	= name;
    }
}

class InvalidArgumentError extends InputError {
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
}

class DatabaseQueryError extends DatabaseError {
    constructor( message, query ) {
	super( message );

	this.query		= query.toString();
    }
}

class ItemNotFoundError extends DatabaseError {
    constructor( query ) {
	const sql		= query.toString();
	super(`Found 0 results for ${query._single.table} using query:\n\n    ${sql}\n`);

	this.query		= sql;
    }
}


//
// Auth Errors
//
class AuthError extends SeriousError {
}

class AuthenticationError extends AuthError {
    constructor() {
	super(`Password verification failed.`);
    }
}


//
// HTTP Response Errors
//
class HTTPError extends SeriousError {
}

class HTTPResponseError extends HTTPError {
    constructor( status_code = 500, name, message, stack ) {
	super();

	if ( status_code instanceof Error ) {
	    let err			= status_code;
	    status_code			= err instanceof this.constructor ? err.status : 500;
	    name			= err.name || err.constructor.name;
	    message			= err.message || String(err);
	    stack			= err.stack;
	}

	this.status			= status_code;
	this.status_name		= http.STATUS_CODES[ status_code ] || "Custom Status Code";
	this.stack			= typeof stack === "string"
	    ? stack.split("\n")
	    : stack;

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

    toJSON () {
	return {
	    "status":	this.status,
	    "error":	this.name,
	    "message":	this.message,
	    "stack":	process.env.LOG_LEVEL ? this.stack : undefined,
	};
    }
}

class MethodNotAllowedError extends HTTPResponseError {
    constructor( path, method, allowed = [] ) {
	super( 405, `${path} does not support HTTP request method ${method}` );

	allowed				= (new Set(["GET", "HEAD"]))
	    .add( ...allowed.map(m => m.toUpperCase()) );

	this.allowed			= Array.from( allowed.values() );
    }
}



module.exports			= {
    SeriousError,

    // Input types
    InputError,
    MissingArgumentError,
    InvalidArgumentError,

    // Database types
    DatabaseError,
    ItemNotFoundError,
    DatabaseQueryError,

    // Auth types
    AuthError,
    AuthenticationError,

    // HTTP types
    HTTPError,
    HTTPResponseError,
    MethodNotAllowedError,
};
