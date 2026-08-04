import { WidgetRegistry } from '../registry/WidgetRegistry';
import { LineWidgetManifest } from './LineWidget';
import { AreaWidgetManifest } from './AreaWidget';
import { BarWidgetManifest } from './BarWidget';
import { GaugeWidgetManifest } from './GaugeWidget';
import { KpiWidgetManifest } from './KpiWidget';
import { ThermometerWidgetManifest } from './industrial/ThermometerWidget';
import { TankLevelWidgetManifest } from './industrial/TankLevelWidget';
import { BatteryWidgetManifest } from './industrial/BatteryWidget';
import { EnergyMeterWidgetManifest } from './industrial/EnergyMeterWidget';
import { FlowMeterWidgetManifest } from './industrial/FlowMeterWidget';
import { PressureGaugeWidgetManifest } from './industrial/PressureGaugeWidget';
import { ValveWidgetManifest } from './controls/ValveWidget';
import { MotorWidgetManifest } from './controls/MotorWidget';
import { PumpWidgetManifest } from './controls/PumpWidget';
import { RelayWidgetManifest } from './controls/RelayWidget';
import { LedIndicatorWidgetManifest } from './controls/LedIndicatorWidget';
import { SwitchWidgetManifest } from './controls/SwitchWidget';
import { CameraWidgetManifest } from './media/CameraWidget';
import { ImageWidgetManifest } from './media/ImageWidget';
import { PdfWidgetManifest } from './media/PdfWidget';
import { FloorLayoutWidgetManifest } from './media/FloorLayoutWidget';
import { GpsWidgetManifest } from './media/GpsWidget';

import { PieChartWidgetManifest } from './charts/PieChartWidget';
import { DonutChartWidgetManifest } from './charts/DonutChartWidget';
import { ScatterPlotWidgetManifest } from './charts/ScatterPlotWidget';
import { BubbleChartWidgetManifest } from './charts/BubbleChartWidget';
import { HeatmapWidgetManifest } from './charts/HeatmapWidget';
import { HistogramWidgetManifest } from './charts/HistogramWidget';
import { RadarChartWidgetManifest } from './charts/RadarChartWidget';
import { PolarChartWidgetManifest } from './charts/PolarChartWidget';
import { BoxPlotWidgetManifest } from './charts/BoxPlotWidget';

import { DigitalCounterWidgetManifest } from './kpi/DigitalCounterWidget';
import { ProgressWidgetManifest } from './kpi/ProgressWidget';
import { StatusCardWidgetManifest } from './kpi/StatusCardWidget';
import { AlarmBannerWidgetManifest } from './kpi/AlarmBannerWidget';

import { TimelineWidgetManifest } from './utility/TimelineWidget';
import { EventLogWidgetManifest } from './utility/EventLogWidget';
import { ClockWidgetManifest } from './utility/ClockWidget';
import { WeatherWidgetManifest } from './utility/WeatherWidget';
import { MarkdownWidgetManifest } from './utility/MarkdownWidget';
import { HtmlWidgetManifest } from './utility/HtmlWidget';
import { IFrameWidgetManifest } from './utility/IFrameWidget';
import { CalendarWidgetManifest } from './utility/CalendarWidget';
import { NotesWidgetManifest } from './utility/NotesWidget';

import { PredictionWidgetManifest } from './ai/PredictionWidget';
import { ForecastWidgetManifest } from './ai/ForecastWidget';
import { AnomalyDetectionWidgetManifest } from './ai/AnomalyDetectionWidget';
import { PredictiveMaintenanceWidgetManifest } from './ai/PredictiveMaintenanceWidget';
import { AiRecommendationWidgetManifest } from './ai/AiRecommendationWidget';
import { AiInsightsWidgetManifest } from './ai/AiInsightsWidget';
import { AiChatWidgetManifest } from './ai/AiChatWidget';
import { RootCauseAnalysisWidgetManifest } from './ai/RootCauseAnalysisWidget';
import { OptimizationWidgetManifest } from './ai/OptimizationWidget';

