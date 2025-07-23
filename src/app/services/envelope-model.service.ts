import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface EnvelopeModel {
  id: string;
  name: string;
  description: string;
  parameters: {
    spatial_scale: number;
    temporal_scale: number;
    sensitivity_threshold: number;
    adaptation_rate: number;
  };
  statistics: {
    mean: number;
    std: number;
    sem: number;
    ci_95_lower: number;
    ci_95_upper: number;
    shapiro_wilk_p: number;
    is_normal: boolean;
    sample_size: number;
  };
  validation: {
    t_statistic: number;
    p_value: number;
    significant: boolean;
    effect_size: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EnvelopeModelService {
  private modelsSubject = new BehaviorSubject<EnvelopeModel[]>([]);
  public models$ = this.modelsSubject.asObservable();

  // Production Python stats service deployed to Cloud Run
  private readonly STATS_SERVICE_URL = 'https://neurovis-stats-359448340087.us-central1.run.app';

  constructor(private http: HttpClient) {
    console.log('[EnvelopeModelService] Service initialized with Python backend:', this.STATS_SERVICE_URL);
    this.loadEnvelopeModels();
  }

  async loadEnvelopeModels(): Promise<void> {
    try {
      const response = await fetch('./assets/data/mechanosensation_experimental_data.json');
      const data = await response.json();
      
      console.log('[EnvelopeModelService] Loaded experimental data:', data.metadata);
      
      // Convert experimental data to datasets for Python service
      const datasets = this.convertToDatasets(data);
      
      // Generate envelope models using real Python statistical calculations
      const validModels: EnvelopeModel[] = [];
      
      for (const dataset of datasets) {
        try {
          const model = await this.callPythonEnvelopeService(dataset);
          if (model) {
            validModels.push(model);
          }
        } catch (error) {
          console.error('[EnvelopeModelService] Python service failed for dataset:', dataset.label, error);
          // No fallback - require proper statistical analysis
          throw error;
        }
      }
      
      if (validModels.length === 0) {
        throw new Error('No valid envelope models generated - Python service required');
      }
      
      this.modelsSubject.next(validModels);
      console.log('[EnvelopeModelService] Generated', validModels.length, 'envelope models using Python service');
      
    } catch (error) {
      console.error('[EnvelopeModelService] Failed to load envelope models:', error);
      throw error; // No fallback calculations
    }
  }

  private convertToDatasets(data: any): any[] {
    const datasets: any[] = [];
    const uniqueIds = new Set<string>();

    // Iterate through all data points and group them by their 'label'
    data.data.forEach((point: any) => {
      const label = point.label;
      if (!uniqueIds.has(label)) {
        uniqueIds.add(label);
        datasets.push({
          label: label,
          name: label,
          description: `Data for ${label}`,
          parameters: {
            spatial_scale: 0.85, // Default, can be adjusted
            temporal_scale: 120.5, // Default, can be adjusted
            sensitivity_threshold: 0.12, // Default, can be adjusted
            adaptation_rate: 0.034 // Default, can be adjusted
          },
          data: data.data.filter((p: any) => p.label === label).map((p: any) => p.value),
          baseline: data.baseline // Assuming baseline is the same for all labels
        });
      }
    });
    return datasets;
  }

  private async callPythonEnvelopeService(dataset: any): Promise<EnvelopeModel | null> {
    console.log(`[EnvelopeModelService] Calling Python service for envelope analysis: ${dataset.data.length} data points for ${dataset.label}`);
    
    try {
      const response = await fetch(`${this.STATS_SERVICE_URL}/envelope-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          envelope_data: dataset.data,
          baseline_mu: dataset.baseline
        })
      });

      if (!response.ok) {
        throw new Error(`Python service returned status ${response.status}`);
      }

      const data = await response.json();
      console.log('[EnvelopeModelService] Python service response:', data);

      return {
        id: dataset.label,
        name: dataset.name,
        description: dataset.description,
        parameters: dataset.parameters,
        statistics: {
          mean: data.descriptive.mean,
          std: data.descriptive.std,
          sem: data.descriptive.sem,
          ci_95_lower: data.descriptive.ci_95_lower,
          ci_95_upper: data.descriptive.ci_95_upper,
          shapiro_wilk_p: data.normality.p_value,
          is_normal: data.normality.is_normal,
          sample_size: data.descriptive.n
        },
        validation: {
          t_statistic: data.t_test.statistic,
          p_value: data.t_test.p_value,
          significant: data.t_test.significant,
          effect_size: data.recommendation.effect_size
        }
      };
    } catch (error) {
      console.error(`[EnvelopeModelService] Error calling Python service for ${dataset.label}:`, error);
      throw error; // No fallback - require proper statistical analysis
    }
  }

  // Remove all fallback calculation methods - require Python service for proper statistics

  // Simplified fallback methods (keeping essential ones for error cases)
  private shapiroWilkTest(data: number[]): number {
    if (!data || data.length < 3) return 1;
    // Simplified approximation for fallback only
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return variance > 0 ? Math.max(0.001, Math.min(1, 0.5 + (0.5 * Math.exp(-variance * 10)))) : 1;
  }

  private tTest(data: number[], mu0: number): number {
    if (!data || data.length < 2) return 1;
    const n = data.length;
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);
    const t = Math.abs(mean - mu0) / (std / Math.sqrt(n));
    return Math.max(0.001, Math.min(1, 2 * Math.exp(-t * 0.5))); // Simplified approximation
  }

  private getTCritical(df: number, alpha: number): number {
    if (df >= 30) return 1.96;
    const t_table: { [key: number]: number } = {
      1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
      6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
      15: 2.131, 20: 2.086, 25: 2.060, 30: 2.042
    };
    const available_df = Object.keys(t_table).map(Number).sort((a, b) => a - b);
    const closest_df = available_df.reduce((prev, curr) => 
      Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev
    );
    return t_table[closest_df];
  }

  getEnvelopeModels(): Observable<EnvelopeModel[]> {
    return this.models$;
  }

  getModelById(id: string): Observable<EnvelopeModel | null> {
    return this.models$.pipe(
      map(models => models.find(model => model.id === id) || null)
    );
  }

  // Method to test Python service connectivity
  testPythonService(): Observable<any> {
    console.log('[EnvelopeModelService] Testing Python service health');
    return this.http.get(`${this.STATS_SERVICE_URL}/health`).pipe(
      catchError(error => {
        console.error('[EnvelopeModelService] Python service health check failed:', error);
        throw error;
      })
    );
  }
} 