import express from 'express';
import schema from './_schema';
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
import validator, { ValidationSource } from '@helpers/validator';
import OrderRepo from '@database/repository/OrderRepo';
import { OrderState } from '@database/models/Order';
import { pathCheck } from '@helpers/path';
import sharp from 'sharp';

const router = express.Router();

const uploadDir = path.join(__dirname, '../../../../public/orders/');

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
  '/:order_num',
  permissions([PermissionCode.Booster, PermissionCode.EditOrders]),
  pathCheck(uploadDir),
  authentication,
  authorization,
  validator(schema.orderNum, ValidationSource.PARAM),
  picUpload,
  asyncHandler(async (req: IProtectedRequest, res) => {
    if (req.file) {
      const { buffer, originalname } = req.file;
      const ref = `${req.params.order_num}_${sha1sum(
        Date.now().toString(),
      )}.webp`;
      const filepath = uploadDir + ref;
      const dbpath = '/cdn/public/orders/' + ref;

      const order = await OrderRepo.findByNum(req.params.order_num as any);
      if (!order) throw new BadRequestError(ApiMessage.OrderNotFound);

      const availableStates = [
        OrderState.Boosting,
        OrderState.VerificationRequired,
        OrderState.Completed,
      ];

      if (!availableStates.includes(order.state))
        throw new BadRequestError(ApiMessage.OrderNotFound);

      if (!order.photos || order.photos === undefined) order.photos = [];

      // to many uploads
      if (order.photos.length >= 5)
        throw new BadRequestError(ApiMessage.SomethingWrong);

      order.photos.push(dbpath);
      await OrderRepo.updateInfo(order);

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
