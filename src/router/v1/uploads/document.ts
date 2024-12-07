import express from 'express';
import { IProtectedRequest } from 'app-request';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import schema from './_schema';
import authentication from '@core/auth/authentication';
import { sha1sum } from '@helpers/hash';
import multer from 'multer';
import path from 'path';
import { SuccessResponse } from '@core/ApiResponse';
import UserRepo from '@database/repository/UserRepo';
import { BadRequestError } from '@core/ApiError';
import validator, { ValidationSource } from '@helpers/validator';
import permissions from '@helpers/permissions';
import { PermissionCode } from '@common/Permission';
import authorization from '@core/auth/authorization';
import { pathCheck } from '@helpers/path';
import sharp from 'sharp';

const router = express.Router();

const uploadDir = path.join(__dirname, '../../../../private/documents/');

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
    fileSize: 4194304 * 2, // 8mb
  },
  fileFilter(req, file, cb) {
    checkPicType(file, cb);
  },
}).single('file');

router.post(
  '/:tag',
  permissions([PermissionCode.Booster]),
  pathCheck(uploadDir),
  authentication,
  authorization,
  validator(schema.tag, ValidationSource.PARAM),
  picUpload,
  asyncHandler(async (req: IProtectedRequest, res) => {
    if (req.file) {
      const { buffer, originalname } = req.file;
      const ref = `${req.user.username}_${req.params.tag}_${sha1sum(
        Date.now().toString(),
      )}.webp`;
      const filepath = uploadDir + ref;
      const dbpath = '/cdn/private/documents/' + ref;

      const user = await UserRepo.findById(req.user._id);

      if (!user) throw new BadRequestError(ApiMessage.UserNotFound);

      if (!user.documents || user.documents === undefined) user.documents = [];

      // to many documents
      if (user.documents.length >= 5)
        throw new BadRequestError(ApiMessage.SomethingWrong);

      user.documents.push(dbpath);
      await UserRepo.updateInfo(user);

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
