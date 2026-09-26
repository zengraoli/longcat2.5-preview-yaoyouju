import { Body, Controller, Get, Headers, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto, CreateAdminUserDto, DualConfirmDto } from './dto/admin.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  @Get('dashboard')
  @UseGuards(AdminAuthGuard)
  dashboard() {
    return this.adminService.getDashboard();
  }

  @Get('eval-sets')
  @UseGuards(AdminAuthGuard)
  evalSets() {
    return this.adminService.getEvalSets();
  }

  @Get('eval-runs')
  @UseGuards(AdminAuthGuard)
  evalRuns() {
    return this.adminService.getEvalRuns();
  }

  @Get('users')
  getUsers(@Headers('x-admin-token') token: string) {
    const session = this.adminService.validateSession(token);
    if (!session) throw new UnauthorizedException('未登录');
    this.adminService.requirePermission(session.roleId, '*');
    return this.adminService.getAdminUsers();
  }

  @Post('users')
  createUser(@Headers('x-admin-token') token: string, @Body() dto: CreateAdminUserDto) {
    const session = this.adminService.validateSession(token);
    if (!session) throw new UnauthorizedException('未登录');
    if (!this.adminService.checkPermission(session.roleId, '*')) throw new Error('无权限');
    const result = this.adminService.createAdminUser(dto);
    this.adminService.logAudit(session.adminUserId, 'admin.user.created', result.id, JSON.stringify(dto));
    return result;
  }

  @Get('roles')
  @UseGuards(AdminAuthGuard)
  roles() {
    return this.adminService.getRoles();
  }

  @Get('audit-logs')
  @UseGuards(AdminAuthGuard)
  auditLogs(@Req() req: any) {
    this.adminService.requirePermission(req.admin.roleId, 'audit:view');
    return this.adminService.getAuditLogs();
  }

  @Get('safety-events')
  @UseGuards(AdminAuthGuard)
  safetyEvents() {
    return this.adminService.getSafetyEvents();
  }

  @Get('case-submissions')
  @UseGuards(AdminAuthGuard)
  caseSubmissions() {
    return this.adminService.getCaseSubmissions();
  }

  @Get('audit/verify')
  verifyAudit(@Headers('x-admin-token') token: string) {
    const session = this.adminService.validateSession(token);
    if (!session) throw new UnauthorizedException('未登录');
    this.adminService.requirePermission(session.roleId, 'audit:view');
    return this.adminService.verifyAuditChain();
  }

  @Post('dual-confirm')
  dualConfirm(@Headers('x-admin-token') token: string, @Body() dto: DualConfirmDto) {
    const session = this.adminService.validateSession(token);
    if (!session) throw new UnauthorizedException('未登录');
    if (dto.primaryApproverId === dto.secondaryApproverId) {
      throw new Error('双人确认需不同审批人');
    }
    this.adminService.logAudit(session.adminUserId, 'dual_confirm.executed', dto.targetId, JSON.stringify(dto));
    return { confirmed: true };
  }
}
