import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { 
  EnvelopeModel, 
  CircuitMapping, 
  TemporalDynamics, 
  ExperimentParameters,
  StatisticalSummary 
} from '@models/neural-circuit.model';

/**
 * Service for managing envelope models and their integration with neural circuits
 * Handles the mathematical modeling of mechanosensory responses and their
 * mapping to specific neural pathways in the FlyWire connectome
 * 
 * @example
 * ```typescript
 * constructor(private envelopeService: EnvelopeModelService) {}
 * 
 * // Load envelope models from experimental data
 * this.envelopeService.loadEnvelopeModels().subscribe(models => {
 *   console.log('Available envelope models:', models);
 * });
 * 
 * // Generate temporal dynamics for circuit simulation
 * const dynamics = this.envelopeService.generateTemporalDynamics(model, circuit);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class EnvelopeModelService {
  
  private envelopeModelsSubject = new BehaviorSubject<EnvelopeModel[]>([]);
  public envelopeModels$ = this.envelopeModelsSubject.asObservable();
  
  private activeMappingsSubject = new BehaviorSubject<CircuitMapping[]>([]);
  public activeMappings$ = this.activeMappingsSubject.asObservable();
  
  private experimentParametersSubject = new BehaviorSubject<ExperimentParameters | null>(null);
  public experimentParameters$ = this.experimentParametersSubject.asObservable();

  constructor() {
    this.initializeDefaultModels();
  }

  /**
   * Initialize with default envelope models from previous experimental data
   */
  private initializeDefaultModels(): void {
    const defaultModels: EnvelopeModel[] = [
      {
        id: 'group1_50_100_red',
        groupName: 'Group 1 (50-100 Red Square)',
        peakTime: 11.5,
        peakMagnitude: 3.67,
        responseDuration: 20.0,
        timeConstant: 2.5,
        baseline: 2.74,
        standardError: 0.61,
        sampleSize: 129,
        stimulus: {
          type: 'optical_red',
          intensity: 75, // average of 50-100
          duration: 20.0,
          pattern: 'constant'
        },
        timeSeries: {
          time: this.generateTimePoints(0, 20, 0.5),
          response: this.generateResponseCurve(11.5, 3.67, 2.74, 2.5, 0, 20, 0.5),
          error: this.generateErrorBars(40, 0.61) // 40 time points
        }
      },
      {
        id: 'group2_0_50_red',
        groupName: 'Group 2 (0-50 Red Square)',
        peakTime: 12.0,
        peakMagnitude: 4.12,
        responseDuration: 20.0,
        timeConstant: 2.8,
        baseline: 2.96,
        standardError: 0.44,
        sampleSize: 120,
        stimulus: {
          type: 'optical_red',
          intensity: 25, // average of 0-50
          duration: 20.0,
          pattern: 'constant'
        },
        timeSeries: {
          time: this.generateTimePoints(0, 20, 0.5),
          response: this.generateResponseCurve(12.0, 4.12, 2.96, 2.8, 0, 20, 0.5),
          error: this.generateErrorBars(40, 0.44)
        }
      },
      {
        id: 'group3_stepwise_0_250',
        groupName: 'Group 3 (Stepwise 0-250 Red)',
        peakTime: 3.5,
        peakMagnitude: 4.30,
        responseDuration: 20.0,
        timeConstant: 1.8,
        baseline: 2.57,
        standardError: 0.90,
        sampleSize: 77,
        stimulus: {
          type: 'optical_red',
          intensity: 125, // average of 0-250
          duration: 20.0,
          pattern: 'stepwise'
        },
        timeSeries: {
          time: this.generateTimePoints(0, 20, 0.5),
          response: this.generateResponseCurve(3.5, 4.30, 2.57, 1.8, 0, 20, 0.5),
          error: this.generateErrorBars(40, 0.90)
        }
      }
    ];
    
    this.envelopeModelsSubject.next(defaultModels);
  }

  /**
   * Load envelope models from external data source
   * @param dataUrl - URL to envelope model data (JSON format)
   */
  loadEnvelopeModels(dataUrl?: string): Observable<EnvelopeModel[]> {
    // For now, return the default models
    // In production, this would fetch from the mechanosensation project data
    return this.envelopeModels$;
  }

  /**
   * Get a specific envelope model by ID
   * @param modelId - Envelope model identifier
   */
  getEnvelopeModel(modelId: string): Observable<EnvelopeModel | undefined> {
    return this.envelopeModels$.pipe(
      map(models => models.find(model => model.id === modelId))
    );
  }

  /**
   * Generate temporal dynamics for neural circuit simulation
   * Maps envelope model temporal profile to neural activity patterns
   * 
   * @param envelopeModel - Source envelope model
   * @param neuronIds - Array of neuron IDs to simulate
   * @param mapping - Optional mapping parameters
   */
  generateTemporalDynamics(
    envelopeModel: EnvelopeModel,
    neuronIds: string[],
    mapping?: Partial<CircuitMapping['mapping']>
  ): TemporalDynamics {
    
    const params = {
      scalingFactor: mapping?.scalingFactor || 1.0,
      timeOffset: mapping?.timeOffset || 0.0,
      spatialDistribution: mapping?.spatialDistribution || 'uniform' as const,
      propagationSpeed: mapping?.propagationSpeed || 10.0 // mm/s
    };
    
    const timePoints = envelopeModel.timeSeries.time.map(t => t + params.timeOffset);
    const baseResponse = envelopeModel.timeSeries.response;
    
    const neuronActivities = neuronIds.map((neuronId, index) => {
      let activities: number[];
      
      switch (params.spatialDistribution) {
        case 'uniform':
          activities = baseResponse.map(r => r * params.scalingFactor);
          break;
          
        case 'gaussian':
          const sigma = neuronIds.length / 4;
          const center = neuronIds.length / 2;
          const gaussianWeight = Math.exp(-Math.pow(index - center, 2) / (2 * sigma * sigma));
          activities = baseResponse.map(r => r * params.scalingFactor * gaussianWeight);
          break;
          
        case 'exponential':
          const expWeight = Math.exp(-index / (neuronIds.length / 3));
          activities = baseResponse.map(r => r * params.scalingFactor * expWeight);
          break;
          
        default:
          activities = baseResponse.map(r => r * params.scalingFactor);
      }
      
      // Add propagation delays if specified
      if (params.propagationSpeed < Infinity) {
        const delay = index * 0.1; // Simplified delay calculation
        activities = this.applyTemporalDelay(activities, delay, 0.5);
      }
      
      return {
        neuronId,
        activities: this.addNoise(activities, 0.1) // Add 10% noise
      };
    });
    
    return {
      timePoints,
      neuronActivities,
      parameters: {
        duration: Math.max(...timePoints),
        timeStep: timePoints[1] - timePoints[0],
        stimulusOnset: envelopeModel.stimulus.duration > 0 ? 0 : -1,
        stimulusDuration: envelopeModel.stimulus.duration
      }
    };
  }

  /**
   * Create a mapping between envelope model and neural circuit
   * @param envelopeModel - Source envelope model
   * @param circuitId - Target circuit identifier
   * @param mappingParams - Mapping parameters
   */
  createCircuitMapping(
    envelopeModel: EnvelopeModel,
    circuitId: string,
    mappingParams: CircuitMapping['mapping']
  ): CircuitMapping {
    
    const mapping: CircuitMapping = {
      id: `${envelopeModel.id}_to_${circuitId}`,
      envelopeModel,
      circuit: {
        id: circuitId,
        name: 'Target Circuit',
        neurons: [],
        synapses: [],
        metadata: {
          description: '',
          functionalRole: 'mechanosensory processing',
          brainRegions: [],
          cellTypes: []
        }
      },
      mapping: mappingParams,
      confidence: this.calculateMappingConfidence(envelopeModel, mappingParams)
    };
    
    // Add to active mappings
    const currentMappings = this.activeMappingsSubject.value;
    this.activeMappingsSubject.next([...currentMappings, mapping]);
    
    return mapping;
  }

  /**
   * Generate population response with individual variability
   * @param baseModel - Base envelope model
   * @param populationSize - Number of individuals to simulate
   * @param variability - Amount of inter-individual variability (0-1)
   */
  generatePopulationResponse(
    baseModel: EnvelopeModel,
    populationSize: number,
    variability: number = 0.2
  ): EnvelopeModel[] {
    
    const populationModels: EnvelopeModel[] = [];
    
    for (let i = 0; i < populationSize; i++) {
      // Add variability to key parameters
      const peakTimeVariation = this.gaussianRandom() * variability * baseModel.peakTime;
      const magnitudeVariation = this.gaussianRandom() * variability * baseModel.peakMagnitude;
      const timeConstantVariation = this.gaussianRandom() * variability * baseModel.timeConstant;
      
      const individualModel: EnvelopeModel = {
        ...baseModel,
        id: `${baseModel.id}_individual_${i + 1}`,
        peakTime: Math.max(0.1, baseModel.peakTime + peakTimeVariation),
        peakMagnitude: Math.max(0, baseModel.peakMagnitude + magnitudeVariation),
        timeConstant: Math.max(0.1, baseModel.timeConstant + timeConstantVariation),
        sampleSize: 1
      };
      
      // Regenerate time series with new parameters
      individualModel.timeSeries = {
        time: baseModel.timeSeries.time,
        response: this.generateResponseCurve(
          individualModel.peakTime,
          individualModel.peakMagnitude,
          individualModel.baseline,
          individualModel.timeConstant,
          0, 20, 0.5
        ),
        error: new Array(baseModel.timeSeries.time.length).fill(0)
      };
      
      populationModels.push(individualModel);
    }
    
    return populationModels;
  }

  /**
   * Calculate statistical summary of envelope model data
   * @param models - Array of envelope models to analyze
   */
  calculateStatistics(models: EnvelopeModel[]): StatisticalSummary {
    const peakTimes = models.map(m => m.peakTime);
    const peakMagnitudes = models.map(m => m.peakMagnitude);
    
    const meanPeakTime = this.mean(peakTimes);
    const stdPeakTime = this.standardDeviation(peakTimes);
    const meanMagnitude = this.mean(peakMagnitudes);
    const stdMagnitude = this.standardDeviation(peakMagnitudes);
    
    return {
      n: models.length,
      mean: meanMagnitude,
      std: stdMagnitude,
      sem: stdMagnitude / Math.sqrt(models.length),
      confidenceInterval: this.confidenceInterval(peakMagnitudes, 0.95),
      peak: {
        time: meanPeakTime,
        magnitude: meanMagnitude,
        width: stdPeakTime * 2 // Approximate width as 2 standard deviations
      },
      tests: {
        normality: {
          pValue: this.shapiroWilkTest(peakMagnitudes),
          test: 'Shapiro-Wilk'
        },
        significance: {
          pValue: this.tTest(peakMagnitudes, models[0].baseline),
          test: 'One-sample t-test'
        }
      }
    };
  }

  /**
   * Export envelope model data for external analysis
   * @param modelIds - Optional array of model IDs to export (exports all if not specified)
   */
  exportEnvelopeModels(modelIds?: string[]): Observable<any> {
    return this.envelopeModels$.pipe(
      map(models => {
        const modelsToExport = modelIds 
          ? models.filter(m => modelIds.includes(m.id))
          : models;
        
        return {
          metadata: {
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            modelCount: modelsToExport.length
          },
          envelopeModels: modelsToExport,
          activeMappings: this.activeMappingsSubject.value
        };
      })
    );
  }

  /**
   * Private utility methods
   */

  private generateTimePoints(start: number, end: number, step: number): number[] {
    const points: number[] = [];
    for (let t = start; t <= end; t += step) {
      points.push(Number(t.toFixed(2)));
    }
    return points;
  }

  private generateResponseCurve(
    peakTime: number,
    peakMagnitude: number,
    baseline: number,
    timeConstant: number,
    startTime: number,
    endTime: number,
    step: number
  ): number[] {
    const timePoints = this.generateTimePoints(startTime, endTime, step);
    
    return timePoints.map(t => {
      if (t < 0) return baseline;
      
      // Double exponential model: fast rise, slow decay
      const amplitude = peakMagnitude - baseline;
      const riseConstant = timeConstant * 0.3; // Faster rise
      const decayConstant = timeConstant * 1.5; // Slower decay
      
      let response: number;
      if (t <= peakTime) {
        // Rising phase
        response = baseline + amplitude * (1 - Math.exp(-t / riseConstant)) * (t / peakTime);
      } else {
        // Decay phase
        const peakResponse = baseline + amplitude;
        response = baseline + (peakResponse - baseline) * Math.exp(-(t - peakTime) / decayConstant);
      }
      
      return Math.max(0, response);
    });
  }

  private generateErrorBars(length: number, sem: number): number[] {
    return new Array(length).fill(sem);
  }

  private applyTemporalDelay(activities: number[], delay: number, timeStep: number): number[] {
    const delaySteps = Math.round(delay / timeStep);
    const delayedActivities = new Array(activities.length).fill(0);
    
    for (let i = delaySteps; i < activities.length; i++) {
      delayedActivities[i] = activities[i - delaySteps];
    }
    
    return delayedActivities;
  }

  private addNoise(data: number[], noiseLevel: number): number[] {
    return data.map(value => {
      const noise = (Math.random() - 0.5) * 2 * noiseLevel * value;
      return Math.max(0, value + noise);
    });
  }

  private calculateMappingConfidence(
    envelopeModel: EnvelopeModel,
    mappingParams: CircuitMapping['mapping']
  ): number {
    // Simplified confidence calculation based on sample size and error
    const sampleConfidence = Math.min(1.0, envelopeModel.sampleSize / 100);
    const errorConfidence = Math.exp(-envelopeModel.standardError);
    const scalingConfidence = 1.0 / (1.0 + Math.abs(Math.log(mappingParams.scalingFactor)));
    
    return (sampleConfidence + errorConfidence + scalingConfidence) / 3;
  }

  private gaussianRandom(): number {
    // Box-Muller transform for Gaussian random numbers
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private mean(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  private standardDeviation(data: number[]): number {
    const meanValue = this.mean(data);
    const variance = data.reduce((sum, val) => sum + Math.pow(val - meanValue, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  private confidenceInterval(data: number[], confidence: number): [number, number] {
    const sorted = [...data].sort((a, b) => a - b);
    const alpha = 1 - confidence;
    const lowerIndex = Math.floor(alpha / 2 * sorted.length);
    const upperIndex = Math.ceil((1 - alpha / 2) * sorted.length) - 1;
    
    return [sorted[lowerIndex], sorted[upperIndex]];
  }

  private shapiroWilkTest(data: number[]): number {
    // Simplified normality test - in production would use proper statistical library
    return Math.random(); // Placeholder
  }

  private tTest(data: number[], mu0: number): number {
    const meanValue = this.mean(data);
    const std = this.standardDeviation(data);
    const t = (meanValue - mu0) / (std / Math.sqrt(data.length));
    
    // Simplified p-value calculation - in production would use proper statistical library
    return 2 * (1 - this.normalCDF(Math.abs(t)));
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
} 