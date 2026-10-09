import { PartialType } from '@nestjs/swagger';
import { CreateBuyerRequirementDto } from './create-buyer-requirement.dto';

export class UpdateBuyerRequirementDto extends PartialType(CreateBuyerRequirementDto) {}
