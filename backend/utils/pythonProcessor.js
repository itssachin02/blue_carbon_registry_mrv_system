const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Execute MRV Python processor with dataset
 * @param {string} projectId - Project ID
 * @param {Array} dataRows - Array of data rows to process
 * @returns {Promise} - Promise resolving to MRV processing results
 */
async function runMRVProcessor(projectId, dataRows) {
  return new Promise((resolve, reject) => {
    try {
      // Create temporary JSON file with data
      const tmpDir = os.tmpdir();
      const tempFile = path.join(tmpDir, `mrv_data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`);
      
      fs.writeFileSync(tempFile, JSON.stringify(dataRows), 'utf-8');

      // Python script path
      const pythonScript = path.join(__dirname, '../python/mrv_processor.py');

      // Check if Python exists
      const python = process.platform === 'win32' ? 'python' : 'python3';

      // Spawn Python process
      const pythonProcess = spawn(python, [pythonScript, projectId, tempFile], {
        cwd: path.join(__dirname, '../python'),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      // Collect stdout data
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Collect stderr data
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`[MRV Processor Error]: ${data.toString()}`);
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          console.error('Failed to delete temp file:', e);
        }

        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (!result.success) {
            reject(new Error(result.error || 'Python processor failed without error message'));
            return;
          }
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${e.message}. Output: ${stdout}`));
        }
      });

      // Handle process errors
      pythonProcess.on('error', (err) => {
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          // ignore
        }
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });
    } catch (error) {
      reject(new Error(`Python processor setup failed: ${error.message}`));
    }
  });
}

module.exports = {
  runMRVProcessor,
};
