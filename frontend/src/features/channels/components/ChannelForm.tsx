import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Radio,
  Plus,
  Trash2,
  Lock,
  Globe,
  ShieldCheck,
  Tag,
  FileText,
  Layers,
  ChevronDown,
  Save
} from 'lucide-react';
import { channelsApi, ChannelField } from '../api/channels';

export const ChannelForm: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'enterprise'>('private');
  const [submitting, setSubmitting] = useState(false);
  
  const [fields, setFields] = useState<ChannelField[]>([
    { field_key: 'field1', name: '', unit: '', data_type: 'float' }
  ]);

  const addField = () => {
    if (fields.length >= 8) return;
    setFields([
      ...fields, 
      { field_key: `field${fields.length + 1}`, name: '', unit: '', data_type: 'float' }
    ]);
  };

  const removeField = (index: number) => {
    if (fields.length <= 1) return;
    const newFields = [...fields];
    newFields.splice(index, 1);
    const reindexed = newFields.map((f, i) => ({ ...f, field_key: `field${i + 1}` }));
    setFields(reindexed);
  };

  const updateField = (index: number, key: keyof ChannelField, value: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const validFields = fields.filter(f => f.name.trim() !== '');
      const channel = await channelsApi.createChannel({
        name,
        description,
        visibility,
        fields: validFields
      });
      navigate(`/channels/${channel.id}`);
    } catch (error) {
      console.error("Failed to create channel", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Back Button & Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/channels')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer mb-4"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Channels</span>
        </button>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create Channel
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Set up telemetry stream visibility and field data mappings.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* General Information Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              General Information
            </h2>
            <p className="text-xs text-slate-500">
              Basic identification and privacy settings for this stream.
            </p>
          </div>

          <div className="space-y-4">
            {/* Channel Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Channel Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Radio className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Weather Station Alpha"
                  className="w-full h-[48px] pl-10 pr-4 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the telemetry stream purpose..."
                  className="w-full pl-10 pr-4 pt-3 pb-3 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 rounded-[10px] text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none min-h-[90px]"
                />
              </div>
            </div>

            {/* Visibility Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Visibility <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full h-[48px] px-3.5 bg-white border border-[#DCE3EA] rounded-[10px] text-sm font-medium text-slate-900 appearance-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                >
                  <option value="private">🔒 Private (API Key Required)</option>
                  <option value="public">🌐 Public (Open Read Access)</option>
                  <option value="enterprise">🛡️ Enterprise (JWT + RBAC Required)</option>
                </select>
                <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Fields Builder Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Telemetry Fields
              </h2>
              <p className="text-xs text-slate-500">
                Configure up to 8 telemetry stream fields (e.g. Temperature, Pressure).
              </p>
            </div>

            <button
              type="button"
              onClick={addField}
              disabled={fields.length >= 8}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>Add Field</span>
            </button>
          </div>

          {/* Fields List */}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div 
                key={index}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition-all"
              >
                {/* Key Badge */}
                <div className="px-3 py-1.5 bg-slate-200 text-slate-700 font-mono font-extrabold text-xs rounded-lg uppercase tracking-wider shrink-0 text-center">
                  {field.field_key}
                </div>

                {/* Field Name */}
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder="Field Name (e.g. Temperature)"
                    value={field.name}
                    onChange={(e) => updateField(index, 'name', e.target.value)}
                    className="w-full h-10 px-3.5 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>

                {/* Field Unit */}
                <div className="w-full sm:w-32">
                  <input
                    type="text"
                    placeholder="Unit (e.g. °C)"
                    value={field.unit || ''}
                    onChange={(e) => updateField(index, 'unit', e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>

                {/* Field Data Type */}
                <div className="w-full sm:w-32 relative flex items-center">
                  <select
                    value={field.data_type}
                    onChange={(e) => updateField(index, 'data_type', e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#DCE3EA] focus:border-[#2563EB] focus:ring-2 focus:ring-blue-50 rounded-lg text-xs font-semibold text-slate-900 appearance-none outline-none cursor-pointer"
                  >
                    <option value="float">Float</option>
                    <option value="int">Integer</option>
                    <option value="string">String</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  disabled={fields.length === 1}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-30 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/channels')}
            disabled={submitting}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving Channel...' : 'Save Channel'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};

export default ChannelForm;
