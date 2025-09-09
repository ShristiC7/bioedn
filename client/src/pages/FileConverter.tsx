import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Info
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ConversionJob {
  id: string;
  filename: string;
  status: 'uploading' | 'converting' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  fileSize?: number;
  outputSize?: number;
}

export default function FileConverter() {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      // Validate file type
      if (!file.name.endsWith('.tar.gz') && !file.name.endsWith('.tgz')) {
        toast({
          title: "Invalid file type",
          description: "Please upload .tar.gz or .tgz files only.",
          variant: "destructive",
        });
        continue;
      }

      // Create job entry
      const jobId = Math.random().toString(36).substring(2, 15);
      const newJob: ConversionJob = {
        id: jobId,
        filename: file.name,
        status: 'uploading',
        progress: 0,
        createdAt: new Date(),
        fileSize: file.size
      };

      setJobs(prev => [newJob, ...prev]);

      try {
        // Create form data for upload
        const formData = new FormData();
        formData.append('file', file);

        // Start conversion
        const response = await fetch('/api/convert/tar-to-fasta', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          // Get the blob and create download URL
          const blob = await response.blob();
          const downloadUrl = URL.createObjectURL(blob);
          
          setJobs(prev => prev.map(job => 
            job.id === jobId 
              ? { 
                  ...job, 
                  status: 'completed', 
                  progress: 100,
                  downloadUrl,
                  completedAt: new Date(),
                  outputSize: blob.size
                }
              : job
          ));

          toast({
            title: "Conversion completed!",
            description: `${file.name} has been successfully converted to FASTA format.`,
          });
        } else {
          const error = await response.text();
          throw new Error(error);
        }
      } catch (error) {
        console.error('Conversion error:', error);
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                status: 'failed', 
                error: error instanceof Error ? error.message : 'Conversion failed'
              }
            : job
        ));

        toast({
          title: "Conversion failed",
          description: `Failed to convert ${file.name}. Please try again.`,
          variant: "destructive",
        });
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept: {
      'application/gzip': ['.tar.gz', '.tgz'],
    },
    multiple: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const downloadFile = (job: ConversionJob) => {
    if (job.downloadUrl) {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = job.filename.replace(/\.(tar\.gz|tgz)$/, '.fasta');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'converting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8" data-testid="file-converter-main">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">File Converter</h2>
          <p className="text-muted-foreground">
            Convert .tar.gz genomic archives to FASTA format for eDNA analysis
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Genomic Data Files
              </CardTitle>
              <CardDescription>
                Drag and drop your .tar.gz or .tgz files here, or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`
                  file-upload-zone cursor-pointer rounded-lg border-2 border-dashed p-12 text-center
                  ${isDragActive || dropzoneActive ? 'dragover border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}
                `}
                data-testid="file-drop-zone"
              >
                <input {...getInputProps()} />
                <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-4">
                  <Upload className={`h-12 w-12 ${isDragActive || dropzoneActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {isDragActive ? "Drop files here" : "Upload genomic data files"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Supports .tar.gz and .tgz archives containing FASTQ, FASTA, or GenBank files
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" data-testid="button-browse-files">
                    Browse Files
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Conversion Jobs
              </CardTitle>
              <CardDescription>
                Track the progress of your file conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No conversion jobs yet. Upload some files to get started.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="space-y-3 p-4 rounded-md border hover-elevate" data-testid={`job-${job.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h4 className="text-sm font-medium">{job.filename}</h4>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(job.fileSize || 0)}
                              {job.outputSize && ` → ${formatFileSize(job.outputSize)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              job.status === 'completed' ? 'default' :
                              job.status === 'failed' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {job.status}
                          </Badge>
                          {job.status === 'completed' && job.downloadUrl && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => downloadFile(job)}
                              data-testid={`button-download-${job.id}`}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>

                      {(job.status === 'converting' || job.status === 'uploading') && (
                        <Progress value={job.progress} className="w-full" />
                      )}

                      {job.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{job.error}</AlertDescription>
                        </Alert>
                      )}

                      {job.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed: {job.completedAt.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Conversion Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Supported Input Formats:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• .tar.gz archives</li>
                  <li>• .tgz archives</li>
                  <li>• FASTQ files (.fastq, .fq)</li>
                  <li>• FASTA files (.fasta, .fa)</li>
                  <li>• GenBank files (.gb, .gbk)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Processing Features:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Quality filtering for FASTQ</li>
                  <li>• Format standardization</li>
                  <li>• Sequence validation</li>
                  <li>• Metadata preservation</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Output:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Standard FASTA format</li>
                  <li>• Quality scores preserved</li>
                  <li>• Ready for eDNA analysis</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Size Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Maximum file size:</span>
                <span className="font-medium">100 MB</span>
              </div>
              <div className="flex justify-between">
                <span>Multiple files:</span>
                <span className="font-medium">Supported</span>
              </div>
              <div className="flex justify-between">
                <span>Concurrent conversions:</span>
                <span className="font-medium">5</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quality Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quality Threshold</label>
                <div className="text-muted-foreground">
                  Minimum average quality score: 20
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter Options</label>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Remove low-quality sequences</li>
                  <li>• Trim adapter sequences</li>
                  <li>• Validate sequence integrity</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}