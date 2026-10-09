import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';
import type {
  DataGovInMarketPriceRecord,
  DataGovInResponse,
} from '../interfaces/market-price.interface';

export interface MarketPriceProviderPage {
  records: DataGovInMarketPriceRecord[];
  total: number;
}

@Injectable()
export class DataGovInMarketPriceProvider {
  private readonly logger = new Logger(DataGovInMarketPriceProvider.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.getString('DATA_GOV_IN_BASE_URL', 'https://api.data.gov.in');
  }

  private get resourceId(): string {
    return this.config.getString(
      'DATA_GOV_IN_RESOURCE_ID',
      '9ef84268-d588-465a-a308-a864a43d0070',
    );
  }

  private get apiKey(): string {
    return this.config.getOrThrow('DATA_GOV_IN_API_KEY');
  }

  async fetchPage(options: {
    offset: number;
    limit: number;
    date?: string;
  }): Promise<MarketPriceProviderPage> {
    const url = new URL(`/resource/${this.resourceId}`, this.baseUrl);
    url.searchParams.set('api-key', this.apiKey);
    url.searchParams.set('format', 'json');
    url.searchParams.set('offset', String(options.offset));
    url.searchParams.set('limit', String(options.limit));
    url.searchParams.set('filters[state.keyword]', 'Gujarat');

    if (options.date) {
      url.searchParams.set('filters[arrival_date]', options.date);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      const text = await response.text();
      let payload: DataGovInResponse;

      try {
        payload = JSON.parse(text) as DataGovInResponse;
      } catch {
        if (!response.ok) {
          this.logger.error(`data.gov.in request failed (${response.status}).`);
          throw new ServiceUnavailableException('Government market-price API request failed');
        }
        throw new ServiceUnavailableException('Government market-price API returned invalid JSON');
      }

      if (!response.ok) {
        this.logger.error(`data.gov.in request failed (${response.status}).`);
        throw new ServiceUnavailableException('Government market-price API request failed');
      }

      return {
        records: Array.isArray(payload.records) ? payload.records : [],
        total: Number(payload.total ?? 0),
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : String(error);

      const cause =
        error instanceof Error && 'cause' in error
          ? String(error.cause)
          : '';

      this.logger.error(
        `data.gov.in network request failed: ${message}${
          cause ? ` | cause: ${cause}` : ''
        }`,
      );

      throw new ServiceUnavailableException(
        'Unable to reach government market-price API',
      );
    
    } finally {
      clearTimeout(timeout);
    }
  }
}
