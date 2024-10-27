# Contributing to Shepherd

Thank you for considering contributing to Shepherd! By contributing, you help improve the tool for everyone. Here are some guidelines to help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Contributing Code](#contributing-code)
- [Development Setup](#development-setup)
- [Running e2e Tests](#running-e2e-tests)
- [Style Guide](#style-guide)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue and include the following:

- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots or logs if applicable

### Suggesting Enhancements

Enhancements are welcome! To suggest an enhancement:

- Check if the enhancement is already reported by searching the issues.
- Open an issue and describe:
  - The current state and the enhancement you suggest.
  - Why you think this enhancement would be useful.

### Contributing Code

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## Development Setup

To set up the project for development:

1. Clone your forked repository:

   ```sh
   git clone https://github.com/<your-username>/shepherd.git
   cd shepherd
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Run tests:
   ```sh
   npm run test
   ```

To incrementally compile the source code while developing, run:
`sh
    npm run build:watch
    `

## Running e2e Tests

To ensure the robustness of your contributions, end-to-end (e2e) tests are crucial. Here's how to run e2e tests in the Shepherd project:

1. Run the e2e tests:
   ```sh
   npm run e2e-test
   ```

This command builds the project and runs the e2e tests. Ensure all e2e tests pass before finalizing your pull request. If you add new features, consider adding corresponding e2e tests.

## Style Guide

Follow the code style defined by the project:

- Use [ESLint](https://eslint.org/) for linting. Run `npm run lint` to check for linting errors.
- Run `npm run fix-lint` to automatically fix linting issues.

## Pull Request Process

1. Ensure your changes pass all tests and lint checks.
2. Write a clear and descriptive title and description for your pull request.
3. Link to any relevant issues.
4. Wait for the maintainers to review your pull request. They may suggest changes.
5. Make requested changes and update the pull request.

Thank you for contributing to Shepherd!
