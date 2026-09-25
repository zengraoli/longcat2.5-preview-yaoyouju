export class AdminLoginDto {
  username: string;
  password: string;
  totp: string;
}

export class CreateAdminUserDto {
  name: string;
  roleId: string;
  password: string;
}

export class GrantPermissionDto {
  adminUserId: string;
  permission: string;
  granteeId: string;
}

export class DualConfirmDto {
  action: string;
  targetId: string;
  primaryApproverId: string;
  secondaryApproverId: string;
}
