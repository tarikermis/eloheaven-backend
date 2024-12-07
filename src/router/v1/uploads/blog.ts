import express from 'express';
import { IProtectedRequest } from 'app-request';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import authentication from '@core/auth/authentication';
import { sha1sum } from '@helpers/hash';
import multer from 'multer';
import path from 'path';
import { SuccessResponse } from '@core/ApiResponse';
import { BadRequestError } from '@core/ApiError';
import permissions from '@helpers/permissions';
import authorization from '@core/auth/authorization';
import { PermissionCode } from '@common/Permission';
import { pathCheck } from '@helpers/path';
import sharp from 'sharp';

const router = express.Router();

const uploadDir = path.join(__dirname, '../../../../public/blogs/');

// storage
const storage = multer.memoryStorage();

// Check pictures type
const checkPicType = (file: any, cb: any) => {
  const pictypes = /jpeg|jpg|png|gif|webp/;
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
    fileSize: 8388608 * 2, // 16mb
  },
  fileFilter(req, file, cb) {
    checkPicType(file, cb);
  },
}).single('file');

router.post(
  '/',
  permissions([PermissionCode.EditPosts]),
  pathCheck(uploadDir),
  authentication,
  authorization,
  picUpload,
  asyncHandler(async (req: IProtectedRequest, res) => {
    if (req.file) {
      const { buffer, originalname } = req.file;
      const ref = `${sha1sum(Date.now().toString())}.webp`;
      const filepath = uploadDir + ref;
      const dbpath = '/cdn/public/blogs/' + ref;

      await sharp(buffer).webp({ quality: 95 }).toFile(filepath);

      return new SuccessResponse(ApiMessage.UploadSuccess, {
        path: dbpath,
      }).send(res);
    } else {
      throw new BadRequestError(ApiMessage.NoFilesUploaded);
    }
  }),
);

export default router;
