import { HttpException, HttpStatus } from '@nestjs/common';

/** 业务异常：携带业务错误码（见 server/docs/errors.md） */
export class BusinessException extends HttpException {
  readonly businessCode: number;

  constructor(businessCode: number, message: string, httpStatus?: HttpStatus) {
    super(message, httpStatus ?? HttpStatus.BAD_REQUEST);
    this.businessCode = businessCode;
  }
}

export const ERR = {
  PARAM_INVALID: (msg = '参数校验失败') => new BusinessException(1001, msg),
  UNAUTHORIZED: (msg = '未登录或会话已过期') => new BusinessException(1002, msg, HttpStatus.UNAUTHORIZED),
  FORBIDDEN: (msg = '无权限') => new BusinessException(1003, msg, HttpStatus.FORBIDDEN),
  NOT_FOUND: (msg = '资源不存在') => new BusinessException(1004, msg, HttpStatus.NOT_FOUND),
  CONFLICT: (msg = '状态冲突') => new BusinessException(1005, msg, HttpStatus.CONFLICT),
  LOCKED: (msg = '账号已锁定') => new BusinessException(1006, msg, HttpStatus.LOCKED),
  RATE_LIMIT: (msg = '请求过于频繁') => new BusinessException(1007, msg, HttpStatus.TOO_MANY_REQUESTS),
  SMS_CODE: (msg = '验证码错误') => new BusinessException(2001, msg),
  CONSENT_MISSING: (msg = '未同意健康信息处理') => new BusinessException(2002, msg, HttpStatus.FORBIDDEN),
  ADMIN_CREDENTIALS: (msg = '账号或密码错误') => new BusinessException(2003, msg, HttpStatus.UNAUTHORIZED),
  ADMIN_MFA: (msg = 'MFA 验证码错误') => new BusinessException(2004, msg, HttpStatus.UNAUTHORIZED),
  DUAL_CONFIRM: (msg = '双人确认未通过') => new BusinessException(2005, msg),
  RED_FLAG: (msg = '命中红旗信号') => new BusinessException(3001, msg),
  OUT_OF_SCOPE: (msg = '停止个性化分析') => new BusinessException(3002, msg),
  SWITCH_OFF: (msg = '功能开关关闭') => new BusinessException(3003, msg),
  EVAL_BLOCKED: (msg = '评测门禁未通过') => new BusinessException(4001, msg),
  EVIDENCE_INACTIVE: (msg = '证据已停用') => new BusinessException(4002, msg),
  INTERNAL: (msg = '服务内部错误') => new BusinessException(5001, msg, HttpStatus.INTERNAL_SERVER_ERROR),
  SERVICE_UNAVAILABLE: (msg = '服务不可用') => new BusinessException(5002, msg, HttpStatus.SERVICE_UNAVAILABLE),
};
