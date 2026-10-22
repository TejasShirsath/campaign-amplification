import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { optionalAuth } from '../../middleware/auth.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const router = Router();

// Ensure upload directory exists - use /tmp on Vercel / serverless environments (read-only filesystem)
export const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.resolve(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('⚠️ Unable to create upload directory:', err);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `img-${uniqueSuffix}${ext.toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
    }
  },
});

// Middleware to accept either 'file' or 'image' field for multipart
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  const handler = upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]);

  handler(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 400, 'FILE_TOO_LARGE', 'Image must be smaller than 15MB');
        }
        return sendError(res, 400, 'UPLOAD_ERROR', err.message);
      }
      return sendError(res, 400, 'INVALID_FILE', err.message || 'File upload failed');
    }
    next();
  });
};

/**
 * POST /api/v1/uploads
 * Accepts multipart/form-data (field 'file' or 'image') OR JSON base64 { image: "data:image/...;base64,..." }
 */
router.post(
  '/',
  optionalAuth,
  uploadMiddleware,
  async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const uploadedFile = files?.file?.[0] || files?.image?.[0];

    const host = req.get('host') || 'localhost:5000';
    const forwardedProto = req.headers['x-forwarded-proto'] as string | undefined;
    const isHttps =
      req.secure ||
      forwardedProto === 'https' ||
      host.includes('vercel.app') ||
      (!host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('10.0.2.2'));
    const protocol = isHttps ? 'https' : (req.protocol || 'http');

    // 1. Handled by Multer multipart
    if (uploadedFile) {
      const fileUrl = `${protocol}://${host}/uploads/${uploadedFile.filename}`;
      return sendSuccess(res, {
        url: fileUrl,
        filename: uploadedFile.filename,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype,
      });
    }

    // 2. Handled via Base64 in JSON payload
    const base64Data = req.body?.image || req.body?.file || req.body?.base64;
    if (base64Data && typeof base64Data === 'string') {
      try {
        let cleanBase64 = base64Data;
        let ext = '.jpg';
        let mimetype = 'image/jpeg';

        // Check data URI pattern
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches) {
          mimetype = matches[1];
          cleanBase64 = matches[2];
          if (mimetype.includes('png')) ext = '.png';
          else if (mimetype.includes('webp')) ext = '.webp';
          else if (mimetype.includes('gif')) ext = '.gif';
        }

        const buffer = Buffer.from(cleanBase64, 'base64');
        const filename = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(uploadDir, filename);

        await fs.promises.writeFile(filePath, buffer);

        const fileUrl = `${protocol}://${host}/uploads/${filename}`;
        return sendSuccess(res, {
          url: fileUrl,
          filename,
          size: buffer.length,
          mimetype,
        });
      } catch (err: any) {
        return sendError(res, 400, 'INVALID_BASE64', 'Failed to process base64 image data');
      }
    }

    return sendError(
      res,
      400,
      'NO_FILE_PROVIDED',
      'Please provide an image file via multipart form or base64'
    );
  }
);

export default router;
