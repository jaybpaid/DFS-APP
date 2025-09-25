import React, { useState, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface FileUpload {
  id: string;
  file: File;
  type: 'salaries' | 'projections' | 'ownership';
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export default function UploadsPage() {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const upload: FileUpload = {
          id: Date.now().toString() + Math.random().toString(),
          file,
          type: detectFileType(file.name),
          status: 'pending',
          progress: 0,
        };
        setUploads(prev => [...prev, upload]);
      }
    });
  }, []);

  const detectFileType = (
    filename: string
  ): 'salaries' | 'projections' | 'ownership' => {
    const lower = filename.toLowerCase();
    if (lower.includes('salary') || lower.includes('contest')) return 'salaries';
    if (lower.includes('projection') || lower.includes('fpts')) return 'projections';
    return 'ownership';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const upload: FileUpload = {
        id: Date.now().toString() + Math.random().toString(),
        file,
        type: detectFileType(file.name),
        status: 'pending',
        progress: 0,
      };
      setUploads(prev => [...prev, upload]);
    });
  };

  const simulateUpload = (uploadId: string) => {
    setUploads(prev =>
      prev.map(upload =>
        upload.id === uploadId ? { ...upload, status: 'uploading' } : upload
      )
    );

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        clearInterval(interval);
        setUploads(prev =>
          prev.map(upload =>
            upload.id === uploadId
              ? { ...upload, status: 'completed', progress: 100 }
              : upload
          )
        );
      } else {
        setUploads(prev =>
          prev.map(upload =>
            upload.id === uploadId ? { ...upload, progress } : upload
          )
        );
      }
    }, 200);
  };

  const removeUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const fileTypeLabels = {
    salaries: { label: 'Salary Data', color: 'bg-blue-100 text-blue-800' },
    projections: { label: 'Projections', color: 'bg-green-100 text-green-800' },
    ownership: { label: 'Ownership', color: 'bg-purple-100 text-purple-800' },
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Upload Data</h1>
        <p className='text-gray-600'>
          Import DraftKings CSV files for salary data, projections, and ownership
          information
        </p>
      </div>

      {/* Upload Zone */}
      <div className='bg-white shadow rounded-lg p-6'>
        <div
          className={clsx(
            'border-2 border-dashed rounded-lg p-8 transition-colors',
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className='text-center'>
            <CloudArrowUpIcon
              className={clsx(
                'mx-auto h-12 w-12 transition-colors',
                isDragging ? 'text-blue-500' : 'text-gray-400'
              )}
            />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              {isDragging ? 'Drop files here' : 'Upload CSV files'}
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Drag and drop files here, or{' '}
              <label className='cursor-pointer text-blue-600 hover:text-blue-700'>
                browse files
                <input
                  type='file'
                  className='sr-only'
                  accept='.csv'
                  multiple
                  onChange={handleFileSelect}
                />
              </label>
            </p>
            <p className='mt-2 text-xs text-gray-400'>
              Supports: DraftKings salary exports, projection files, ownership data
            </p>
          </div>
        </div>
      </div>

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <div className='bg-white shadow rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Upload Queue</h3>

          <div className='space-y-4'>
            {uploads.map(upload => (
              <div key={upload.id} className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center space-x-3'>
                    <DocumentIcon className='h-8 w-8 text-gray-400' />
                    <div>
                      <div className='font-medium text-gray-900'>
                        {upload.file.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {(upload.file.size / 1024).toFixed(1)} KB • CSV File
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center space-x-3'>
                    <span
                      className={clsx(
                        'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                        fileTypeLabels[upload.type].color
                      )}
                    >
                      {fileTypeLabels[upload.type].label}
                    </span>

                    {upload.status === 'completed' && (
                      <CheckCircleIcon className='h-5 w-5 text-green-500' />
                    )}
                    {upload.status === 'error' && (
                      <ExclamationCircleIcon className='h-5 w-5 text-red-500' />
                    )}

                    <button
                      onClick={() => removeUpload(upload.id)}
                      className='text-gray-400 hover:text-gray-600'
                    >
                      <svg
                        className='h-4 w-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {upload.status === 'uploading' && (
                  <div className='w-full bg-gray-200 rounded-full h-2 mb-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full transition-all duration-200'
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}

                {/* Status */}
                <div className='flex items-center justify-between text-sm'>
                  <span
                    className={clsx(
                      'font-medium',
                      upload.status === 'completed'
                        ? 'text-green-600'
                        : upload.status === 'error'
                          ? 'text-red-600'
                          : upload.status === 'uploading'
                            ? 'text-blue-600'
                            : 'text-gray-600'
                    )}
                  >
                    {upload.status === 'pending' && 'Ready to upload'}
                    {upload.status === 'uploading' &&
                      `Uploading... ${Math.round(upload.progress)}%`}
                    {upload.status === 'completed' && 'Upload completed successfully'}
                    {upload.status === 'error' && 'Upload failed'}
                  </span>

                  {upload.status === 'pending' && (
                    <button
                      onClick={() => simulateUpload(upload.id)}
                      className='text-blue-600 hover:text-blue-700 font-medium'
                    >
                      Upload
                    </button>
                  )}
                </div>

                {upload.error && (
                  <div className='mt-2 text-xs text-red-600 bg-red-50 p-2 rounded'>
                    {upload.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {uploads.some(u => u.status === 'pending') && (
            <div className='mt-4 pt-4 border-t border-gray-200'>
              <button
                onClick={() =>
                  uploads
                    .filter(u => u.status === 'pending')
                    .forEach(u => simulateUpload(u.id))
                }
                className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700'
              >
                Upload All Files
              </button>
            </div>
          )}
        </div>
      )}

      {/* File Type Guide */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Supported File Types
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='p-4 border border-blue-200 rounded-lg bg-blue-50'>
            <div className='font-medium text-blue-900 mb-2'>Salary Data</div>
            <div className='text-sm text-blue-700 mb-2'>
              DraftKings contest exports with player salaries and positions
            </div>
            <div className='text-xs text-blue-600'>
              Required columns: Name, Position, Salary, Team
            </div>
          </div>

          <div className='p-4 border border-green-200 rounded-lg bg-green-50'>
            <div className='font-medium text-green-900 mb-2'>Projections</div>
            <div className='text-sm text-green-700 mb-2'>
              Player projections with points, floor, ceiling data
            </div>
            <div className='text-xs text-green-600'>
              Required columns: Name, FPTS, Floor, Ceiling
            </div>
          </div>

          <div className='p-4 border border-purple-200 rounded-lg bg-purple-50'>
            <div className='font-medium text-purple-900 mb-2'>Ownership</div>
            <div className='text-sm text-purple-700 mb-2'>
              Projected ownership percentages for GPP strategy
            </div>
            <div className='text-xs text-purple-600'>
              Required columns: Name, Own%, Leverage
            </div>
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className='bg-white shadow rounded-lg p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Recent Uploads</h3>
          <button className='text-sm text-blue-600 hover:text-blue-700'>
            View All
          </button>
        </div>

        <div className='text-center py-8 text-gray-500'>
          <DocumentIcon className='mx-auto h-12 w-12 text-gray-300' />
          <p className='mt-2'>No recent uploads</p>
          <p className='text-sm'>Upload your first CSV file to get started</p>
        </div>
      </div>
    </div>
  );
}
