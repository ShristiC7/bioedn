// Common types for the BioDiversity Analytics Platform

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'citizen' | 'researcher' | 'admin';
  points: number;
  createdAt: string;
}

export interface Location {
  lat: number;
  lng: number;
  name?: string;
  depth?: number;
}

export interface Sample {
  id: string;
  userId: string;
  filename: string;
  originalFormat: string;
  processedFormat?: string;
  location: Location;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  metadata?: {
    temperature?: number;
    salinity?: number;
    ph?: number;
    collectionDate?: string;
    collector?: string;
    equipment?: string;
    notes?: string;
  };
  uploadedAt: string;
  processedAt?: string;
}

export interface Species {
  id: string;
  name: string;
  scientificName: string;
  commonName?: string;
  category: 'fish' | 'coral' | 'algae' | 'invertebrate' | 'reptile' | 'mammal';
  conservationStatus?: string; // IUCN Red List status
  isInvasive: boolean;
  isEndangered: boolean;
  description?: string;
  imageUrl?: string;
  habitat?: string;
  depth_range?: {
    min: number;
    max: number;
  };
}

export interface Detection {
  id: string;
  sampleId: string;
  speciesId: string;
  confidence: number; // 0-1
  abundance?: number;
  sequence?: string;
  detectedAt: string;
  species?: Species; // Populated when needed
}

export interface Alert {
  id: string;
  detectionId: string;
  type: 'endangered' | 'invasive' | 'biodiversity_change' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location: Location;
  isRead: boolean;
  createdAt: string;
  detection?: Detection; // Populated when needed
}

export interface Prediction {
  id: string;
  location: Location;
  timeframe: '30_days' | '90_days' | '1_year';
  predictedChange: number; // Percentage change
  confidence: number; // 0-100
  factors?: {
    temperature?: number;
    salinity?: number;
    ph?: number;
    depth?: number;
    seasonality?: number;
    humanActivity?: number;
  };
  analysis?: string[];
  recommendations?: string[];
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  type: 'first_sample' | 'explorer' | 'conservationist' | 'top_contributor' | 'researcher' | 'guardian';
  title: string;
  description: string;
  points: number;
  earnedAt: string;
  badge_url?: string;
}

// Dashboard and Analytics Types
export interface DashboardStats {
  speciesCount: number;
  activeSamples: number;
  alertsCount: number;
  citizenCount: number;
  totalSamples?: number;
  totalDetections?: number;
  averageConfidence?: number;
}

export interface SpeciesDistribution {
  category: string;
  count: number;
  percentage: number;
  change?: number; // Percentage change from previous period
}

export interface ActivityFeed {
  id: string;
  type: 'detection' | 'alert' | 'processing' | 'prediction' | 'user' | 'system';
  timestamp: string;
  message: string;
  userId?: string;
  sampleId?: string;
  detectionId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
}

export interface Hotspot {
  id: string;
  location: Location;
  speciesCount: number;
  samplesCount: number;
  type: 'high' | 'medium' | 'low' | 'alert';
  alerts?: number;
  biodiversityIndex?: number;
  lastUpdated: string;
  trends?: {
    speciesChange: number;
    timeframe: string;
  };
}

// File Processing Types
export interface FileConversionJob {
  id: string;
  filename: string;
  inputFormat: string;
  outputFormat: string;
  status: 'queued' | 'converting' | 'completed' | 'failed';
  progress?: number; // 0-100
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SequenceData {
  header: string;
  sequence: string;
  quality?: number[];
  length: number;
  gcContent?: number;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'connected' | 'sample_processed' | 'sample_error' | 'new_detection' | 'new_alert' | 'ping' | 'pong';
  data?: any;
  message?: string;
  timestamp?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form Types
export interface SampleUploadForm {
  file: File;
  location: Location;
  metadata?: {
    temperature?: number;
    salinity?: number;
    ph?: number;
    collectionDate?: string;
    notes?: string;
  };
}

export interface UserRegistrationForm {
  username: string;
  email: string;
  password: string;
  role?: 'citizen' | 'researcher';
  organization?: string;
}

// Chart and Visualization Types
export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  predicted?: boolean;
  confidence?: number;
}

export interface GeospatialData {
  type: 'Feature' | 'FeatureCollection';
  geometry: {
    type: 'Point' | 'Polygon' | 'LineString';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    [key: string]: any;
  };
}

// Filter and Search Types
export interface SampleFilter {
  status?: Sample['status'][];
  location?: {
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  dateRange?: {
    start: string;
    end: string;
  };
  species?: string[];
  confidence?: {
    min: number;
    max: number;
  };
}

export interface SpeciesFilter {
  category?: Species['category'][];
  conservationStatus?: string[];
  invasive?: boolean;
  endangered?: boolean;
  search?: string;
}

// Configuration Types
export interface MapConfig {
  center: Location;
  zoom: number;
  layers: {
    hotspots: boolean;
    samples: boolean;
    alerts: boolean;
    bathymetry: boolean;
  };
  style: 'satellite' | 'terrain' | 'ocean';
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  alerts: {
    endangered: boolean;
    invasive: boolean;
    environmental: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  context?: {
    userId?: string;
    sampleId?: string;
    action?: string;
  };
}

// Export all types as a namespace as well
export namespace BiodiversityTypes {
  export type { User, Sample, Species, Detection, Alert, Prediction, Achievement };
  export type { DashboardStats, SpeciesDistribution, ActivityFeed, Hotspot };
  export type { FileConversionJob, SequenceData, WebSocketMessage };
  export type { ApiResponse, PaginatedResponse };
  export type { SampleUploadForm, UserRegistrationForm };
  export type { ChartDataPoint, TimeSeriesData, GeospatialData };
  export type { SampleFilter, SpeciesFilter };
  export type { MapConfig, NotificationSettings };
  export type { AppError };
}
