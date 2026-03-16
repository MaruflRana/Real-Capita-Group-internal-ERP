import type { RequestWithRequestId } from '../../common/interfaces/request-with-request-id.interface';
import type { AuthenticatedUser } from './auth.types';

export interface AuthenticatedRequest extends RequestWithRequestId {
  user?: AuthenticatedUser;
}
