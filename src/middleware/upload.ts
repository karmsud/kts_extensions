import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.ensureDirSync(uploadsDir);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Use timestamp to ensure unique filenames
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'xmlFile') {
    if (ext === '.ps1' || ext === '.xml') {
      cb(null, true);
    } else {
      cb(new Error('Only .ps1 and .xml files are allowed for job imports'));
    }
  } else if (file.fieldname === 'csvFile') {
    if (ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are allowed for deal imports'));
    }
  } else {
    cb(new Error('Invalid field name'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export const uploadXML = upload.single('xmlFile');
export const uploadCSV = upload.single('csvFile');

// Export the main upload instance for general use
export { upload }; 