import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

export interface FlyWireNeuron {
  id: string;
  type: string;
  position: [number, number, number];
  meshUrl?: string;
  connections: string[];
  activity?: number;
}

export interface FlyWireCircuit {
  name: string;
  neurons: FlyWireNeuron[];
  synapses: FlyWireSynapse[];
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

export interface FlyWireSynapse {
  presynapticId: string;
  postsynapticId: string;
  position: [number, number, number];
  weight: number;
  type: 'chemical' | 'electrical';
}

export interface MechanosensoryData {
  timestamp: number;
  peakTime: number;    // 11.5s from analysis
  magnitude: number;   // 3.67 from analysis
  turnRate: number[];
  co2Response: number[];
  optogeneticStimulus: boolean;
  femParameters: {
    stimulusPosition: [number, number, number];
    mechanicalForce: number;
    responsePattern: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class FlywireApiService {
  // Updated for LARVAL circuits - 2nd instar larvae (NO WINGS)
  private readonly caveBaseUrl = 'https://cave.flywire.ai';
  private readonly codexBaseUrl = 'https://codex.flywire.ai/api';
  private readonly larvalDataset = 'flywire_fafb_production'; // Check if larval dataset available
  
  private readonly caveToken$ = new BehaviorSubject<string | null>(null);
  private readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);

  // LARVAL mechanosensory neuron types (2nd instar - NO WINGS) + CHRIMSON
  private readonly larvalMechanosensoryTypes = [
    'CO2_sensory_neuron_larval',
    'mechanosensory_neuron_larval', 
    'touch_receptor_larval',
    'stretch_receptor_larval',
    'proprioceptor_larval',
    'chordotonal_organ_larval',
    'campaniform_sensilla_larval',
    'bristle_mechanosensory_larval',
    'photoreceptor_to_DN_circuit', // The circuit you identified
    // CHRIMSON-expressing neurons (red light responsive)
    'CHRIMSON_mechanosensory_larval',
    'CHRIMSON_touch_receptor_larval',
    'CHRIMSON_stretch_receptor_larval',
    'CHRIMSON_campaniform_larval',
    'CHRIMSON_proprioceptor_larval',
    'CHRIMSON_nociceptor_larval'
  ];

  constructor(private http: HttpClient) {
    this.loadCaveToken();
  }

  private loadCaveToken(): void {
    let token = localStorage.getItem('flywire_cave_token');
    
    if (!token) {
      token = 'b927b9cd93ba0a9b569ab9e32d231dbc'; // Your CAVE token
      if (token) {
        localStorage.setItem('flywire_cave_token', token);
      }
    }
    
    if (token) {
      this.setCaveToken(token);
    }
  }

  setCaveToken(token: string): void {
    this.caveToken$.next(token);
    this.isAuthenticated$.next(!!token);
    localStorage.setItem('flywire_cave_token', token);
  }

  private getCaveHeaders(): HttpHeaders {
    const token = this.caveToken$.value;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  // Search for LARVAL mechanosensory neurons using CAVE API
  searchLarvalMechanosensoryNeurons(): Observable<FlyWireNeuron[]> {
    const headers = this.getCaveHeaders();
    
    const query = {
      filter_in_dict: {
        cell_type: this.larvalMechanosensoryTypes
      },
      limit: 500 // Increase limit for larval circuits
    };
    
    return this.http.post<any[]>(`${this.caveBaseUrl}/annotation/dataset/${this.larvalDataset}/table/cell_type_local/query`, query, { headers })
      .pipe(
        map(results => results.map(result => this.transformCaveNeuronData(result))),
        retry(3),
        catchError(this.handleError)
      );
  }

  // Get specific neuron data from CAVE
  getNeuron(neuronId: string): Observable<FlyWireNeuron> {
    const headers = this.getCaveHeaders();
    
    return this.http.get<any>(`${this.caveBaseUrl}/segmentation/dataset/${this.larvalDataset}/object/${neuronId}`, { headers })
      .pipe(
        map(neuron => this.transformCaveNeuronData(neuron)),
        retry(3),
        catchError(this.handleError)
      );
  }

  // Get neuron mesh from FlyWire mesh service
  getNeuronMesh(neuronId: string): Observable<ArrayBuffer> {
    const headers = this.getCaveHeaders();
    
    return this.http.get(`${this.caveBaseUrl}/meshing/dataset/${this.larvalDataset}/object/${neuronId}/mesh`, { 
      headers,
      responseType: 'arraybuffer'
    })
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  // Get synaptic connections using CAVE connectivity API
  getConnectivity(sourceIds: string[], targetIds?: string[]): Observable<FlyWireSynapse[]> {
    const headers = this.getCaveHeaders();
    
    const query = {
      source_neurons: sourceIds,
      target_neurons: targetIds || [],
      synapse_table: 'synapses_pni_2'
    };
    
    return this.http.post<any[]>(`${this.caveBaseUrl}/connectivity/dataset/${this.larvalDataset}/synapses`, query, { headers })
      .pipe(
        map(synapses => synapses.map(synapse => this.transformCaveSynapseData(synapse))),
        retry(3),
        catchError(this.handleError)
      );
  }

  // Get LARVAL mechanosensory circuits - NO FALLBACKS
  getMechanosensoryCircuits(): Observable<FlyWireCircuit[]> {
    return this.searchLarvalMechanosensoryNeurons().pipe(
      map(neurons => {
        if (neurons.length === 0) {
          throw new Error('No larval mechanosensory neurons found in dataset');
        }
        return this.groupLarvalNeuronsIntoCircuits(neurons);
      }),
      catchError(this.handleError)
    );
  }

  // Group LARVAL neurons into functional circuits (2nd instar - NO WINGS)
  private groupLarvalNeuronsIntoCircuits(neurons: FlyWireNeuron[]): FlyWireCircuit[] {
    const circuits: FlyWireCircuit[] = [];
    
    // CHRIMSON Red Light Mechanosensory Circuit (PRIMARY TARGET)
    const chrimsonNeurons = neurons.filter(n => 
      n.type.includes('CHRIMSON') && 
      (n.type.includes('mechanosensory') || 
       n.type.includes('touch') ||
       n.type.includes('stretch') ||
       n.type.includes('campaniform') ||
       n.type.includes('proprioceptor') ||
       n.type.includes('nociceptor'))
    );
    if (chrimsonNeurons.length > 0) {
      circuits.push({
        name: 'CHRIMSON Red Light Mechanosensory Circuit',
        neurons: chrimsonNeurons,
        synapses: [],
        boundingBox: this.calculateBoundingBox(chrimsonNeurons)
      });
    }
    
    // Photoreceptor to DN Circuit (the one you identified)
    const photoreceptorDNNeurons = neurons.filter(n => 
      n.type.includes('photoreceptor') || 
      n.type.includes('DN') ||
      n.type.includes('photoreceptor_to_DN')
    );
    if (photoreceptorDNNeurons.length > 0) {
      circuits.push({
        name: 'Photoreceptor to DN Circuit',
        neurons: photoreceptorDNNeurons,
        synapses: [],
        boundingBox: this.calculateBoundingBox(photoreceptorDNNeurons)
      });
    }
    
    // Larval CO2 Detection Circuit
    const larvalCO2Neurons = neurons.filter(n => 
      n.type.includes('CO2') && 
      n.type.includes('larval')
    );
    if (larvalCO2Neurons.length > 0) {
      circuits.push({
        name: 'Larval CO2 Detection Circuit',
        neurons: larvalCO2Neurons,
        synapses: [],
        boundingBox: this.calculateBoundingBox(larvalCO2Neurons)
      });
    }
    
    // Larval Touch/Mechanosensory Circuit (NO WING components, EXCLUDING CHRIMSON)
    const larvalTouchNeurons = neurons.filter(n => 
      (n.type.includes('touch') || 
       n.type.includes('mechanosensory') || 
       n.type.includes('bristle') ||
       n.type.includes('campaniform')) &&
      n.type.includes('larval') &&
      !n.type.includes('wing') && // Explicitly exclude wing-related
      !n.type.includes('CHRIMSON') // Exclude CHRIMSON (separate circuit)
    );
    if (larvalTouchNeurons.length > 0) {
      circuits.push({
        name: 'Larval Touch/Mechanosensory Circuit',
        neurons: larvalTouchNeurons,
        synapses: [],
        boundingBox: this.calculateBoundingBox(larvalTouchNeurons)
      });
    }
    
    // Larval Proprioceptive Circuit (EXCLUDING CHRIMSON)
    const larvalProprioNeurons = neurons.filter(n => 
      (n.type.includes('proprioceptor') || 
       n.type.includes('stretch') ||
       n.type.includes('chordotonal')) &&
      n.type.includes('larval') &&
      !n.type.includes('CHRIMSON') // Exclude CHRIMSON (separate circuit)
    );
    if (larvalProprioNeurons.length > 0) {
      circuits.push({
        name: 'Larval Proprioceptive Circuit',
        neurons: larvalProprioNeurons,
        synapses: [],
        boundingBox: this.calculateBoundingBox(larvalProprioNeurons)
      });
    }
    
    if (circuits.length === 0) {
      throw new Error('No larval mechanosensory circuits could be constructed from available neurons');
    }
    
    return circuits;
  }

  private calculateBoundingBox(neurons: FlyWireNeuron[]): {min: [number, number, number], max: [number, number, number]} {
    if (neurons.length === 0) {
      throw new Error('Cannot calculate bounding box for empty neuron list');
    }
    
    const positions = neurons.map(n => n.position);
    const min: [number, number, number] = [
      Math.min(...positions.map(p => p[0])),
      Math.min(...positions.map(p => p[1])),
      Math.min(...positions.map(p => p[2]))
    ];
    const max: [number, number, number] = [
      Math.max(...positions.map(p => p[0])),
      Math.max(...positions.map(p => p[1])),
      Math.max(...positions.map(p => p[2]))
    ];
    
    return { min, max };
  }

  // Map FEM analysis data to LARVAL neural circuits - NO FALLBACKS
  mapFemDataToCircuits(femData: MechanosensoryData[]): Observable<FlyWireCircuit[]> {
    if (femData.length === 0) {
      return throwError(() => new Error('No FEM data provided for circuit mapping'));
    }
    
    return this.getMechanosensoryCircuits().pipe(
      map(circuits => {
        return circuits.map(circuit => {
          const enhancedCircuit = { ...circuit };
          
          enhancedCircuit.neurons = circuit.neurons.map(neuron => {
            const activity = this.calculateNeuronActivity(neuron, femData);
            return { ...neuron, activity };
          });
          
          return enhancedCircuit;
        });
      })
    );
  }

  // Calculate neuron activity based on FEM analysis - LARVAL SPECIFIC + CHRIMSON
  private calculateNeuronActivity(neuron: FlyWireNeuron, femData: MechanosensoryData[]): number {
    if (!femData.length) {
      throw new Error('No FEM data available for activity calculation');
    }
    
    const latestData = femData[femData.length - 1];
    let baseActivity = 0;
    
    // CHRIMSON neurons respond to red light as phantom mechanosensation
    if (neuron.type.includes('CHRIMSON')) {
      // Red light creates phantom vibrations/touch sensations
      baseActivity = latestData.optogeneticStimulus ? 0.9 : 0.05; // Very high response to red light
      
      // Additional mechanical force amplification for CHRIMSON
      const mechanicalBoost = latestData.femParameters.mechanicalForce * 0.15;
      baseActivity = Math.min(1.0, baseActivity + mechanicalBoost);
      
    } else if (neuron.type.includes('photoreceptor') || neuron.type.includes('DN')) {
      // Photoreceptor-DN circuit responds to optogenetic stimulation
      baseActivity = latestData.optogeneticStimulus ? 0.8 : 0.1;
    } else if (neuron.type.includes('CO2') && neuron.type.includes('larval')) {
      baseActivity = latestData.co2Response[latestData.co2Response.length - 1] || 0;
    } else if (neuron.type.includes('touch') || neuron.type.includes('mechanosensory')) {
      baseActivity = latestData.femParameters.mechanicalForce * 0.1;
    } else if (neuron.type.includes('proprioceptor') || neuron.type.includes('stretch')) {
      // Proprioceptors respond to movement/turn rate
      baseActivity = Math.abs(latestData.turnRate[latestData.turnRate.length - 1] || 0) * 0.05;
    } else {
      // Unknown larval neuron type
      baseActivity = 0.05; // Minimal baseline
    }
    
    // Apply temporal dynamics (peak time: 11.5s, magnitude: 3.67)
    const timeFactor = Math.exp(-Math.abs(latestData.timestamp - latestData.peakTime) / 5.0);
    const magnitudeBoost = latestData.magnitude / 3.67; // Normalize to reference
    
    return Math.min(1.0, baseActivity * timeFactor * magnitudeBoost);
  }

  // Data transformation methods for CAVE API responses
  private transformCaveNeuronData(caveData: any): FlyWireNeuron {
    return {
      id: caveData.pt_root_id?.toString() || caveData.id?.toString() || 'unknown',
      type: caveData.cell_type || caveData.classification || 'unknown',
      position: caveData.pt_position || caveData.soma_position || [0, 0, 0],
      meshUrl: undefined, // Will be loaded separately
      connections: [], // Will be populated by connectivity queries
      activity: 0
    };
  }

  private transformCaveSynapseData(caveData: any): FlyWireSynapse {
    return {
      presynapticId: caveData.pre_pt_root_id?.toString() || '',
      postsynapticId: caveData.post_pt_root_id?.toString() || '',
      position: caveData.ctr_pt_position || [0, 0, 0],
      weight: caveData.size || caveData.weight || 1,
      type: 'chemical' // Most synapses in FAFB are chemical
    };
  }

  // Check if we have authentication
  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  // Update API key method for backward compatibility
  setApiKey(apiKey: string): void {
    this.setCaveToken(apiKey);
  }

  // Error handling - NO FALLBACKS, FAIL FAST
  private handleError = (error: any) => {
    console.error('FlyWire API Error:', error);
    let errorMessage = 'FlyWire API request failed';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error: ${error.status} - ${error.message}`;
      
      if (error.status === 401) {
        errorMessage = 'Authentication failed - CAVE token invalid or expired';
        this.isAuthenticated$.next(false);
      } else if (error.status === 403) {
        errorMessage = 'Access denied - insufficient permissions for larval dataset';
      } else if (error.status === 404) {
        errorMessage = 'Larval mechanosensory data not found in dataset';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded - please wait before making more requests';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  };
} 