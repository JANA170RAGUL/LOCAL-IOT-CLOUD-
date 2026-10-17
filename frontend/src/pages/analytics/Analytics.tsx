import React from 'react';
import { useNavigate } from 'react-router';
import ReactECharts from 'echarts-for-react';
import {
  BarChart3,
  Download,
  Activity,
  Building2,
  Cpu,
  AlertTriangle,
  Lock,
  Inbox,
  Radio
} from 'lucide-react';
import { useLicenseStatus } from '@/features/settings/api/license';
import {
  usePlatformOverview,
  useLiveStatus,
  useAlertAnalytics,
  useRuleAnalytics,
  useSensorActivity,
  useTelemetryTrends
} from '@/features/analytics/hooks/useAnalytics';

export const Analytics = () => {
  const navigate = useNavigate();
  const { data: licenseStatus, isLoading: isLicenseLoading } = useLicenseStatus();

  const isAnalyticsLicensed =
    (licenseStatus?.status === 'ACTIVE' || licenseStatus?.status === 'VALID') &&
    Boolean(
      licenseStatus?.features?.analytics ||
      licenseStatus?.features?.Analytics ||
      licenseStatus?.plan === 'Enterprise'
    );

  const { data: overview } = usePlatformOverview(isAnalyticsLicensed);
  const { data: liveStatus } = useLiveStatus(isAnalyticsLicensed);
  const { data: alerts } = useAlertAnalytics(isAnalyticsLicensed);
  const { data: rules } = useRuleAnalytics(isAnalyticsLicensed);
  const { data: sensors } = useSensorActivity(isAnalyticsLicensed);
  const { data: trends } = useTelemetryTrends(isAnalyticsLicensed);

  if (!isLicenseLoading && !isAnalyticsLicensed) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6 font-sans animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Analytics Module Not Licensed
          </h2>
          <p className="text-sm text-slate-500 max-w-md">
            The executive platform analytics engine requires an active Enterprise license with the Analytics feature key enabled.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Manage License
          </button>
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (!overview || !liveStatus) return;

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Organizations,${overview.organizations || 0}\n` +
      `Devices,${overview.devices || 0}\n` +
      `Online Devices,${liveStatus.online_devices || 0}\n` +
      `Offline Devices,${liveStatus.offline_devices || 0}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'platform_analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const healthPercent =
    liveStatus && overview?.devices && overview.devices > 0
      ? Math.round((liveStatus.online_devices / overview.devices) * 100)
      : 100;

  // STRICT REAL DATA FROM BACKEND ONLY (NO FAKE / FALLBACK HARDCODED ARRAYS)
  const hasTrendsData = Boolean(trends?.chart_data && trends.chart_data.length > 0);
  const trendXData = hasTrendsData ? trends!.chart_data.map((d) => d.time) : [];
  const trendYData = hasTrendsData ? trends!.chart_data.map((d) => d.value) : [];

  const trendOption = {
    title: {
      text: 'Telemetry & Device Active Trend',
      textStyle: { color: '#0f172a', fontSize: 14, fontWeight: 'bold', fontFamily: 'Inter, sans-serif' },
      top: 0,
      left: 0
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#ffffff', fontSize: 12 }
    },
    grid: { top: 48, left: 36, right: 24, bottom: 28 },
    xAxis: {
      type: 'category',
      data: trendXData,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    series: [
      {
        data: trendYData,
        type: 'line',
        smooth: true,
        symbolSize: 6,
        lineStyle: { width: 3, color: '#2563EB' },
        itemStyle: { color: '#2563EB' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.35)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.02)' }
            ]
          }
        }
      }
    ]
  };

  // STRICT REAL DATA FOR AUTOMATION RULES
  const hasRulesData = Boolean(rules && rules.length > 0);
  const ruleYData = hasRulesData ? rules!.map((r) => r.rule) : [];
  const ruleXData = hasRulesData ? rules!.map((r) => r.count) : [];

  const ruleOption = {
    title: {
      text: 'Most Triggered Automation Rules',
      textStyle: { color: '#0f172a', fontSize: 14, fontWeight: 'bold', fontFamily: 'Inter, sans-serif' },
      top: 0,
      left: 0
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#ffffff', fontSize: 12 }
    },
    grid: { top: 48, left: 100, right: 24, bottom: 28 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    yAxis: {
      type: 'category',
      data: ruleYData,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#475569', fontSize: 11, fontWeight: 'medium' }
    },
    series: [
      {
        type: 'bar',
        data: ruleXData,
        barWidth: 16,
        itemStyle: {
          color: '#6366F1',
          borderRadius: [0, 6, 6, 0]
        }
      }
    ]
  };

  // STRICT REAL DATA FOR SENSOR TYPES
  const hasSensorsData = Boolean(sensors && sensors.length > 0);
  const sensorData = hasSensorsData
    ? sensors!.map((s) => ({ value: s.readings, name: s.sensor }))
    : [];

  const sensorOption = {
    title: {
      text: 'Sensor Telemetry Distribution',
      textStyle: { color: '#0f172a', fontSize: 14, fontWeight: 'bold', fontFamily: 'Inter, sans-serif' },
      top: 0,
      left: 0
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#ffffff', fontSize: 12 }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'middle',
      textStyle: { color: '#475569', fontSize: 11, fontWeight: 'medium' }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['38%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#ffffff',
          borderWidth: 2
        },
        label: { show: false },
        color: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
        data: sensorData
      }
    ]
  };

  // GATEWAY FLEET HEALTH GAUGE (REAL DATA)
  const gatewayHealthValue =
    liveStatus && overview?.gateways && overview.gateways > 0
      ? Math.round((liveStatus.online_gateways / overview.gateways) * 100)
      : 100;

  const gatewayGaugeOption = {
    title: {
      text: 'Gateway Fleet Health',
      textStyle: { color: '#0f172a', fontSize: 14, fontWeight: 'bold', fontFamily: 'Inter, sans-serif' },
      top: 0,
      left: 0
    },
    series: [
      {
        name: 'Gateway Health',
        type: 'gauge',
        center: ['50%', '60%'],
        radius: '85%',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 5,
        itemStyle: { color: '#2563EB' },
        progress: { show: true, width: 14, roundCap: true },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 14, color: [[1, '#e2e8f0']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#64748b', distance: 18, fontSize: 10 },
        title: { offsetCenter: [0, '20%'], fontSize: 12, color: '#64748b', fontWeight: 'bold' },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '-15%'],
          fontSize: 28,
          fontWeight: 'extrabold',
          formatter: '{value}%',
          color: '#0f172a'
        },
        data: [{ value: gatewayHealthValue, name: 'ONLINE FLEET' }]
      }
    ]
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span>Home</span>
        <span>/</span>
        <span>Analytics</span>
        <span>/</span>
        <span className="text-[#2563EB] font-bold">Platform Analytics</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Platform Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Executive real-time insights, device trends, telemetry breakdown, and rule activity.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 4 KPI Analytics Summary Cards (REAL DATA FROM BACKEND) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Platform Health */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Platform Health</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center gap-2">
            <span>{healthPercent}%</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5">
              🟢 ONLINE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Active device connection health
          </p>
        </div>

        {/* Organizations */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Organizations</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {overview?.organizations ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Corporate enterprise tenants
          </p>
        </div>

        {/* Total Devices */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Devices</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {overview?.devices ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Registered hardware nodes
          </p>
        </div>

        {/* Active Alerts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {alerts?.open ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Unresolved security warnings
          </p>
        </div>

      </div>

      {/* Row 1 Charts: Device Trend & Most Triggered Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Device Telemetry Trend */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between min-h-[350px]">
          {hasTrendsData ? (
            <ReactECharts option={trendOption} style={{ height: '320px', width: '100%' }} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-2">
              <p className="font-bold text-sm text-slate-900 text-left w-full mb-6">Telemetry & Device Active Trend</p>
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                <Inbox className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-700">No Telemetry Trend Data</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Time-series points will render automatically as devices stream live telemetry values.
              </p>
            </div>
          )}
        </div>

        {/* Most Triggered Rules */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between min-h-[350px]">
          {hasRulesData ? (
            <ReactECharts option={ruleOption} style={{ height: '320px', width: '100%' }} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-2">
              <p className="font-bold text-sm text-slate-900 text-left w-full mb-6">Most Triggered Automation Rules</p>
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                <Inbox className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-700">No Rule Executions Recorded</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Automation rule trigger events will appear here once threshold conditions are fired.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Row 2 Charts: Sensor Types & Gateway Health Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sensor Types Distribution */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between min-h-[350px]">
          {hasSensorsData ? (
            <ReactECharts option={sensorOption} style={{ height: '320px', width: '100%' }} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-2">
              <p className="font-bold text-sm text-slate-900 text-left w-full mb-6">Sensor Telemetry Distribution</p>
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                <Inbox className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-700">No Sensor Readings Loaded</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Distribution breakdown across Temperature, Humidity, and Voltage sensors will appear upon ingestion.
              </p>
            </div>
          )}
        </div>

        {/* Gateway Health Gauge */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <ReactECharts option={gatewayGaugeOption} style={{ height: '320px', width: '100%' }} />
        </div>

      </div>

    </div>
  );
};

export default Analytics;
