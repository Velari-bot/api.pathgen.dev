import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for replays
    },
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.replay')) {
            cb(null, true);
        } else {
            cb(new Error('Only .replay files are allowed'));
        }
    }
});
