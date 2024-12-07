import _ from 'lodash';
import express from 'express';
import schema from './_schema';
import bcrypt from 'bcrypt';
import { IProtectedRequest } from 'app-request';
import { SuccessResponse } from '@core/ApiResponse';
import asyncHandler from '@helpers/asyncHandler';
import authentication from '@core/auth/authentication';
import { ApiMessage } from '@common/ApiMessage';
import UserRepo from '@database/repository/UserRepo';
import { AuthFailureError, BadRequestError } from '@core/ApiError';
import validator from '@helpers/validator';
import permissions from '@helpers/permissions';
import authorization from '@core/auth/authorization';
import { PermissionCode } from '@common/Permission';
import KeystoreRepo from '@database/repository/KeystoreRepo';
import { IBoosterDetails } from '@database/models/references/user/BoosterDetails';
import RoleRepo from '@database/repository/RoleRepo';
import { IUserProfile } from '@database/models/references/user/UserProfile';
import IAuditLog, { LogScope } from '@database/models/AuditLog';
import AuditLogRepo from '@database/repository/AuditLogRepo';
import INotification from '@database/models/Notification';
import NotificationRepo from '@database/repository/NotificationRepo';
import { IServiceConfig } from '@database/models/references/user/ServiceConfig';
import { safeInt } from '@helpers/number';
import { convertCurrency } from '@helpers/currency';

const router = express.Router();

// boosters & users use this
router.post(
  '/info',
  authentication,
  validator(schema.updateProfile),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findProfileById(req.user._id);
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);

    const role = await RoleRepo.findById(user.role._id);

    // guest_ change username
    if (req.body.username && req.user.username.startsWith('guest_')) {
      const checkUsername = await UserRepo.findByUsername(req.body.username);
      if (checkUsername)
        throw new BadRequestError(ApiMessage.UsernameAlreadyExists);

      await AuditLogRepo.insert(
        `${user.username} -> ${req.body.username} (Username updated)`,
        LogScope.User,
        user,
      );

      user.username = req.body.username;

      await KeystoreRepo.removeAll(user);
    }

    // update email
    if (req.body.email) {
      const checkEmail = await UserRepo.findByEmail(req.body.email);
      if (checkEmail) throw new BadRequestError(ApiMessage.EmailAlreadyExists);

      await AuditLogRepo.insert(
        `${user.email} -> ${req.body.email} (Email updated)`,
        LogScope.User,
        user,
      );

      user.email = req.body.email;

      await KeystoreRepo.removeAll(user);
    }

    const isBooster = await UserRepo.isBooster(user);

    if (isBooster && user.boosterDetails) {
      if (req.body.assignable) {
        user.boosterDetails.assignable = true;
      } else {
        user.boosterDetails.assignable = false;
      }
      if (req.body.coachingPrice)
        user.boosterDetails.coachingPrice = safeInt(req.body.coachingPrice);
    }

    if (isBooster && user.profile) {
      if (req.body.profile) {
        // games are not editable by users
        user.profile.country = req.body.profile.country;
        user.profile.description = req.body.profile.description;
        user.profile.features = req.body.profile.features;
        user.profile.languages = req.body.profile.languages;
        user.profile.lolChampions = req.body.profile.lolChampions;
        user.profile.lolPrimaryLane = req.body.profile.lolPrimaryLane;
        user.profile.lolSecondaryLane = req.body.profile.lolSecondaryLane;
        user.profile.valAgents = req.body.profile.valAgents;
        user.profile.nameStyle = req.body.profile.nameStyle || 0;
      }
    }

    await UserRepo.updateInfo(user);

    return new SuccessResponse(
      ApiMessage.ProfileUpdated,
      user.boosterDetails
        ? {
            boosterDetails: {
              assignable: _.get(user, 'boosterDetails.assignable'),
              coachingPrice: _.get(user, 'boosterDetails.coachingPrice'),
            },
          }
        : {},
    ).send(res);
  }),
);

router.post(
  '/password',
  authentication,
  validator(schema.updatePassword),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(req.user._id);
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);

    const newPassword = await bcrypt.hash(req.body.newPassword, 10);

    const match = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!match) throw new AuthFailureError(ApiMessage.IncorrectOldPassword);

    user.password = newPassword;

    await KeystoreRepo.removeAll(user);
    await UserRepo.updateInfo(user);

    const log = {
      user: req.user,
      message: `Password updated successfully. IP: ${req.ipAddress}`,
      scope: LogScope.Auth,
    } as IAuditLog;

    await AuditLogRepo.create(log);

    const notification = {
      user: req.user,
      title: `Password updated successfully`,
      description: `Your password has been updated successfully. If this activity is not your own operation, please disable your account and contact us immediately. IP: ${req.ipAddress}`,
    } as INotification;

    await NotificationRepo.create(notification);

    return new SuccessResponse(ApiMessage.PasswordUpdated).send(res);
  }),
);

