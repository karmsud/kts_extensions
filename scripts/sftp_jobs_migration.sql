-- SFTP Jobs Database Migration
-- This script creates the necessary tables for SFTP job management

-- Create frp_sftp_jobs table
CREATE TABLE IF NOT EXISTS frp_sftp_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL UNIQUE,
    path VARCHAR(500) NOT NULL,
    servicer_id INT NULL,
    dsn VARCHAR(255) NULL,
    sme_emails TEXT NULL,
    save_location VARCHAR(500) NOT NULL,
    skip_list VARCHAR(500) NULL DEFAULT 'N:\\Automation\\BV_Script\\Settings\\SkipListOCW.txt',
    ignore_list VARCHAR(500) NULL DEFAULT 'N:\\Automation\\BV_Script\\Settings\\IgnoreListOCW.txt',
    zip_content_filter VARCHAR(255) NULL DEFAULT '.*',
    day_adjust INT NULL DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_job_name (job_name),
    INDEX idx_enabled (enabled),
    INDEX idx_servicer_id (servicer_id)
);

-- Create frp_sftp_job_parsers table
CREATE TABLE IF NOT EXISTS frp_sftp_job_parsers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sftp_job_id INT NOT NULL,
    parser_type ENUM('MoveFile', 'MoveFile2') NOT NULL DEFAULT 'MoveFile',
    parser_value VARCHAR(500) NOT NULL DEFAULT '.*',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sftp_job_id) REFERENCES frp_sftp_jobs(id) ON DELETE CASCADE,
    INDEX idx_sftp_job_id (sftp_job_id)
);

-- Create frp_sftp_job_templates table
CREATE TABLE IF NOT EXISTS frp_sftp_job_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sftp_job_id INT NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_value TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sftp_job_id) REFERENCES frp_sftp_jobs(id) ON DELETE CASCADE,
    INDEX idx_sftp_job_id (sftp_job_id),
    INDEX idx_template_name (template_name)
);

-- Insert some sample data for testing (optional)
INSERT IGNORE INTO frp_sftp_jobs (
    job_name, 
    path, 
    servicer_id, 
    dsn, 
    sme_emails, 
    save_location, 
    skip_list, 
    ignore_list, 
    zip_content_filter, 
    day_adjust, 
    enabled
) VALUES 
(
    'Ocwen_SFTP_Sample',
    'M:\\!Sweeps\\Ocwen\\In',
    150,
    'xf00.ocwen3.iman',
    'admin@example.com',
    'M:\\{DealFolder}\\Data\\{YYYY}\\{M}',
    'N:\\Automation\\BV_Script\\Settings\\SkipListOCW.txt',
    'N:\\Automation\\BV_Script\\Settings\\IgnoreListOCW.txt',
    '.*',
    0,
    TRUE
),
(
    'SPS_SFTP_Sample',
    'M:\\!Sweeps\\SPS\\In\\',
    3001,
    'xf00.sps2.iman',
    'user@example.com',
    'M:\\BATCH\\SPS\\{YYYY}\\{M}\\CF\\EmailExtract\\',
    'N:\\Automation\\BV_Script\\Settings\\SkipListOCW.txt',
    'N:\\Automation\\BV_Script\\Settings\\IgnoreListOCW.txt',
    '.*',
    -2,
    TRUE
);

-- Get the IDs of the sample jobs for inserting parsers and templates
SET @ocwen_job_id = (SELECT id FROM frp_sftp_jobs WHERE job_name = 'Ocwen_SFTP_Sample');
SET @sps_job_id = (SELECT id FROM frp_sftp_jobs WHERE job_name = 'SPS_SFTP_Sample');

-- Insert sample parsers
INSERT IGNORE INTO frp_sftp_job_parsers (sftp_job_id, parser_type, parser_value) VALUES
(@ocwen_job_id, 'MoveFile', '.*'),
(@sps_job_id, 'MoveFile', '.*'),
(@sps_job_id, 'MoveFile2', '.*\\.xlsx?$');

-- Insert sample templates
INSERT IGNORE INTO frp_sftp_job_templates (sftp_job_id, template_name, template_value) VALUES
(@ocwen_job_id, 'Main', 'Template content for Ocwen'),
(@sps_job_id, 'Main', 'Template content for SPS'),
(@sps_job_id, 'Secondary', 'Additional template for SPS');

-- Display created tables structure
SHOW CREATE TABLE frp_sftp_jobs;
SHOW CREATE TABLE frp_sftp_job_parsers;
SHOW CREATE TABLE frp_sftp_job_templates;

-- Display sample data
SELECT 'SFTP Jobs:' as table_name;
SELECT * FROM frp_sftp_jobs;

SELECT 'SFTP Job Parsers:' as table_name;
SELECT * FROM frp_sftp_job_parsers;

SELECT 'SFTP Job Templates:' as table_name;
SELECT * FROM frp_sftp_job_templates;
