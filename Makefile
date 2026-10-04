.PHONY: test test-headed stress heal visual visual-update perf perf-update report

test:
	npx playwright test

test-headed:
	npx playwright test --headed

stress:
	npx playwright test --repeat-each 10 --fail-on-flaky-tests

heal:
	npx playwright test --repeat-each 10 --fail-on-flaky-tests > stress.log 2>&1 \
	  && echo "Stress run passed, nothing to heal" \
	  || claude -p "/heal" --permission-mode acceptEdits --allowedTools "Read" "Grep" "Glob" "Edit" "Bash(npx playwright test:*)"

visual:
	VISUAL=1 npx playwright test \
	  || claude -p "/visual" --allowedTools "Read" "Glob" "Grep" "Bash(git -C ../zen status:*)" "Bash(git -C ../zen diff:*)" "Bash(git -C ../zen log:*)"

visual-update:
	VISUAL=1 npx playwright test --update-snapshots

perf:
	PERF=1 npx playwright test

perf-update:
	PERF=1 PERF_UPDATE=1 npx playwright test

report:
	npx playwright show-report
