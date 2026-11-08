const { execSync } = require('child_process');

function getDeployments() {
  const stdout = execSync('vercel ls --limit 100 --format json', { encoding: 'utf8' });
  const data = JSON.parse(stdout);
  return data.deployments || [];
}

function runPrune(dryRun = false) {
  const deployments = getDeployments();
  console.log(`Found ${deployments.length} total deployments in account.\n`);

  const prodDeployments = deployments
    .filter(d => d.target === 'production')
    .sort((a, b) => b.createdAt - a.createdAt);

  const previewDeployments = deployments
    .filter(d => d.target !== 'production')
    .sort((a, b) => b.createdAt - a.createdAt);

  // Keep latest 2 production deployments (active live site + 1 rollback version)
  const keepProd = prodDeployments.slice(0, 2);
  const deleteProd = prodDeployments.slice(2);
  const deletePreview = previewDeployments;

  console.log('=== PROTECTED / KEPT DEPLOYMENTS ===');
  keepProd.forEach(d => {
    console.log(`  [PRODUCTION] ${d.url} (Created: ${new Date(d.createdAt).toISOString()})`);
  });

  const targetsToDelete = [...deletePreview, ...deleteProd];
  console.log(`\n=== DEPLOYMENTS TO REMOVE (${targetsToDelete.length}) ===`);
  targetsToDelete.forEach(d => {
    console.log(`  [${d.target || 'preview'}] ${d.url} (${new Date(d.createdAt).toISOString()})`);
  });

  if (targetsToDelete.length === 0) {
    console.log('\nNo stale deployments to clean up. Storage is optimal!');
    return;
  }

  if (dryRun) {
    console.log('\nDry run completed. Run without --dry-run to delete.');
    return;
  }

  console.log(`\nDeleting ${targetsToDelete.length} stale deployments in batches...`);
  const batchSize = 5;
  for (let i = 0; i < targetsToDelete.length; i += batchSize) {
    const chunk = targetsToDelete.slice(i, i + batchSize);
    const urls = chunk.map(d => d.url).join(' ');
    console.log(`Deleting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(targetsToDelete.length / batchSize)}...`);
    try {
      execSync(`vercel rm ${urls} --yes`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`Error deleting batch: ${err.message}`);
    }
  }

  console.log('\nDeployment cleanup complete! Successfully pruned stale deployments.');
}

const isDryRun = process.argv.includes('--dry-run');
runPrune(isDryRun);
