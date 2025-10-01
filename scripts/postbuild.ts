import { readJsonSync } from "fs-extra";
import path from "path";
import { cwd } from "process";
import os from 'os';
import wget from 'node-wget';
import { extract } from 'tar';
import fs from 'fs';
import { execSync } from 'child_process';

const version = readJsonSync(path.join(cwd(), 'package.json'))?.dependencies?.frida?.replace('^', '');
if(!version) console.log('Frida version not found in package.json');
else {
  const osName = os.platform();
  const arch = os.arch();
  const electronVersion = '125';
  const tail = compareVersion(version, '16.7.15') >= 0 ?
    `napi-v8-${osName}-${arch}.tar.gz` :
    `electron-v${electronVersion}-${osName}-${arch}.tar.gz`
  const url = `https://github.com/frida/frida/releases/download/${version}/frida-v${version}-${tail}`;
  const downloadPath = path.join(__dirname, '../', `frida-v${version}-${tail}`);
  const extractPath = path.join(__dirname, '../', 'build');
  const targetPath = path.join(__dirname, '../', 'node_modules', 'frida', 'build');
  downloadAndInstall(url, downloadPath, extractPath, targetPath, osName);
}


function compareVersion(v1: string, v2: string) {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
  }
  return 0;
}

async function downloadAndInstall(
  url: string,
  downloadPath: string,
  extractPath: string,
  targetPath: string,
  osName: string,
) {
  try {
    // Download the file
    console.log('Downloading Frida binding...');
    await new Promise<void>((resolve, reject) => {
      (wget as unknown as any)({
        url: url,
        dest: downloadPath
      }, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if(!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath);
    }

    // Extract the tar.gz file
    console.log('Extracting archive...');
    osName.includes('linux') ? 
      execSync(`tar -xvf ${downloadPath}`) : 
      await extract({
        file: downloadPath,
        cwd: extractPath,
        strip: 1
      });

    // Move frida_binding.node to target location
    console.log('Installing binding...');
    const bindingPath = path.join(extractPath, 'frida_binding.node');
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
    }
    fs.copyFileSync(bindingPath, path.join(targetPath, 'frida_binding.node'));

    // Clean up
    console.log('Cleaning up...');
    fs.unlinkSync(downloadPath);
    fs.unlinkSync(bindingPath);

    console.log('Installation completed successfully!');
  } catch (error) {
    console.error('Error during installation:', error);
    process.exit(1);
  }
}