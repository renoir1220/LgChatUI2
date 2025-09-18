import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../../../types';
import { generateUserId } from '../../../shared/utils/user.utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'fallback-secret-key-for-development',
      ),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.authService.validateUser(payload.username);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }
      // 统一在认证层处理用户ID格式，业务代码直接使用 req.user.id
      return {
        id: generateUserId(payload.username), // user_刘冬阳 格式
        username: payload.username
      };
    } catch (error) {
      throw new UnauthorizedException('JWT验证失败');
    }
  }
}
