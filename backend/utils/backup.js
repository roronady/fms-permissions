import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/wms.db');
const backupDir = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

export const createBackup = () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `wms_backup_${timestamp}.db`);
    
    fs.copyFileSync(dbPath, backupPath);
    
    console.log(`Backup created: ${backupPath}`);
    
    // Clean old backups (keep last 10)
    cleanOldBackups();
    
    return backupPath;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

export const cleanOldBackups = () => {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('wms_backup_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    // Keep only the 10 most recent backups
    if (files.length > 10) {
      files.slice(10).forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`Deleted old backup: ${file.name}`);
      });
    }
  } catch (error) {
    console.error('Error cleaning old backups:', error);
  }
};

export const startBackupScheduler = () => {
  // Create initial backup
  createBackup();
  
  // Schedule backups every 6 hours
  setInterval(() => {
    createBackup();
  }, 6 * 60 * 60 * 1000);
  
  console.log('Backup scheduler started (every 6 hours)');
};

export const restoreBackup = (backupPath) => {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }
    
    // Create a backup of current database before restore
    const currentBackupPath = createBackup();
    console.log(`Current database backed up to: ${currentBackupPath}`);
    
    // Restore from backup
    fs.copyFileSync(backupPath, dbPath);
    
    console.log(`Database restored from: ${backupPath}`);
    return true;
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
};