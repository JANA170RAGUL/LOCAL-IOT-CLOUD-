export interface AIEngineItem {
  id: number;
  name: string;
  category: string;
  status: 'Ready' | 'Training' | 'Running' | 'Stopped';
  model: string;
  accuracy: string;
  latency: string;
  lastTrained: string;
  deployment: 'Edge Node' | 'NVIDIA RTX Cloud' | 'CPU Cluster' | 'Embedded MCU' | 'Unassigned';
  datasetVersion: string;
  domain: 'Vision' | 'Analytics' | 'Decision AI' | 'Generative AI' | 'Audio AI' | 'IoT AI' | 'Cybersecurity' | 'MLOps' | 'Agriculture' | 'Industrial' | 'Energy' | 'Healthcare' | 'Smart City' | 'Logistics';
}

export const ALL_AI_ENGINES: AIEngineItem[] = [
  // 1-8: Core Vision
  { id: 1, name: 'Vision AI Engine', category: 'Computer Vision', status: 'Ready', model: 'YOLOv11x-Vision', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Vision' },
  { id: 2, name: 'Object Detection Engine', category: 'Vision', status: 'Ready', model: 'YOLOv11-seg', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Vision' },
  { id: 3, name: 'Image Classification Engine', category: 'Vision', status: 'Ready', model: 'ViT-Base-384', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Vision' },
  { id: 4, name: 'Image Segmentation Engine', category: 'Vision', status: 'Ready', model: 'Segment Anything SAM2', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Vision' },
  { id: 5, name: 'OCR Engine', category: 'Vision', status: 'Ready', model: 'PaddleOCR v4', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Vision' },
  { id: 6, name: 'Face Recognition Engine', category: 'Vision', status: 'Ready', model: 'ArcFace-ResNet100', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Vision' },
  { id: 7, name: 'Pose Estimation Engine', category: 'Vision', status: 'Ready', model: 'MediaPipe-v2', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Vision' },
  { id: 8, name: 'Video Analytics Engine', category: 'Vision', status: 'Ready', model: 'DeepSORT-YOLO', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Vision' },

  // 9-13: Analytics
  { id: 9, name: 'Time-Series Forecasting Engine', category: 'Analytics', status: 'Ready', model: 'DeepAR + Prophet', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Analytics' },
  { id: 10, name: 'Sensor Analytics Engine', category: 'Analytics', status: 'Ready', model: 'XGBoost v2.0', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Analytics' },
  { id: 11, name: 'Anomaly Detection Engine', category: 'Analytics', status: 'Ready', model: 'Isolation Forest + AE', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Analytics' },
  { id: 12, name: 'Predictive Maintenance Engine', category: 'Analytics', status: 'Ready', model: 'LSTM-Attention', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Analytics' },
  { id: 13, name: 'Failure Prediction Engine', category: 'Analytics', status: 'Ready', model: 'Random Forest Ensemble', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Analytics' },

  // 14-17: Decision AI
  { id: 14, name: 'Recommendation Engine', category: 'Decision AI', status: 'Ready', model: 'Two-Tower Neural Net', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Decision AI' },
  { id: 15, name: 'Decision Support Engine', category: 'Decision AI', status: 'Ready', model: 'Reinforcement PPO', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Decision AI' },
  { id: 16, name: 'Optimization Engine', category: 'Decision AI', status: 'Ready', model: 'MILP Solver + RL', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Decision AI' },
  { id: 17, name: 'Alert Intelligence Engine', category: 'Decision AI', status: 'Ready', model: 'Rule-GNN Engine', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Decision AI' },

  // 18-22: Simulation & Generative AI
  { id: 18, name: 'Digital Twin Engine', category: 'Simulation', status: 'Ready', model: 'Physics-Informed PINN', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Generative AI' },
  { id: 19, name: 'LLM Chat Engine', category: 'Generative AI', status: 'Ready', model: 'Llama-3.2-8B-Instruct', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Generative AI' },
  { id: 20, name: 'RAG Knowledge Engine', category: 'Generative AI', status: 'Ready', model: 'LangChain + BGE-Large', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Generative AI' },
  { id: 21, name: 'Report Generation Engine', category: 'Generative AI', status: 'Ready', model: 'GPT-4o-Mini Agent', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Generative AI' },
  { id: 22, name: 'Document AI Engine', category: 'Generative AI', status: 'Ready', model: 'LayoutLMv3', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Generative AI' },

  // 23-30: Audio, IoT & MLOps
  { id: 23, name: 'Speech Recognition Engine', category: 'Audio AI', status: 'Ready', model: 'Whisper-v3-Turbo', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Audio AI' },
  { id: 24, name: 'Text-to-Speech Engine', category: 'Audio AI', status: 'Ready', model: 'VITS Synthesizer', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Audio AI' },
  { id: 25, name: 'Device Health Engine', category: 'IoT AI', status: 'Ready', model: 'Embedded TFLite', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Embedded MCU', datasetVersion: 'v1.0-base', domain: 'IoT AI' },
  { id: 26, name: 'Energy Optimization Engine', category: 'IoT AI', status: 'Ready', model: 'SAC Reinforcement', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'IoT AI' },
  { id: 27, name: 'Security AI Engine', category: 'Cybersecurity', status: 'Ready', model: 'Snort-AI GNN', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Cybersecurity' },
  { id: 28, name: 'AutoML Engine', category: 'MLOps', status: 'Ready', model: 'Auto-Sklearn 2.0', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'MLOps' },
  { id: 29, name: 'Model Deployment Engine', category: 'MLOps', status: 'Ready', model: 'Triton Inference Server', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'MLOps' },
  { id: 30, name: 'Model Monitoring Engine', category: 'MLOps', status: 'Ready', model: 'Evidently AI Drift', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'MLOps' },

  // 31-45: Smart Agriculture AI Engines
  { id: 31, name: 'Pest Detection Engine', category: 'Agriculture', status: 'Running', model: 'YOLOv11-Agri (pest_detector.pt)', accuracy: '97.4% mAP', latency: '18 ms', lastTrained: 'Active Model', deployment: 'Edge Node', datasetVersion: 'v1.0 (97 classes)', domain: 'Agriculture' },
  { id: 32, name: 'Plant Disease Detection Engine', category: 'Agriculture', status: 'Ready', model: 'ResNet50-Agri', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 33, name: 'Weed Detection Engine', category: 'Agriculture', status: 'Ready', model: 'Segment-Anything Weed', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 34, name: 'Crop Detection Engine', category: 'Agriculture', status: 'Ready', model: 'EfficientNet-B4', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 35, name: 'Crop Growth Stage Engine', category: 'Agriculture', status: 'Ready', model: 'ConvNeXt-Small', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 36, name: 'Nutrient Deficiency Engine', category: 'Agriculture', status: 'Ready', model: 'Swin Transformer', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 37, name: 'Soil Classification Engine', category: 'Agriculture', status: 'Ready', model: 'XGBoost-Soil', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 38, name: 'Yield Prediction Engine', category: 'Agriculture', status: 'Ready', model: 'CatBoost Ensemble', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 39, name: 'Irrigation Recommendation Engine', category: 'Agriculture', status: 'Ready', model: 'Fuzzy Logic + RL', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 40, name: 'Fertilizer Recommendation Engine', category: 'Agriculture', status: 'Ready', model: 'NPK-NeuralNet', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 41, name: 'Pest Forecasting Engine', category: 'Agriculture', status: 'Ready', model: 'Spatio-Temporal GNN', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 42, name: 'Harvest Prediction Engine', category: 'Agriculture', status: 'Ready', model: 'Prophet-Crop', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 43, name: 'Fruit Detection Engine', category: 'Agriculture', status: 'Ready', model: 'YOLOv11-Fruit', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 44, name: 'Plant Counting Engine', category: 'Agriculture', status: 'Ready', model: 'CSRNet Crowding', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Agriculture' },
  { id: 45, name: 'Weather Intelligence Engine', category: 'Agriculture', status: 'Ready', model: 'MetNet-3', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Agriculture' },

  // 46-55: Industrial AI Engines
  { id: 46, name: 'Machine Health Engine', category: 'Industrial', status: 'Ready', model: 'Vibration AutoEncoder', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Industrial' },
  { id: 47, name: 'Defect Detection Engine', category: 'Industrial', status: 'Ready', model: 'AnomalyDINO', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Industrial' },
  { id: 48, name: 'Quality Inspection Engine', category: 'Industrial', status: 'Ready', model: 'HighRes Vision-AI', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Industrial' },
  { id: 49, name: 'PLC Analytics Engine', category: 'Industrial', status: 'Ready', model: 'Modbus-RNN', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Embedded MCU', datasetVersion: 'v1.0-base', domain: 'Industrial' },
  { id: 50, name: 'Production Forecasting Engine', category: 'Industrial', status: 'Ready', model: 'Temporal Fusion TFT', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Industrial' },
  { id: 51, name: 'OEE Analytics Engine', category: 'Industrial', status: 'Ready', model: 'OEE-Net Engine', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Industrial' },
  { id: 52, name: 'Robot Monitoring Engine', category: 'Industrial', status: 'Ready', model: 'Kinematic-GNN', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Industrial' },
  { id: 53, name: 'Worker Safety Engine', category: 'Industrial', status: 'Ready', model: 'PoseNet-Safety', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Industrial' },
  { id: 54, name: 'PPE Detection Engine', category: 'Industrial', status: 'Ready', model: 'YOLOv11-PPE', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Industrial' },
  { id: 55, name: 'Smoke & Fire Detection Engine', category: 'Industrial', status: 'Ready', model: 'FlameVision-AI', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Industrial' },

  // 56-60: Energy AI Engines
  { id: 56, name: 'Smart Meter Analytics Engine', category: 'Energy', status: 'Ready', model: 'MeterNet XGB', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Energy' },
  { id: 57, name: 'Load Forecasting Engine', category: 'Energy', status: 'Ready', model: 'ST-GCN Load', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Energy' },
  { id: 58, name: 'Solar Forecasting Engine', category: 'Energy', status: 'Ready', model: 'Irradiance Net', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Energy' },
  { id: 59, name: 'Battery Health Engine', category: 'Energy', status: 'Ready', model: 'SOH Electrochemical', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Embedded MCU', datasetVersion: 'v1.0-base', domain: 'Energy' },
  { id: 60, name: 'Grid Fault Detection Engine', category: 'Energy', status: 'Ready', model: 'Wavelet-Transformer', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Energy' },

  // 61-65: Healthcare AI Engines
  { id: 61, name: 'Patient Monitoring Engine', category: 'Healthcare', status: 'Ready', model: 'VitalSign-RNN', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Healthcare' },
  { id: 62, name: 'ECG Analysis Engine', category: 'Healthcare', status: 'Ready', model: '1D-CNN Arrhythmia', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Healthcare' },
  { id: 63, name: 'Fall Detection Engine', category: 'Healthcare', status: 'Ready', model: '3D-Pose FallNet', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Healthcare' },
  { id: 64, name: 'Medical Image AI Engine', category: 'Healthcare', status: 'Ready', model: 'MedSAM Segmenter', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Healthcare' },
  { id: 65, name: 'Disease Prediction Engine', category: 'Healthcare', status: 'Ready', model: 'BioBERT + XGB', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Healthcare' },

  // 66-70: Smart City AI Engines
  { id: 66, name: 'Traffic Analytics Engine', category: 'Smart City', status: 'Ready', model: 'Traffic-YOLO + DeepSORT', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'NVIDIA RTX Cloud', datasetVersion: 'v1.0-base', domain: 'Smart City' },
  { id: 67, name: 'Parking Detection Engine', category: 'Smart City', status: 'Ready', model: 'ParkVision-Net', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Smart City' },
  { id: 68, name: 'Vehicle Detection Engine', category: 'Smart City', status: 'Ready', model: 'LicensePlate-OCR', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Smart City' },
  { id: 69, name: 'Air Quality Prediction Engine', category: 'Smart City', status: 'Ready', model: 'AQI-LSTM Ensemble', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Smart City' },
  { id: 70, name: 'Flood Prediction Engine', category: 'Smart City', status: 'Ready', model: 'Hydro-GNN Model', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Smart City' },

  // 71-75: Logistics AI Engines
  { id: 71, name: 'Fleet Monitoring Engine', category: 'Logistics', status: 'Ready', model: 'Telematics-Net', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Logistics' },
  { id: 72, name: 'Route Optimization Engine', category: 'Logistics', status: 'Ready', model: 'OR-Tools + RL', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Logistics' },
  { id: 73, name: 'ETA Prediction Engine', category: 'Logistics', status: 'Ready', model: 'Uber H3 + GNN', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'CPU Cluster', datasetVersion: 'v1.0-base', domain: 'Logistics' },
  { id: 74, name: 'Asset Tracking Engine', category: 'Logistics', status: 'Ready', model: 'BLE-Triangulation AI', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Embedded MCU', datasetVersion: 'v1.0-base', domain: 'Logistics' },
  { id: 75, name: 'Warehouse AI Engine', category: 'Logistics', status: 'Ready', model: 'AGV Fleet Planner', accuracy: 'Not Trained', latency: '-', lastTrained: 'Not Trained', deployment: 'Edge Node', datasetVersion: 'v1.0-base', domain: 'Logistics' },
];