// Register standard widgets
export function registerStandardWidgets() {
  WidgetRegistry.register(LineWidgetManifest);
  WidgetRegistry.register(AreaWidgetManifest);
  WidgetRegistry.register(BarWidgetManifest);
  WidgetRegistry.register(GaugeWidgetManifest);
  WidgetRegistry.register(KpiWidgetManifest);
  WidgetRegistry.register(ThermometerWidgetManifest);
  WidgetRegistry.register(TankLevelWidgetManifest);
  WidgetRegistry.register(BatteryWidgetManifest);
  WidgetRegistry.register(EnergyMeterWidgetManifest);
  WidgetRegistry.register(FlowMeterWidgetManifest);
  WidgetRegistry.register(PressureGaugeWidgetManifest);
  WidgetRegistry.register(ValveWidgetManifest);
  WidgetRegistry.register(MotorWidgetManifest);
  WidgetRegistry.register(PumpWidgetManifest);
  WidgetRegistry.register(RelayWidgetManifest);
  WidgetRegistry.register(LedIndicatorWidgetManifest);
  WidgetRegistry.register(SwitchWidgetManifest);
  WidgetRegistry.register(CameraWidgetManifest);
  WidgetRegistry.register(ImageWidgetManifest);
  WidgetRegistry.register(PdfWidgetManifest);
  WidgetRegistry.register(FloorLayoutWidgetManifest);
  WidgetRegistry.register(GpsWidgetManifest);
  
  // Advanced Charts
  WidgetRegistry.register(PieChartWidgetManifest);
  WidgetRegistry.register(DonutChartWidgetManifest);
  WidgetRegistry.register(ScatterPlotWidgetManifest);
  WidgetRegistry.register(BubbleChartWidgetManifest);
  WidgetRegistry.register(HeatmapWidgetManifest);
  WidgetRegistry.register(HistogramWidgetManifest);
  WidgetRegistry.register(RadarChartWidgetManifest);
  WidgetRegistry.register(PolarChartWidgetManifest);
  WidgetRegistry.register(BoxPlotWidgetManifest);

  // KPI Widgets
  WidgetRegistry.register(DigitalCounterWidgetManifest);
  WidgetRegistry.register(ProgressWidgetManifest);
  WidgetRegistry.register(StatusCardWidgetManifest);
  WidgetRegistry.register(AlarmBannerWidgetManifest);

  // Utility Widgets
  WidgetRegistry.register(TimelineWidgetManifest);
  WidgetRegistry.register(EventLogWidgetManifest);
  WidgetRegistry.register(ClockWidgetManifest);
  WidgetRegistry.register(WeatherWidgetManifest);
  WidgetRegistry.register(MarkdownWidgetManifest);
  WidgetRegistry.register(HtmlWidgetManifest);
  WidgetRegistry.register(IFrameWidgetManifest);
  WidgetRegistry.register(CalendarWidgetManifest);
  WidgetRegistry.register(NotesWidgetManifest);

  // AI Widgets
  WidgetRegistry.register(PredictionWidgetManifest);
  WidgetRegistry.register(ForecastWidgetManifest);
  WidgetRegistry.register(AnomalyDetectionWidgetManifest);
  WidgetRegistry.register(PredictiveMaintenanceWidgetManifest);
  WidgetRegistry.register(AiRecommendationWidgetManifest);
  WidgetRegistry.register(AiInsightsWidgetManifest);
  WidgetRegistry.register(AiChatWidgetManifest);
  WidgetRegistry.register(RootCauseAnalysisWidgetManifest);
  WidgetRegistry.register(OptimizationWidgetManifest);
}

// Automatically register them upon import
registerStandardWidgets();

export { WidgetRenderer } from './WidgetRenderer';
