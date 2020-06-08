const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

const expect				= require('chai').expect;

const error_types			= require('../../src/index.js');
const { SeriousError,
	InputError,
	HTTPError,
	HTTPResponseError }		= error_types;
const tag				= Symbol.toStringTag;


function error_tests () {
    it("should check that all types implement hasInstance properly", async () => {
	log.silly("Result: %s", JSON.stringify(error_types,null,4) );

	for ( let [name, err_type] of Object.entries(error_types) ) {
	    let err			= new err_type();
	    log.debug("Checking if %-30s is an instance of %-30s and %s",
		      err[tag], err_type.name, SeriousError.name );
	    expect( err[tag]			).to.equal( err_type.name );
	    expect( err				).to.be.an( err_type.name );
	    expect( err instanceof err_type	).to.be.true;
	    expect( err instanceof SeriousError	).to.be.true;
	    expect( err_type + ""		).to.have.string( `[${err_type.name} {}]` );
	    expect( err + ""			).to.have.string( `[${err_type.name}(` );
	}

	let err				= new HTTPResponseError();
	expect( err instanceof HTTPError	).to.be.true;
    });

    it("should create HTTPResponseError", async () => {
	const message			= `You are lost`;
	const err			= new HTTPResponseError( 404, message );
	log.silly("Result: %s", JSON.stringify(err,null,4) );

	expect( err			).to.be.a("HTTPResponseError");
	expect( err.status		).to.equal( 404 );
	expect( err.name		).to.equal( "Not Found" );
	expect( err.message		).to.equal( message );
	expect( err.stack		).to.be.a("string");
    });

    it("should be instance of SeriousError", async () => {
	let err;
	const $type			= Symbol.for("type");
	const $serious			= Symbol.for("@whi/serious-error-types");

	class OtherVersionError extends Error {
	    [$type]			= $serious;
	    [Symbol.toStringTag]	= "SeriousError";
	}
	err				= new OtherVersionError("Boom!");

	expect( err instanceof SeriousError	).to.be.true;

	class OtherVersionHTTPError extends Error {
	    [$type]			= $serious;
	    [Symbol.toStringTag]	= "HTTPError";
	}
	err				= new OtherVersionHTTPError("Boom!");

	expect( err instanceof HTTPError	).to.be.true;
	expect( err instanceof InputError	).to.be.false;
    });
}

describe("Unit Tests", () => {

    describe("Errors", error_tests );

});
