# Anubis Workflow Guide for Wall Go

## Quick Start

The Anubis workflow system has been initialized for the Wall Go project. Here's how to use it:

### Running the Workflow

```bash
# Start the development workflow
npm run workflow

# Or run directly
node start-anubis-workflow.js
```

### Workflow Structure

- **Development Phase**: Code analysis and testing
- **Production Phase**: Build and deployment preparation

### Configuration Files

- `.anubis/config.yml` - Main configuration
- `.anubis/workflows/main.yml` - Workflow definitions
- `.anubis/rules/default.yml` - Code quality rules

### Available Rules

1. **Style Guide Enforcement** - Ensures consistent code style
2. **No Console Statements** - Prevents console.log in production code
3. **Error Handling** - Validates proper error handling patterns

### Customization

To add new rules:
1. Edit `.anubis/rules/default.yml`
2. Add rule patterns and messages
3. Restart the workflow

### Troubleshooting

If you encounter issues:
1. Check `anubis.log` for detailed logs
2. Verify configuration syntax
3. Ensure all dependencies are installed