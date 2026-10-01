test:
	npx playwright test

test-headed:
	npx playwright test --headed

stress:
	npx playwright test --repeat-each 10 --fail-on-flaky-tests

debug:
	npx playwright test --debug

report:
	npx playwright show-report
