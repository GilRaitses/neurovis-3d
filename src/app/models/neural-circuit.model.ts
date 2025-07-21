/**
 * Core data models for neural circuit visualization
 * These models define the structure of connectome data from FlyWire
 * and envelope model data from mechanosensory experiments
 */

/**
 * 3D spatial coordinates
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Bounding box for spatial regions
 */
export interface BoundingBox {
  min: Position3D;
  max: Position3D;
}

/**
 * Individual neuron representation
 */
export interface Neuron {
  /** Unique FlyWire segment identifier */
  id: string;
  
  /** Cell type classification (e.g., 'Mi1', 'T4a', 'LC10') */
  cellType: string;
  
  /** Brain region location (e.g., 'medulla', 'lobula', 'central_complex') */
  brainRegion: string;
  
  /** Hemisphere ('left' or 'right') */
  hemisphere: string;
  
  /** Predicted neurotransmitter (e.g., 'acetylcholine', 'GABA', 'glutamate') */
  neurotransmitter: string;
  
  /** 3D position in brain coordinate system */
  position: Position3D;
  
  /** Morphological properties */
  morphology: {
    somaRadius: number;
    totalLength: number;
    branchPoints: number;
    synapseCount: number;
  };
  
  /** Additional metadata */
  metadata: {
    confidence: number;
    volume: number;
    boundingBox: BoundingBox | null;
    annotations: string[];
  };
}

/**
 * Synaptic connection between neurons
 */
export interface Synapse {
  /** Unique synapse identifier */
  id: string;
  
  /** ID of presynaptic neuron */
  presynapticId: string;
  
  /** ID of postsynaptic neuron */
  postsynapticId: string;
  
  /** Synaptic weight/strength */
  weight: number;
  
  /** 3D position of synapse */
  position: Position3D;
  
  /** Synapse type ('chemical' or 'electrical') */
  type: 'chemical' | 'electrical';
  
  /** Detection confidence */
  confidence: number;
  
  /** Additional synapse properties */
  metadata: {
    [key: string]: any;
  };
}

/**
 * Connectivity matrix between neuron populations
 */
export interface ConnectivityMatrix {
  /** Array of presynaptic neuron IDs */
  presynapticIds: string[];
  
  /** Array of postsynaptic neuron IDs */
  postsynapticIds: string[];
  
  /** 2D matrix of connection counts [presynaptic][postsynaptic] */
  matrix: number[][];
  
  /** Optional weight matrix for connection strengths */
  weights?: number[][];
  
  /** Matrix statistics */
  metadata: {
    totalConnections: number;
    averageWeight: number;
    sparsity: number;
  };
}

/**
 * Complete neural circuit representation
 */
export interface NeuralCircuit {
  /** Unique circuit identifier */
  id: string;
  
  /** Circuit name/description */
  name: string;
  
  /** All neurons in the circuit */
  neurons: Neuron[];
  
  /** All synapses in the circuit */
  synapses: Synapse[];
  
  /** Circuit metadata */
  metadata: {
    description: string;
    functionalRole: string;
    brainRegions: string[];
    cellTypes: string[];
  };
}

/**
 * Temporal dynamics for neural activity simulation
 */
export interface TemporalDynamics {
  /** Time points (in seconds) */
  timePoints: number[];
  
  /** Activity levels for each neuron at each time point */
  neuronActivities: {
    neuronId: string;
    activities: number[];
  }[];
  
  /** Simulation parameters */
  parameters: {
    duration: number;
    timeStep: number;
    stimulusOnset: number;
    stimulusDuration: number;
  };
}

/**
 * Envelope model parameters from mechanosensory experiments
 */
export interface EnvelopeModel {
  /** Model identifier */
  id: string;
  
  /** Experimental group name */
  groupName: string;
  
  /** Peak response timing (seconds) */
  peakTime: number;
  
  /** Peak response magnitude (turns/min) */
  peakMagnitude: number;
  
  /** Response duration (seconds) */
  responseDuration: number;
  
  /** Time constant for decay */
  timeConstant: number;
  
  /** Baseline activity level */
  baseline: number;
  
  /** Standard error of measurements */
  standardError: number;
  
  /** Number of tracks/organisms in group */
  sampleSize: number;
  
  /** Stimulus parameters */
  stimulus: {
    type: string;
    intensity: number;
    duration: number;
    pattern: 'constant' | 'stepwise';
  };
  
