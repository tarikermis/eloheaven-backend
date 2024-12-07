import express from 'express';
import { IProtectedRequest } from 'app-request';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import authentication from '@core/auth/authentication';
import { unlink } from 'fs';
import { sha1sum } from '@helpers/hash';
import multer from 'multer';
import path from 'path';
import { SuccessResponse } from '@core/ApiResponse';
import UserRepo from '@database/repository/UserRepo';
import { BadRequestError } from '@core/ApiError';
import sharp from 'sharp';
import { pathCheck } from '@helpers/path';

const router = express.Router();

const uploadDir = path.join(__dirname, '../../../../public/avatars/');

// storage
const storage = multer.memoryStorage();

// Check pictures type
const checkPicType = (file: any, cb: any) => {
  const pictypes = /jpeg|jpg|png|webp/;
  const extname = pictypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = pictypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  return cb(new BadRequestError(ApiMessage.BadFileExtension));
};

// Picture upload options
const picUpload = multer({
  storage,
  limits: {
    fields: 1,
    fieldNameSize: 256,
    fileSize: 4194304 * 2, // 8mb
  },
  fileFilter(req, file, cb) {
    checkPicType(file, cb);
  },
}).single('file');

router.post(
  '/',
  pathCheck(uploadDir),
  authentication,
  picUpload,
  asyncHandler(async (req: IProtectedRequest, res) => {
    if (req.file) {
      const { buffer, originalname } = req.file;

      const ref = `${req.user.username}_${sha1sum(Date.now().toString())}.webp`;
      const filepath = uploadDir + ref;
      const dbpath = '/cdn/public/avatars/' + ref;

      const parts = req.user.profilePicture.split('/');
      const fname = parts[parts.length - 1];

      // remove old image
      if (fname.indexOf('default.webp') === -1) {
        unlink(uploadDir + fname, () => {
          return;
        });
      }

      req.user.profilePicture = dbpath;
      await UserRepo.updateInfo(req.user);

      await sharp(buffer)
        .resize({ width: 512, height: 512 })
        .webp({ quality: 75 })
        .toFile(filepath);

      return new SuccessResponse(ApiMessage.UploadSuccess, {
        path: dbpath,
      }).send(res);
    } else {
      throw new BadRequestError(ApiMessage.NoFilesUploaded);
    }
  }),
);

export default router;
