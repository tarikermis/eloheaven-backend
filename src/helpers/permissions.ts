import { IRoleRequest } from 'app-request';
import { PermissionCode } from '@common/Permission';
import { Response, NextFunction } from 'express';

export default (permissions: PermissionCode[]) =>
  (req: IRoleRequest, res: Response, next: NextFunction) => {
    req.requiredPermissions = permissions;

    // Include FullAccess permission
    req.requiredPermissions.push(PermissionCode.FullAccess);
    next();
  };
