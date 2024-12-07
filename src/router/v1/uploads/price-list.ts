import express from 'express';
import schema from './_schema';
import { IProtectedRequest, IRoleRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import { ApiMessage } from '@common/ApiMessage';
import permissions from '@helpers/permissions';
import authorization from '@core/auth/authorization';
import authentication from '@core/auth/authentication';
import ServiceRepo from '@database/repository/ServiceRepo';
import { readFileSync } from 'fs';
import validator, { ValidationSource } from '@helpers/validator';
import { BadRequestError } from '@core/ApiError';
import multer from 'multer';
import path from 'path';
import { pathCheck } from '@helpers/path';

const router = express.Router();

const uploadDir = path.join(__dirname, '../../../../private/prices/');

// storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: (req: IProtectedRequest, file, cb) => {
    const name = `${req.user.username}_${Date.now().toString()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${name}${ext}`);
  },
});

// Check price list type
const checkListType = (file: any, cb: any) => {
  const listregex = /tsv/;
  const extname = listregex.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  }
  return cb(new BadRequestError(ApiMessage.BadFileExtension));
};

// Price list upload options
const uploadMid = multer({
  storage,
  limits: {
    fields: 1,
    fieldNameSize: 256,
    fileSize: 4194304, // 4mb
  },
  fileFilter(req, file, cb) {
    checkListType(file, cb);
  },
}).single('file');

router.post(
  '/:service',
  permissions([]),
  pathCheck(uploadDir),
  authentication,
  authorization,
  uploadMid,
  validator(schema.priceList, ValidationSource.PARAM),
  asyncHandler(async (req: IRoleRequest, res) => {
    if (req.file) {
      const filename = uploadDir + req.file.filename;
      const raw = readFileSync(filename, 'utf8');
      const split = raw.split('\n');
      const table = split.map((line) => line.replace('\r', '').split('\t'));

      const service = await ServiceRepo.find(req.params.service);

      if (!service) {
        await ServiceRepo.create(req.params.service, table);
      } else {
        service.data = table;
        await ServiceRepo.update(service);
      }

      return new SuccessResponse(ApiMessage.UploadSuccess, {
        path: filename,
      }).send(res);
    } else {
      throw new BadRequestError(ApiMessage.NoFilesUploaded);
    }
  }),
);

export default router;
