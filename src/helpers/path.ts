import { existsSync, mkdirSync } from 'fs';

export const pathCheck =
  (uploadDir: string) => (req: any, res: any, next: any) => {
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    return next();
  };
