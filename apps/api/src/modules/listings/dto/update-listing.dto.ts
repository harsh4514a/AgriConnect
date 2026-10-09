import { PartialType } from '@nestjs/swagger';
import { CreateListingDto } from './create-listing.dto';

/** Any editable listing fields; ownership is enforced by the service. */
export class UpdateListingDto extends PartialType(CreateListingDto) {}
