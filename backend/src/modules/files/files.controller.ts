import { Request, Response, NextFunction } from 'express';
import { filesService } from './files.service';
import { uploadFileQuerySchema } from './files.schemas';

export class FilesController {
  async uploadResume(req: Request, res: Response, next: NextFunction) {
    try {
      const query = uploadFileQuerySchema.parse(req.query);
      const result = await filesService.uploadResume(req.user!, req.file, query.setAsDefaultResume);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getFile(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = req.params.id as string;
      const { stream, originalName, sizeBytes, mimeType } = await filesService.getFileForStreaming(
        fileId,
        req.user!
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', sizeBytes);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = req.params.id as string;
      const result = await filesService.deleteFile(fileId, req.user!);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const filesController = new FilesController();
