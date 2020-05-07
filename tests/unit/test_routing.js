const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

const expect				= require('chai').expect;

const { HTTPResponseError }		= require('../../src/index.js');


function basic_tests () {
    it("should create HTTPResponseError", async () => {
	const message			= `You are lost`;
	const err			= new HTTPResponseError( 404, message );
	log.silly("Result: %s", JSON.stringify(err,null,4) );

	expect( err			).to.be.a("SeriousError");
	expect( err.status		).to.equal( 404 );
	expect( err.name		).to.equal( "Not Found" );
	expect( err.message		).to.equal( message );
	// expect( err.stack		).to.be.a("array");
    });
}

describe("RestfulAPI", () => {

    describe("Basic", basic_tests );

});
