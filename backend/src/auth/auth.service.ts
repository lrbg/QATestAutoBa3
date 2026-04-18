import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  tenantName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ access_token: string; user: Partial<User> }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const tenantId = `tenant-${uuidv4()}`;

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      tenantId,
      tenantName: dto.tenantName,
      role: 'admin',
    });

    return this.generateTokenResponse(user);
  }

  async login(dto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await user.validatePassword(dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.generateTokenResponse(user);
  }

  async validateToken(payload: JwtPayload): Promise<User | null> {
    return this.usersService.findById(payload.sub);
  }

  private generateTokenResponse(user: User): { access_token: string; user: Partial<User> } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const { password, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }
}
