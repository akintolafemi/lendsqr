import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from 'src/auth/jwt.service'; // Service for managing JWTs
import { KnexService } from 'src/knex/knex.service'; // Database service for handling queries
import { StatusText } from 'src/types/response.types'; // Response status types

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService, // Injected JWT service
    private readonly dbService: KnexService, // Injected database service
  ) {}

  // Method to determine if the request can proceed
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Get the HTTP request object
      const request = context.switchToHttp().getRequest();

      // Check if the authorization header exists
      if (!request.headers.authorization) {
        throw new HttpException(
          {
            message: 'Authorization token not found', // Error message
            statusText: StatusText.ERROR,
            status: HttpStatus.UNAUTHORIZED, // HTTP status for unauthorized access
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Extract the token from the authorization header
      const token = request.headers.authorization.split(' ')[1];
      if (!token) {
        throw new HttpException(
          {
            message: 'Invalid authorization token', // Error message
            statusText: StatusText.ERROR,
            status: HttpStatus.UNAUTHORIZED,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Decode and verify the token
      const verifiedToken = this.jwtService.verifyToken(token);

      // Fetch the user from the database using the user ID from the verified token
      const user = await this.dbService
        .client('users')
        .where({
          id: verifiedToken['id'], // Get user by ID
        })
        .select('*') // Select all user fields
        .first(); // Get the first matching user

      // Check if the user exists
      if (!user) {
        throw new HttpException(
          {
            message: 'Failed to verify user or user no longer exist', // Error message
            statusText: StatusText.UNAUTHORIZED,
            status: HttpStatus.UNAUTHORIZED,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Attach the user object to the request for further use in the application
      request['user'] = user;

      return true; // Allow the request to proceed
    } catch (error) {
      // Handle errors and throw an appropriate HttpException
      throw new HttpException(
        {
          message: error,
          statusText: StatusText.ERROR,
          status: HttpStatus.INTERNAL_SERVER_ERROR, // General internal server error
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
