import { Injectable } from '@nestjs/common';
import { getLocalizedDomainName } from '@agri/domain-data';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async getStates(locale = 'en') {
    const rows = await this.prisma.state.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return rows.map((row) => ({
      ...row,
      displayName: getLocalizedDomainName(row.name, locale, 'state'),
    }));
  }

  async getDistricts(stateId: string, locale = 'en') {
    const rows = await this.prisma.district.findMany({
      where: { stateId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, stateId: true },
    });
    return rows.map((row) => ({
      ...row,
      displayName: getLocalizedDomainName(row.name, locale, 'district'),
    }));
  }

  async getTalukas(districtId: string, locale = 'en') {
    const rows = await this.prisma.taluka.findMany({
      where: { districtId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, districtId: true },
    });
    return rows.map((row) => ({
      ...row,
      displayName: getLocalizedDomainName(row.name, locale, 'taluka'),
    }));
  }

  async getVillages(talukaId: string, locale = 'en') {
    const rows = await this.prisma.village.findMany({
      where: { talukaId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, talukaId: true },
    });
    return rows.map((row) => ({
      ...row,
      displayName: getLocalizedDomainName(row.name, locale, 'village'),
    }));
  }
}
