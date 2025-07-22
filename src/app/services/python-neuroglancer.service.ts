import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface PythonCircuit {
  name: string;
  neurons: PythonNeuron[];
  type: string;
  color: string;
}

export interface PythonNeuron {
  id: string;
  type: string;
  position: [number, number, number];
  activity: number;
}

export interface NeuroglancerResponse {
  success: boolean;
  neuroglancer_url?: string;
  circuits?: PythonCircuit[];
  count?: number;
  error?: string;
  data_source?: string;
  total_circuits?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PythonNeuroglancerService {
  // Support both local development and Cloud Run production
  private readonly baseUrl = this.getBackendUrl();
  private readonly neuroglancerUrl$ = new BehaviorSubject<string | null>(null);
  private readonly isConnected$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    console.log(`🔌 CHRIMSON Backend URL: ${this.baseUrl}`);
    this.checkConnection();
  }

  /**
   * Determine backend URL based on environment
   * Updated to use cloud-based FlyWire data backend (SSL-free!)
   */
  private getBackendUrl(): string {
    // Check if we're running on Firebase (production)
    if (window.location.hostname.includes('neurovis-3d.web.app') || 
        window.location.hostname.includes('neurovis-3d.firebaseapp.com')) {
      // Production: Use new cloud-based FlyWire backend (SSL issues resolved!)
      return 'https://neuroglancer-backend-359448340087.us-central1.run.app/api';
    } else {
      // Development: Use local cloud backend for testing
      return 'http://localhost:5000/api';
    }
  }

  /**
   * Check if cloud-based FlyWire backend is running
   */
  checkConnection(): Observable<boolean> {
    console.log(`🧪 Testing connection to cloud FlyWire backend: ${this.baseUrl}/health`);
    return this.http.get<any>(`${this.baseUrl}/health`).pipe(
      map(response => {
        const connected = response.status === 'healthy';
        console.log(`🔗 Cloud backend connection: ${connected ? 'SUCCESS' : 'FAILED'}`);
        console.log(`☁️ Data source: ${response.data_source || 'unknown'}`);
        console.log(`🔒 SSL issues: ${response.ssl_issues || 'unknown'}`);
        console.log(`📊 Neurons available: ${response.neurons_available?.toLocaleString() || 0}`);
        console.log(`📈 Cache status: ${response.cache_status || 'unknown'}`);
        
        this.isConnected$.next(connected);
        if (response.neuroglancer_url) {
          this.neuroglancerUrl$.next(response.neuroglancer_url);
          console.log(`🎯 Neuroglancer URL: ${response.neuroglancer_url}`);
        }
        return connected;
      }),
      catchError((error) => {
        console.error(`❌ Cloud backend connection failed:`, error);
        console.log(`🔧 Trying to connect to: ${this.baseUrl}`);
        console.log(`💡 Make sure cloud backend is deployed and running`);
        this.isConnected$.next(false);
        return [false];
      })
    );
  }

  /**
   * Search for CHRIMSON circuits from cloud-based FlyWire data
   * SSL issues resolved by using pre-downloaded data from GitHub!
   */
  searchCHRIMSONCircuits(): Observable<PythonCircuit[]> {
    console.log(`🔍 Searching CHRIMSON circuits from cloud FlyWire data...`);
    console.log(`✅ No SSL issues - using pre-downloaded FlyWire data!`);
    return this.http.get<NeuroglancerResponse>(`${this.baseUrl}/circuits/search`).pipe(
      map(response => {
        if (response.success && response.circuits) {
          console.log(`✅ Found ${response.circuits.length} REAL circuits from FlyWire`);
          console.log(`🧠 Total neurons loaded: ${response.count || 0}`);
          console.log(`☁️ Data source: ${response.data_source || 'cloud'}`);
          return response.circuits;
        } else {
          console.error(`❌ Circuit search failed: ${response.error}`);
          throw new Error(response.error || 'Circuit search failed');
        }
      }),
      catchError((error) => {
        console.error(`❌ CHRIMSON circuit search error:`, error);
        return [];
      })
    );
  }

  /**
   * Create Neuroglancer visualization
   */
  createVisualization(): Observable<string> {
    console.log(`🎨 Creating REAL Neuroglancer visualization...`);
    return this.http.post<NeuroglancerResponse>(`${this.baseUrl}/visualization/create`, {}).pipe(
      map(response => {
        if (response.success && response.neuroglancer_url) {
          console.log(`✅ Visualization created: ${response.neuroglancer_url}`);
          this.neuroglancerUrl$.next(response.neuroglancer_url);
          return response.neuroglancer_url;
        } else {
          console.error(`❌ Visualization creation failed: ${response.error}`);
          throw new Error(response.error || 'Visualization creation failed');
        }
      }),
      catchError((error) => {
        console.error(`❌ Visualization creation error:`, error);
        throw error;
      })
    );
  }

  /**
   * Update circuit activity with FEM data
   */
  updateCircuitActivity(femData: any): Observable<boolean> {
    console.log(`🔄 Updating REAL circuit activity...`);
    return this.http.post<NeuroglancerResponse>(`${this.baseUrl}/activity/update`, femData).pipe(
      map(response => {
        if (response.success) {
          console.log(`✅ Circuit activity updated`);
          return true;
        } else {
          console.error(`❌ Activity update failed: ${response.error}`);
          return false;
        }
      }),
      catchError((error) => {
        console.error(`❌ Activity update error:`, error);
        return [false];
      })
    );
  }

  /**
   * Get current circuits
   */
  getCurrentCircuits(): Observable<PythonCircuit[]> {
    return this.http.get<NeuroglancerResponse>(`${this.baseUrl}/circuits/current`).pipe(
      map(response => {
        if (response.success && response.circuits) {
          return response.circuits;
        }
        return [];
      }),
      catchError(() => [])
    );
  }

  /**
   * Get connection status observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  /**
   * Get Neuroglancer URL observable
   */
  getNeuroglancerUrl(): Observable<string | null> {
    return this.neuroglancerUrl$.asObservable();
  }
} 