router.post(
  '/details',
  permissions([PermissionCode.EditUsers]),
  authentication,
  authorization,
  validator(schema.updateDetails),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(req.body.user);
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);

    if (req.body.username !== undefined) {
      const checkUsername = await UserRepo.findByUsername(req.body.username);
      if (checkUsername)
        throw new BadRequestError(ApiMessage.UsernameAlreadyExists);

      await AuditLogRepo.insert(
        `${user.username} -> ${req.body.username} (Username updated)`,
        LogScope.User,
        user,
      );

      user.username = req.body.username;
    }

    if (req.body.email !== undefined) {
      const checkEmail = await UserRepo.findByEmail(req.body.email);
      if (checkEmail) throw new BadRequestError(ApiMessage.EmailAlreadyExists);

      await AuditLogRepo.insert(
        `${user.email} -> ${req.body.email} (Email updated)`,
        LogScope.User,
        user,
      );

      user.email = req.body.email;
    }

    if (req.body.password !== undefined) {
      const newPassword = await bcrypt.hash(req.body.password, 10);
      user.password = newPassword;

      await KeystoreRepo.removeAll(user);
    }

    if (req.body.status !== undefined) {
      user.status = req.body.status;
    }

    if (req.body.profilePicture !== undefined) {
      user.profilePicture = req.body.profilePicture;
    }

    if (req.body.role !== undefined) {
      const myRole = await RoleRepo.findById(req.user.role._id);
      if (!myRole) throw new BadRequestError(ApiMessage.RoleNotFound);

      if (myRole._id.toString() === req.body.role)
        throw new BadRequestError(ApiMessage.AccessDenied);

      const role = await RoleRepo.findById(req.body.role);

      if (
        role &&
        role.permissions.includes(PermissionCode.FullAccess) &&
        !myRole.permissions.includes(PermissionCode.FullAccess)
      ) {
        throw new BadRequestError(ApiMessage.AccessDenied);
      }

      if (role) {
        await AuditLogRepo.insert(
          `Role updated to ${role?.code} by ${req.user.username}`,
          LogScope.User,
          user,
        );
        user.role = req.body.role;
        if (role.permissions.includes(PermissionCode.Booster)) {
          if (!user.boosterDetails) {
            user.boosterDetails = {
              vip: false,
              coach: false,
              coachingPrice: 0,
              assignable: true,
              soloClaimLimit: 0,
              duoClaimLimit: 0,
              services: [] as IServiceConfig[],
              adminNote: '',
            } as IBoosterDetails;
          }

          if (!user.profile) {
            user.profile = {
              country: '',
              features: [],
              description: '',
              games: [],
              languages: [],
              lolPrimaryLane: '',
              lolSecondaryLane: [],
              lolChampions: [],
              valAgents: [],
              nameStyle: 0,
            } as IUserProfile;
          }
        } else {
          delete user.boosterDetails;
          delete user.profile;
        }
      }
    }

    if (req.body.boosterDetails !== undefined) {
      const processed = {
        vip: req.body.boosterDetails.vip,
        coach: req.body.boosterDetails.coach,
        coachingPrice: safeInt(req.body.boosterDetails.coachingPrice),
        assignable: req.body.boosterDetails.assignable,
        soloClaimLimit: req.body.boosterDetails.soloClaimLimit,
        duoClaimLimit: req.body.boosterDetails.duoClaimLimit,
        services: req.body.boosterDetails.services,
        adminNote: req.body.boosterDetails.adminNote,
      } as IBoosterDetails;

      user.boosterDetails = processed;
    }

    if (req.body.profile !== undefined) {
      const processed = {
        country: req.body.profile.country,
        features: req.body.profile.features,
        description: req.body.profile.description,
        games: req.body.profile.games,
        languages: req.body.profile.languages,
        lolPrimaryLane: req.body.profile.lolPrimaryLane,
        lolSecondaryLane: req.body.profile.lolSecondaryLane,
        lolChampions: req.body.profile.lolChampions,
        valAgents: req.body.profile.valAgents,
        nameStyle: req.body.profile.nameStyle || 0,
      } as IUserProfile;

      user.profile = processed;
    }

    if (req.body.discordId) {
      user.discordId = req.body.discordId;
    }

    if (req.body.documents) {
      user.documents = req.body.documents;
    }

    await UserRepo.updateInfo(user);
    return new SuccessResponse(ApiMessage.UserUpdated).send(res);
  }),
);

router.put(
  '/balance',
  permissions([PermissionCode.EditUsers]),
  authentication,
  authorization,
  validator(schema.updateBalance),
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(req.body.user);
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);

    const safeAmount = safeInt(req.body.amount);
    const convert = await convertCurrency(safeAmount, req.currency);

    await UserRepo.updateBalance(
      req.body.type,
      user,
      convert,
      req.body.description,
      req.body.tag,
      req.user,
    );
    return new SuccessResponse(
      ApiMessage.BalanceUpdated,
      _.pick(user, ['balance']),
    ).send(res);
  }),
);

router.delete(
  '/picture',
  authentication,
  asyncHandler(async (req: IProtectedRequest, res) => {
    const user = await UserRepo.findById(req.user._id);
    if (!user) throw new BadRequestError(ApiMessage.UserNotFound);

    user.profilePicture = '/cdn/public/avatars/default.webp';

    await UserRepo.updateInfo(user);
    return new SuccessResponse(ApiMessage.ProfileUpdated).send(res);
  }),
);

router.post(
  '/commissions/bulk-adjust',
  authentication,
  asyncHandler(async (req: IProtectedRequest, res) => {
    const { adjustment, action } = req.body;

    const pathToCommission = 'boosterDetails.services.$[].commission';
    const updateOperator =
      action === 'increase'
        ? { $inc: { [pathToCommission]: adjustment } }
        : { $inc: { [pathToCommission]: -adjustment } };

    await UserRepo.updateMany(
      { 'boosterDetails.services': { $exists: true } },
      updateOperator,
    );

    res.status(200).send({
      message: 'Commissions adjusted for documents with services array',
    });
  }),
);

export default router;
