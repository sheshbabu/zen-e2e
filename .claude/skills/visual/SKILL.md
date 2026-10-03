---
name: visual
description: Judge the screenshot diffs from the last visual run and say whether each change is intended, a regression, or noise. Use when the user runs `make visual`, invokes /visual, or asks to review visual diffs.
---

# Visual review

Judge each screenshot that differed from its baseline in the last visual run.
Only report. Never update baselines, edit files, or touch ../zen.

## 1. Collect the diffs

- Each failed screenshot has a folder in `test-results/` with three images: `<name>-expected.png` (the baseline), `<name>-actual.png` (this run) and `<name>-diff.png` (changed pixels in red).
- The folder name holds the project, such as `desktop-dark` or `mobile-light`, and the test name.
- If there are no such folders, say the visual run passed and stop.
- Look at all three images for every diff. The diff image shows where to look, and expected against actual shows what changed.

## 2. Find the cause in zen

- Run `git -C ../zen status --short` and `git -C ../zen diff` to see uncommitted zen changes, and `git -C ../zen log -5 --stat` for recent commits.
- Match each visual change to the code change that explains it, usually CSS or JSX near the affected element.
- The same change often shows up in several projects. Judge it once and list where it appears.

## 3. Classify each change

- **Intended**: a code change explains it and the result looks deliberate and correct, such as a restyled button or new spacing.
- **Regression**: something looks broken or unintended. Examples are overlapping or clipped text, a missing element, wrong colours in one theme only, a layout that collapsed on mobile, or a change no code change explains.
- **Noise**: a tiny difference with no visible meaning, such as a one-pixel shift or anti-aliasing. Noise means the screenshot isn't deterministic, so name what varies.

Check both themes: a change that looks right in light mode can break contrast in dark mode.
When unsure between intended and regression, call it a regression and say why.

## 4. Report

One entry per distinct change:
- what changed, in one sentence
- the screenshots it affects, as project and name
- the verdict (intended, regression or noise), with the code change or reason behind it

End with one line of advice:
- all intended: run `make visual-update` to accept the new baselines.
- any regression: fix zen first, and don't update the baselines.
- any noise: make that screenshot deterministic in `visual/` before updating.
