import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireCompanySalesAccess } from '../auth/decorators/require-company-sales-access.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { RequestId } from '../common/decorators/request-id.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  BookingDto,
  BookingsListQueryDto,
  BookingsListResponseDto,
  CreateBookingDto,
  UpdateBookingDto,
} from './dto/bookings.dto';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@Controller('companies/:companyId/bookings')
@RequireCompanySalesAccess()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({
    summary: 'List bookings for a company.',
  })
  @ApiOkResponse({
    description: 'Bookings were returned.',
    type: BookingsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company sales or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listBookings(
    @Param('companyId') companyId: string,
    @Query() query: BookingsListQueryDto,
  ) {
    return this.bookingsService.listBookings(companyId, query);
  }

  @Get(':bookingId')
  @ApiOperation({
    summary: 'Return booking detail.',
  })
  @ApiOkResponse({
    description: 'Booking detail was returned.',
    type: BookingDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or booking was not found.',
    type: ApiErrorResponseDto,
  })
  getBooking(
    @Param('companyId') companyId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.bookingsService.getBookingDetail(companyId, bookingId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a booking.',
  })
  @ApiCreatedResponse({
    description: 'Booking was created.',
    type: BookingDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed or the booking violates the allowed property state rules.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The unit already has an active booking.',
    type: ApiErrorResponseDto,
  })
  createBooking(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(
      companyId,
      authenticatedUser.id,
      requestId,
      createBookingDto,
    );
  }

  @Patch(':bookingId')
  @ApiOperation({
    summary: 'Update the safe editable booking metadata.',
  })
  @ApiOkResponse({
    description: 'Booking was updated.',
    type: BookingDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the booking change is not allowed.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or booking was not found.',
    type: ApiErrorResponseDto,
  })
  updateBooking(
    @Param('companyId') companyId: string,
    @Param('bookingId') bookingId: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingsService.updateBooking(
      companyId,
      bookingId,
      updateBookingDto,
    );
  }
}
