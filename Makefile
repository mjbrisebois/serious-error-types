#
# Project
#
package-lock.json:	package.json
	npm install
	touch $@
node_modules:		package-lock.json
	npm install
	touch $@
build:			node_modules


#
# Testing
#
test:			build
	npx mocha --recursive ./tests
test-debug:		build
	LOG_LEVEL=silly npx mocha --recursive ./tests

test-unit:		build
	npx mocha ./tests/unit
test-unit-debug:	build
	LOG_LEVEL=silly npx mocha ./tests/unit

test-integration:	build
	npx mocha ./tests/integration
test-integration-debug:	build
	LOG_LEVEL=silly npx mocha ./tests/integration


#
# Repository
#
clean-remove-chaff:
	@find . -name '*~' -exec rm {} \;
clean-files:		clean-remove-chaff
	git clean -nd
clean-files-force:	clean-remove-chaff
	git clean -fd
clean-files-all:	clean-remove-chaff
	git clean -ndx
clean-files-all-force:	clean-remove-chaff
	git clean -fdx


#
# NPM
#
prepare-package:
	npm run build
preview-package:	clean-files test prepare-package
	npm pack --dry-run .
create-package:		clean-files test prepare-package
	npm pack .
publish-package:	clean-files test prepare-package
	npm publish --access public .
