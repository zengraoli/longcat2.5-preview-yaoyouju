export class SendCodeDto {
  phone: string;
}

export class LoginDto {
  phone: string;
  code: string;
}

export class ConsentDto {
  scopes: string[];
}
