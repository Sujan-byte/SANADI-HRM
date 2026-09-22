import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { decimalDigits, numberLocale } from 'src/app/modules/hrm-shared/core/shared/utils/common.constants';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { PostingPreviewResponse } from './posting-preview.model';

@Injectable({
  providedIn: 'root',
})
export class PostingPreviewService {
  private readonly apiService = inject(ApiService);

  async getPostingPreview(from_type: string, from_id: number): Promise<PostingPreviewResponse | null> {
    if (!from_type || !from_id) {
      return null;
    }
    // Bypasses ApiService.get() on purpose - it catches all HTTP errors and resolves
    // with {} instead of rejecting, which would hide a real 404/500/permission failure
    // behind the same "no entries" empty state as a genuinely empty result.
    const response = await firstValueFrom(
      this.apiService.http.get<PostingPreviewResponse>(
        this.apiService.api_url + ServiceUrlConstants.POSTING_PREVIEW_CRUD,
        { params: { from_type, from_id } }
      )
    );
    return response && Object.keys(response).length ? response : null;
  }

  async exportPdf(from_type: string, from_id: number, vch_no?: string): Promise<void> {
    if (!from_type || !from_id) {
      return;
    }
    const fileName = vch_no ? `Posting Preview of ${vch_no}` : `Posting Preview - ${from_type}-${from_id}`;
    await firstValueFrom(
      this.apiService.getFile(ServiceUrlConstants.POSTING_PREVIEW_EXPORT_PDF, {
        from_type,
        from_id,
        fileName,
        dontUseCurrentDate: true,
        decimal: decimalDigits() ?? 2,
        number_locale: numberLocale() ?? 'en-US',
      })
    );
  }
}
