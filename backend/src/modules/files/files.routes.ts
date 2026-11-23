import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { filesController } from './files.controller';
import { requireAuth } from '../../middleware/auth';
import { csrfProtection } from '../../middleware/csrf';
import { BadRequestError } from '../../utils/errors';
import { env } from '../../config/env';

export const filesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES, // 5MB
  },
});

function handleMulterUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new BadRequestError(
            `File size exceeds maximum permitted limit of ${env.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
            undefined,
            'FILE_TOO_LARGE'
          )
        );
      }
      return next(new BadRequestError(err.message));
    }
    next();
  });
}

// Upload resume: PDF only, max 5MB, magic byte validated
filesRouter.post(
  '/resume',
  requireAuth,
  csrfProtection,
  handleMulterUpload,
  filesController.uploadResume
);

// Stream file with strict authorization
filesRouter.get('/:id', requireAuth, filesController.getFile);

// Get presigned URL for direct object download (S3/R2)
filesRouter.get('/:id/url', requireAuth, filesController.getPresignedUrl);

// Delete file
filesRouter.delete('/:id', requireAuth, csrfProtection, filesController.deleteFile);
