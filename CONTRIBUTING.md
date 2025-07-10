# Contributing

This project is designed to serve veterans and their families. Contributions that improve accessibility, add new transportation options, or enhance the user experience are especially welcome. There is [a to-do list here](TODO.md)

## Contributing Workflow

### Pull Request Process
1. **Create Feature Branch**: Always branch from `main`
2. **Make Changes**: Implement your feature or fix
3. **Test Locally**: Run `npm test` to ensure tests pass
4. **Push Branch**: Push your feature branch to GitHub
5. **Create PR**: Open a Pull Request to `main` branch
6. **Wait for CI**: Automated tests must pass
7. **Request Review**: At least one approval required
8. **Merge**: Only merge after approval and passing tests

### Branch Protection
- Direct pushes to `main` are blocked
- All changes must go through Pull Requests
- CI tests must pass before merging
- At least one code review approval required
- Stale approvals dismissed when new commits pushed

### CI Pipeline
- **Feature Branches**: Quick tests run automatically
- **Pull Requests**: Full CI pipeline with LLM tests
- **Main Branch**: Complete test suite and deployment checks