  /** Temporal profile data */
  timeSeries: {
    time: number[];
    response: number[];
    error: number[];
  };
}

/**
 * Mapping between envelope models and neural circuits
 */
export interface CircuitMapping {
  /** Mapping identifier */
  id: string;
  
  /** Source envelope model */
  envelopeModel: EnvelopeModel;
  
  /** Target neural circuit */
  circuit: NeuralCircuit;
  
  /** Mapping parameters */
  mapping: {
    /** Scaling factor from behavioral response to neural activity */
    scalingFactor: number;
    
    /** Time offset between stimulus and neural response */
    timeOffset: number;
    
    /** Spatial distribution of activity across neurons */
    spatialDistribution: 'uniform' | 'gaussian' | 'exponential';
    
    /** Propagation speed through circuit */
    propagationSpeed: number;
  };
  
  /** Confidence in mapping accuracy */
  confidence: number;
}

/**
 * 3D visualization state
 */
export interface VisualizationState {
  /** Current time point in animation */
  currentTime: number;
  
  /** Animation playback speed */
  playbackSpeed: number;
  
  /** Whether animation is playing */
  isPlaying: boolean;
  
  /** Camera position and orientation */
  camera: {
    position: Position3D;
    target: Position3D;
    up: Position3D;
  };
  
  /** Selected neurons for highlighting */
  selectedNeurons: string[];
  
  /** Visible brain regions */
  visibleRegions: string[];
  
  /** Color scheme for activity visualization */
  colorScheme: 'viridis' | 'plasma' | 'cool' | 'warm';
  
  /** Activity threshold for visibility */
  activityThreshold: number;
  
  /** Transparency settings */
  transparency: {
    inactiveNeurons: number;
    synapses: number;
    brainRegions: number;
  };
}

/**
 * Experimental parameters for simulation
 */
export interface ExperimentParameters {
  /** Experiment identifier */
  id: string;
  
  /** Stimulus configuration */
  stimulus: {
    type: 'mechanical' | 'optical' | 'thermal' | 'chemical';
    intensity: number;
    duration: number;
    frequency?: number;
    pattern: 'pulse' | 'ramp' | 'sine' | 'step';
    onset: number;
  };
  
  /** Population parameters */
  population: {
    size: number;
    variability: number;
    correlations: number[][];
  };
  
  /** Recording parameters */
  recording: {
    duration: number;
    samplingRate: number;
    noiseLevel: number;
  };
  
  /** Analysis parameters */
  analysis: {
    binSize: number;
    smoothingWindow: number;
    thresholds: {
      activity: number;
      significance: number;
    };
  };
}

/**
 * Statistical summary of experimental results
 */
export interface StatisticalSummary {
  /** Number of samples */
  n: number;
  
  /** Mean response */
  mean: number;
  
  /** Standard deviation */
  std: number;
  
  /** Standard error of mean */
  sem: number;
  
  /** 95% confidence interval */
  confidenceInterval: [number, number];
  
  /** Peak response metrics */
  peak: {
    time: number;
    magnitude: number;
    width: number;
  };
  
  /** Statistical tests */
  tests: {
    normality: {
      pValue: number;
      test: string;
    };
    significance: {
      pValue: number;
      test: string;
    };
  };
}

/**
 * Cross-species comparison data
 */
export interface CrossSpeciesComparison {
  /** Species identifiers */
  species: string[];
  
  /** Homologous circuits */
  homologousCircuits: {
    [species: string]: NeuralCircuit;
  };
  
  /** Functional similarities */
  similarities: {
    behavioral: number;
    anatomical: number;
    molecular: number;
  };
  
  /** Evolutionary conservation metrics */
  conservation: {
    neurons: number;
    connections: number;
    dynamics: number;
  };
}

/**
 * Export/import data structures
 */
export interface ExportData {
  /** Export metadata */
  metadata: {
    version: string;
    timestamp: string;
    creator: string;
    description: string;
  };
  
  /** Exported circuits */
  circuits: NeuralCircuit[];
  
  /** Exported envelope models */
  envelopeModels: EnvelopeModel[];
  
  /** Exported mappings */
  mappings: CircuitMapping[];
  
  /** Visualization states */
  visualizationStates: VisualizationState[];
} 