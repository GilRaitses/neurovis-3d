import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, retry, timeout } from 'rxjs/operators';
import { NeuralCircuit, Neuron, Synapse, ConnectivityMatrix } from '@models/neural-circuit.model';

/**
 * Service for interacting with the FlyWire Codex API
 * Provides access to the complete Drosophila brain connectome data
 * 
 * @example
 * ```typescript
 * constructor(private flywireApi: FlyWireApiService) {}
 * 
 * // Get neuron by ID
 * this.flywireApi.getNeuron('720575940621039145').subscribe(neuron => {
 *   console.log('Neuron data:', neuron);
 * });
 * 
 * // Search for mechanosensory neurons
 * this.flywireApi.searchNeurons('mechanosensory').subscribe(neurons => {
 *   console.log('Found mechanosensory neurons:', neurons);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FlyWireApiService {
  private readonly baseUrl = 'https://codex.flywire.ai/api/v1';
  private readonly requestTimeout = 30000; // 30 seconds
  private readonly maxRetries = 3;
  
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkConnection();
  }

  /**
   * Check if the FlyWire API is accessible
   */
  checkConnection(): Observable<boolean> {
    this.loadingSubject.next(true);
    
    return this.http.get(`${this.baseUrl}/health`, { 
      headers: this.getHeaders(),
      observe: 'response'
    }).pipe(
      timeout(this.requestTimeout),
      map(response => {
        const isConnected = response.status === 200;
        this.connectionStatusSubject.next(isConnected);
        this.loadingSubject.next(false);
        return isConnected;
      }),
      catchError(error => {
        console.error('FlyWire API connection failed:', error);
        this.connectionStatusSubject.next(false);
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get detailed information about a specific neuron
   * @param neuronId - FlyWire neuron identifier
   */
  getNeuron(neuronId: string): Observable<Neuron> {
    this.loadingSubject.next(true);
    
    return this.http.get<any>(`${this.baseUrl}/neurons/${neuronId}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      map(response => this.transformNeuronData(response)),
      catchError(this.handleError<Neuron>('getNeuron')),
      map(neuron => {
        this.loadingSubject.next(false);
        return neuron;
      })
    );
  }

  /**
   * Get multiple neurons by their IDs
   * @param neuronIds - Array of FlyWire neuron identifiers
   */
  getNeurons(neuronIds: string[]): Observable<Neuron[]> {
    this.loadingSubject.next(true);
    
    const params = new HttpParams().set('ids', neuronIds.join(','));
    
    return this.http.get<any[]>(`${this.baseUrl}/neurons/batch`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      map(response => response.map(data => this.transformNeuronData(data))),
      catchError(this.handleError<Neuron[]>('getNeurons')),
      map(neurons => {
        this.loadingSubject.next(false);
        return neurons;
      })
    );
  }

  /**
   * Search for neurons by cell type, annotation, or other criteria
   * @param query - Search query string
   * @param filters - Optional filters for cell type, brain region, etc.
   */
  searchNeurons(query: string, filters?: {
    cellType?: string;
    brainRegion?: string;
    neurotransmitter?: string;
    hemisphere?: 'left' | 'right';
    limit?: number;
  }): Observable<Neuron[]> {
    this.loadingSubject.next(true);
    
    let params = new HttpParams()
      .set('q', query)
      .set('limit', (filters?.limit || 100).toString());
    
    if (filters?.cellType) params = params.set('cell_type', filters.cellType);
    if (filters?.brainRegion) params = params.set('brain_region', filters.brainRegion);
    if (filters?.neurotransmitter) params = params.set('neurotransmitter', filters.neurotransmitter);
    if (filters?.hemisphere) params = params.set('hemisphere', filters.hemisphere);
    
    return this.http.get<any[]>(`${this.baseUrl}/neurons/search`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      map(response => response.map(data => this.transformNeuronData(data))),
      catchError(this.handleError<Neuron[]>('searchNeurons')),
      map(neurons => {
        this.loadingSubject.next(false);
        return neurons;
      })
    );
  }

  /**
   * Get synaptic connections for a specific neuron
   * @param neuronId - FlyWire neuron identifier
   * @param direction - 'incoming', 'outgoing', or 'both'
   * @param minWeight - Minimum synaptic weight threshold
   */
  getConnections(
    neuronId: string, 
    direction: 'incoming' | 'outgoing' | 'both' = 'both',
    minWeight: number = 1
  ): Observable<Synapse[]> {
    this.loadingSubject.next(true);
    
    const params = new HttpParams()
      .set('direction', direction)
      .set('min_weight', minWeight.toString());
    
    return this.http.get<any[]>(`${this.baseUrl}/neurons/${neuronId}/connections`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      map(response => response.map(data => this.transformSynapseData(data))),
      catchError(this.handleError<Synapse[]>('getConnections')),
      map(synapses => {
        this.loadingSubject.next(false);
        return synapses;
      })
    );
  }

  /**
   * Get connectivity matrix between two sets of neurons
   * @param presynapticIds - Array of presynaptic neuron IDs
   * @param postsynapticIds - Array of postsynaptic neuron IDs
   */
  getConnectivityMatrix(
    presynapticIds: string[], 
    postsynapticIds: string[]
  ): Observable<ConnectivityMatrix> {
    this.loadingSubject.next(true);
    
    const requestBody = {
      presynaptic_ids: presynapticIds,
      postsynaptic_ids: postsynapticIds
    };
    
    return this.http.post<any>(`${this.baseUrl}/connectivity/matrix`, requestBody, {
      headers: this.getHeaders()
    }).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      map(response => this.transformConnectivityMatrix(response)),
      catchError(this.handleError<ConnectivityMatrix>('getConnectivityMatrix')),
      map(matrix => {
        this.loadingSubject.next(false);
        return matrix;
      })
    );
  }

  /**
   * Get 3D mesh data for neuron visualization
   * @param neuronId - FlyWire neuron identifier
   * @param simplification - Mesh simplification level (0.1 - 1.0)
   */
  getNeuronMesh(neuronId: string, simplification: number = 0.5): Observable<any> {
    this.loadingSubject.next(true);
    
    const params = new HttpParams().set('simplification', simplification.toString());
    
    return this.http.get(`${this.baseUrl}/neurons/${neuronId}/mesh`, {
      headers: this.getHeaders(),
      params,
      responseType: 'blob'
    }).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      catchError(this.handleError<Blob>('getNeuronMesh')),
      map(blob => {
        this.loadingSubject.next(false);
        return blob;
      })
    );
  }

  /**
   * Get mechanosensory circuit data specifically
   * Optimized query for mechanosensory-related neurons and pathways
   */
  getMechanosensoryCircuit(): Observable<NeuralCircuit> {
    this.loadingSubject.next(true);
    
    return this.http.get<any>(`${this.baseUrl}/circuits/mechanosensory`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      map(response => this.transformCircuitData(response)),
      catchError(this.handleError<NeuralCircuit>('getMechanosensoryCircuit')),
      map(circuit => {
        this.loadingSubject.next(false);
        return circuit;
      })
    );
  }

  /**
   * Get annotations for a brain region or neuron type
   * @param annotationType - Type of annotation to retrieve
   * @param identifier - Specific identifier for the annotation
   */
  getAnnotations(annotationType: string, identifier: string): Observable<any> {
    const params = new HttpParams()
      .set('type', annotationType)
      .set('id', identifier);
    
    return this.http.get<any>(`${this.baseUrl}/annotations`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      timeout(this.requestTimeout),
      retry(this.maxRetries),
      catchError(this.handleError<any>('getAnnotations'))
    );
  }

  /**
   * Private helper methods
   */
  
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'NeuroVis3D/0.1.0'
    });
  }

  private transformNeuronData(data: any): Neuron {
    return {
      id: data.id || data.segment_id,
      cellType: data.cell_type || 'unknown',
      brainRegion: data.brain_region || 'unknown',
      hemisphere: data.hemisphere || 'unknown',
      neurotransmitter: data.neurotransmitter || 'unknown',
      position: {
        x: data.position?.x || 0,
        y: data.position?.y || 0,
        z: data.position?.z || 0
      },
      morphology: {
        somaRadius: data.soma_radius || 0,
        totalLength: data.total_length || 0,
        branchPoints: data.branch_points || 0,
        synapseCount: data.synapse_count || 0
      },
      metadata: {
        confidence: data.confidence || 0,
        volume: data.volume || 0,
        boundingBox: data.bounding_box || null,
        annotations: data.annotations || []
      }
    };
  }

  private transformSynapseData(data: any): Synapse {
    return {
      id: data.id,
      presynapticId: data.presynaptic_id,
      postsynapticId: data.postsynaptic_id,
      weight: data.weight || 1,
      position: {
        x: data.position?.x || 0,
        y: data.position?.y || 0,
        z: data.position?.z || 0
      },
      type: data.type || 'chemical',
      confidence: data.confidence || 0,
      metadata: data.metadata || {}
    };
  }

  private transformConnectivityMatrix(data: any): ConnectivityMatrix {
    return {
      presynapticIds: data.presynaptic_ids,
      postsynapticIds: data.postsynaptic_ids,
      matrix: data.matrix,
      weights: data.weights || null,
      metadata: {
        totalConnections: data.total_connections || 0,
        averageWeight: data.average_weight || 0,
        sparsity: data.sparsity || 0
      }
    };
  }

  private transformCircuitData(data: any): NeuralCircuit {
    return {
      id: data.id,
      name: data.name || 'Mechanosensory Circuit',
      neurons: data.neurons?.map((n: any) => this.transformNeuronData(n)) || [],
      synapses: data.synapses?.map((s: any) => this.transformSynapseData(s)) || [],
      metadata: {
        description: data.description || '',
        functionalRole: data.functional_role || 'mechanosensory processing',
        brainRegions: data.brain_regions || [],
        cellTypes: data.cell_types || []
      }
    };
  }

  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      this.loadingSubject.next(false);
      
      // Log error details for debugging
      if (error.status) {
        console.error(`HTTP Error ${error.status}: ${error.message}`);
      }
      
      // Return empty result to keep app running
      return throwError(() => new Error(`${operation} failed: ${error.message || error}`));
    };
  }
} 