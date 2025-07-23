// Anubis Workflow Starter for Wall Go Project
const path = require('path');
const { AnubisWorkflow } = require('@hive-academy/anubis');

async function startWorkflow() {
  try {
    console.log('🚀 Starting Anubis Workflow for Wall Go Project');
    
    // Initialize Anubis with our configuration
    const workflow = new AnubisWorkflow({
      configPath: path.join(__dirname, '.anubis/config.yml'),
      rulesDirectory: path.join(__dirname, '.anubis/rules'),
      workflowFile: path.join(__dirname, '.anubis/workflows/main.yml')
    });

    // Load configuration and rules
    await workflow.init();
    console.log('✅ Configuration and rules loaded successfully');
    
    // Start development phase
    console.log('🔧 Starting development phase...');
    await workflow.executePhase('development');
    
    console.log('\n🎉 Workflow completed successfully!');
    console.log('Next steps:');
    console.log('1. Review the workflow results in anubis.log');
    console.log('2. Commit changes to your repository');
    console.log('3. Run production phase with: npm run anubis-prod');
    
  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
    process.exit(1);
  }
}

// Start the workflow
startWorkflow();