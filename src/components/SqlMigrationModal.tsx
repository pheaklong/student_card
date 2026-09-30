import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, Database, ExternalLink, BookOpen } from 'lucide-react';
import { SUPABASE_SQL_SCRIPT } from '../lib/sqlScript';

interface SqlMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlMigrationModal: React.FC<SqlMigrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'guide'>('sql');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([SUPABASE_SQL_SCRIPT], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'supabase_cambodia_student_id_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-neutral-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/90 font-kantumruy">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                Supabase SQL Database Migration & Setup Guide
              </h3>
              <p className="text-xs text-neutral-500">
                តារាង `school_settings`, `students`, និង Storage Buckets `student-photos`, `school-assets`
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-neutral-200 bg-white font-kantumruy">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('sql')}
              className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'sql'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              SQL Migration Script
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              ការណែនាំដំឡើងជាជំហានៗ (Step-by-Step Guide)
            </button>
          </div>

          {activeTab === 'sql' && (
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>បានចម្លង (Copied!)</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>ចម្លងកូដ SQL</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ទាញយក .sql</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {activeTab === 'sql' ? (
            <div className="relative">
              <pre className="p-4 bg-neutral-900 text-emerald-300 font-mono text-[11px] leading-relaxed rounded-lg overflow-x-auto selection:bg-emerald-700 selection:text-white">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>
          ) : (
            <div className="space-y-5 text-xs font-kantumruy text-neutral-800 leading-relaxed">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 text-sm mb-1">
                  ជំហានទី ១៖ បង្កើតគណនី និងគម្រោង Supabase
                </h4>
                <p className="text-blue-800">
                  ចូលទៅកាន់ <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-semibold">https://supabase.com</a> ហើយបង្កើត Project ថ្មី (ជ្រើសរើស Region ជិតប្រទេសកម្ពុជា ដូចជា Singapore)។
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2">
                <h4 className="font-bold text-neutral-900 text-sm">
                  ជំហានទី ២៖ ប្រតិបត្តិការកូដ SQL Script ក្នុង SQL Editor
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-neutral-700">
                  <li>ក្នុង Supabase Dashboard ចុចលើផ្ទាំង <strong>SQL Editor</strong> នៅម៉ឺនុយខាងឆ្វេងដៃ។</li>
                  <li>ចុចលើ <strong>+ New Query</strong>។</li>
                  <li>ចុចប៊ូតុង <strong>"ចម្លងកូដ SQL"</strong> ខាងលើ ហើយបិទភ្ជាប់ (Paste) ចូលទៅក្នុងប្រអប់ Query។</li>
                  <li>ចុចប៊ូតុង <strong>Run</strong> (Ctrl+Enter)។ ប្រព័ន្ធនឹងបង្កើតតារាង `school_settings`, `students`, Row Level Security (RLS) policies, និង Storage Buckets ទាំងពីរ។</li>
                </ol>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2">
                <h4 className="font-bold text-neutral-900 text-sm">
                  ជំហានទី ៣៖ ចម្លង Supabase API Keys មកដាក់ក្នុង Settings
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-neutral-700">
                  <li>ក្នុង Supabase Dashboard ចូលទៅកាន់ <strong>Project Settings → API</strong>។</li>
                  <li>ចម្លង <strong>Project URL</strong> (ឧ. https://xyz.supabase.co)។</li>
                  <li>ចម្លង <strong>Project API Keys (anon / public)</strong>។</li>
                  <li>ត្រឡប់មកកាន់កម្មវិធីនេះ ចូលផ្ទាំង <strong>"ការកំណត់សាលា (School Settings)"</strong> ហើយបិទភ្ជាប់ក្នុងប្រអប់ <strong>Supabase Backend</strong> រួចចុច "ភ្ជាប់ Supabase"។</li>
                </ol>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2">
                <h4 className="font-bold text-neutral-900 text-sm">
                  ជំហានទី ៤៖ Storage Buckets (Public)
                </h4>
                <p className="text-neutral-700">
                  SQL script បានបង្កើត Buckets ចំនួនពីរដោយស្វ័យប្រវត្តិ៖
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                  <li><strong>student-photos</strong> (Public: សម្រាប់ផ្ទុកឡើងរូបថត 3x4 របស់សិស្ស)</li>
                  <li><strong>school-assets</strong> (Public: សម្រាប់ផ្ទុកឡើង Logo សាលា ត្រាក្រហម និងហត្ថលេខានាយក)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-neutral-200 bg-neutral-50 font-kantumruy">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200/70 rounded-lg transition-colors"
          >
            បិទផ្ទាំង (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
