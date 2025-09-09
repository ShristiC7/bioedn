import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { 
  Upload, 
  MapPin, 
  Thermometer, 
  Droplet, 
  TestTube, 
  Calendar, 
  User, 
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const sampleUploadSchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    name: z.string().optional()
  }),
  metadata: z.object({
    temperature: z.number().optional(),
    salinity: z.number().optional(),
    ph: z.number().optional(),
    collectionDate: z.string().optional(),
    collector: z.string().optional(),
    equipment: z.string().optional(),
    notes: z.string().optional()
  }).optional()
});

interface Sample {
  id: string;
  filename: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  location: {
    lat: number;
    lng: number;
    name?: string;
  };
  uploadedAt: string;
  processedAt?: string;
}

export default function SampleUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof sampleUploadSchema>>({
    resolver: zodResolver(sampleUploadSchema),
    defaultValues: {
      location: {
        lat: 25.7617, // Default to Miami coordinates
        lng: -80.1918
      },
      metadata: {}
    }
  });

  const { data: recentSamples } = useQuery<Sample[]>({
    queryKey: ['/api/samples/recent'],
    refetchInterval: 5000
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; formData: z.infer<typeof sampleUploadSchema> }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('location', JSON.stringify(data.formData.location));
      if (data.formData.metadata) {
        formData.append('metadata', JSON.stringify(data.formData.metadata));
      }
      
      const response = await fetch('/api/samples/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/samples/recent'] });
      toast({
        title: "Sample uploaded successfully!",
        description: "Your eDNA sample is now being processed."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/gzip': ['.tar.gz', '.tgz'],
      'text/plain': ['.fasta', '.fastq', '.fa', '.fq']
    },
    multiple: true
  });

  const handleSubmit = async (values: z.infer<typeof sampleUploadSchema>) => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one eDNA sample file.",
        variant: "destructive"
      });
      return;
    }

    for (const file of uploadedFiles) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      await uploadMutation.mutateAsync({ file, formData: values });
      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
    }

    setUploadedFiles([]);
    setUploadProgress({});
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8" data-testid="sample-upload-main">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Upload eDNA Samples</h2>
          <p className="text-muted-foreground">
            Upload your environmental DNA samples for biodiversity analysis
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Select eDNA Sample Files
                  </CardTitle>
                  <CardDescription>
                    Upload .tar.gz, .fasta, .fastq, or other genomic data files
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`
                      file-upload-zone cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
                      ${isDragActive ? 'dragover' : 'border-muted-foreground/25 hover:border-primary/50'}
                    `}
                    data-testid="file-drop-zone"
                  >
                    <input {...getInputProps()} />
                    <Upload className={`h-8 w-8 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <h3 className="text-lg font-semibold mb-2">
                      {isDragActive ? "Drop files here" : "Upload eDNA sample files"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports .tar.gz, .fasta, .fastq, .fa, .fq files
                    </p>
                    <Button type="button" variant="secondary" size="sm">
                      Choose Files
                    </Button>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Selected Files:</h4>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Collection Location
                  </CardTitle>
                  <CardDescription>
                    Specify where the samples were collected
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location.lat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="25.7617"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-latitude"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location.lng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.000001"
                              placeholder="-80.1918"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-longitude"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="location.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Miami Reef System"
                            {...field}
                            data-testid="input-location-name"
                          />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for this sampling location
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Environmental Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Environmental Data
                  </CardTitle>
                  <CardDescription>
                    Optional environmental conditions at time of collection
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="metadata.temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4" />
                          Temperature (°C)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="25.5"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-temperature"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="metadata.salinity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Droplet className="h-4 w-4" />
                          Salinity (‰)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="35.0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-salinity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.ph"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>pH Level</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="8.1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-ph"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.collectionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Collection Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            data-testid="input-collection-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.collector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Collector Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Researcher name"
                            {...field}
                            data-testid="input-collector"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.equipment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sampling Equipment</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Niskin bottle, plankton net"
                            {...field}
                            data-testid="input-equipment"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                  <CardDescription>
                    Any additional information about the samples
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="metadata.notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Additional observations, weather conditions, etc."
                            className="min-h-24"
                            {...field}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={uploadMutation.isPending || uploadedFiles.length === 0}
                  data-testid="button-upload-samples"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Samples
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Recent Samples */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Samples</CardTitle>
              <CardDescription>
                Your recently uploaded eDNA samples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSamples?.slice(0, 10).map((sample) => (
                  <div key={sample.id} className="flex items-center gap-3 p-3 rounded border hover-elevate">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(sample.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sample.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {sample.location.name || `${sample.location.lat.toFixed(4)}, ${sample.location.lng.toFixed(4)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sample.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {sample.status}
                    </Badge>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No samples uploaded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Supported Formats</p>
                  <p className="text-muted-foreground">.tar.gz, .fasta, .fastq, .fa, .fq</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">File Size Limit</p>
                  <p className="text-muted-foreground">Maximum 100 MB per file</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Processing Time</p>
                  <p className="text-muted-foreground">Usually 5-15 minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Location Required</p>
                  <p className="text-muted-foreground">GPS coordinates needed for analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}