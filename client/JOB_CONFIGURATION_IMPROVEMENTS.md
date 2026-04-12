# Job Configuration Modal Improvements

## Overview
The Job Configuration modal has been completely enhanced with better usability, clearer terminology, and comprehensive help tooltips.

## ✅ Key Improvements Made

### 1. **Replaced Outdated Terminology**
- ❌ "Detach File Pattern" → ✅ "File Extraction Pattern"
- ❌ "Save Location" → ✅ "File Storage Location"
- ❌ "Soft Save" → ✅ "Save Configuration" / "Create Job"
- ❌ "Queue One File Only" → ✅ "Process One File Only"
- ❌ "Unzip Files After Saving" → ✅ "Extract ZIP Files After Processing"

### 2. **Removed Redundant Fields**
- **Removed:** "Detach File by Subject Pattern" from File Parsing section
- **Reason:** This functionality is now covered by the Subject Filter in Email Filters section

### 3. **Improved Deal Matching Logic**
- **Moved** search options from "File Parsing & Processing" to "Email Filters"
- **Changed** from checkboxes to radio buttons (mutually exclusive selection)
- **Options:**
  - 🔘 Search by Email Subject
  - 🔘 Search by Filename
- **Default:** Subject search for new jobs

### 4. **Added Comprehensive Help Tooltips**
Every field now includes a help icon (ℹ️) with detailed tooltips containing:
- **Clear explanation** of what the field does
- **Practical examples** showing valid input formats
- **Best practices** for configuration

### 5. **Enhanced User Experience**
- **Theme-aware styling** that adapts to your selected theme
- **Better visual hierarchy** with improved section layouts
- **Clearer field labels** and descriptions
- **Improved button styling** and states
- **Better feedback** for unsaved changes

## 📋 Field-by-Field Help Guide

### Basic Configuration
| Field | Purpose | Examples |
|-------|---------|----------|
| **Mailbox** | Email address to monitor | `reports@example.com`, `deals@company.com` |
| **Folder** | Email folder to watch | `Inbox`, `Mid Monthly`, `Processing` |
| **SME Emails** | Notification recipients | `john@company.com,jane@company.com` |
| **File Storage Location** | Where files are saved | `S:\Deals\COOF Information\...` |
| **Servicer ID** | Optional servicer identifier | `123`, `456` |
| **Priority Level** | Processing priority (1-10) | `1` (highest), `5` (normal), `10` (lowest) |

### Email Filters
| Field | Purpose | Examples |
|-------|---------|----------|
| **From Filter** | Sender email/domain filter | `@sba.gov`, `fta@sba.gov` |
| **Attachments Filter** | Attachment requirements | `True`, `False`, `*.pdf` |
| **Subject Filter** | Subject line patterns | `Deal Update`, `COOF.*Information` |
| **Deal Matching Method** | How to match emails to deals | Subject keywords vs. filename patterns |

### File Processing & Extraction
| Field | Purpose | Examples |
|-------|---------|----------|
| **File Extraction Pattern** | Which files to extract | `.*`, `*.pdf`, `Report*.pdf` |
| **Ignore Files Pattern** | Files to skip | `*.tmp`, `*.log` |
| **Focus Files Pattern** | Only process these files | `Data*.xlsx`, `Final*.*` |
| **Extract ZIP Files** | Auto-extract archives | Checkbox option |

### Advanced Options
| Field | Purpose | Examples |
|-------|---------|----------|
| **Server Side Processing** | Process on server | Checkbox option |
| **Process One File Only** | Limit to one file per email | Checkbox option |
| **Main Template** | Primary processing workflow | `QueueCMBS_Scrubber_x` |


## 🎯 Best Practices

### For Email Filtering
- Use **specific sender filters** to avoid processing unwanted emails
- Set **clear subject patterns** that match your expected email formats
- Choose the appropriate **deal matching method** based on your workflow

### For File Processing
- Use `.*` for **all files** or specific patterns like `*.pdf` for **file type filtering**
- Set **ignore patterns** for temporary or system files you don't want to process
- Use **focus patterns** when you only want specific files from emails with multiple attachments

### For Templates
- Choose templates that match your **processing requirements**
- Use **main templates** for primary processing workflows

## 🚀 How to Use

1. **Click "Add New Job"** or **"Configure"** on existing jobs
2. **Fill in basic configuration** (mailbox, folder, storage location)
3. **Set email filters** to target the right emails
4. **Choose deal matching method** (subject or filename)
5. **Configure file processing** patterns as needed
6. **Set advanced options** if required
7. **Click "Create Job"** or **"Save Configuration"**

## 💡 Tips
- **Hover over any help icon** to see detailed explanations and examples
- **Use the theme selector** in Settings to customize the modal appearance
- **Test your patterns** with sample emails before deploying
- **Start simple** and add complexity as needed 
