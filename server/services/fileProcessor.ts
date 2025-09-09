import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { storage } from "../storage";

class FileProcessor {
  private readonly uploadsDir = "uploads/";
  private readonly outputDir = "processed/";

  constructor() {
    // Ensure directories exist
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error("Error creating directories:", error);
    }
  }

  async processSample(sampleId: string, filePath: string, filename: string): Promise<void> {
    try {
      console.log(`Starting processing for sample ${sampleId}: ${filename}`);
      
      // Update status to processing
      await storage.updateSampleStatus(sampleId, "processing");

      // Determine processing based on file type
      let processedPath: string;
      
      if (filename.endsWith('.tar.gz')) {
        processedPath = await this.convertTarToFasta(filePath, filename);
      } else if (filename.endsWith('.fasta') || filename.endsWith('.fastq')) {
        // Already in correct format, just copy
        processedPath = path.join(this.outputDir, filename);
        await fs.copyFile(filePath, processedPath);
      } else {
        throw new Error(`Unsupported file format: ${filename}`);
      }

      // Process the FASTA file for species detection
      const detections = await this.analyzeSequences(processedPath, sampleId);
      
      console.log(`Found ${detections.length} species detections in sample ${sampleId}`);

      // Update sample status
      await storage.updateSampleStatus(sampleId, "completed", path.extname(processedPath));

      // Clean up original file
      await fs.unlink(filePath);

    } catch (error) {
      console.error(`Error processing sample ${sampleId}:`, error);
      await storage.updateSampleStatus(sampleId, "failed");
      throw error;
    }
  }

  async convertTarToFasta(inputPath: string, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputFilename = filename.replace('.tar.gz', '.fasta');
      const outputPath = path.join(this.outputDir, outputFilename);
      const scriptPath = path.join(__dirname, '../python/convert_files.py');

      console.log(`Converting ${filename} using Python script`);

      const pythonProcess = spawn('python3', [scriptPath, inputPath, outputPath]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`Successfully converted ${filename} to FASTA format`);
          resolve(outputPath);
        } else {
          console.error(`Python script failed with code ${code}`);
          console.error('STDERR:', stderr);
          reject(new Error(`File conversion failed: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(new Error(`Failed to start conversion process: ${error.message}`));
      });
    });
  }

  private async analyzeSequences(fastaPath: string, sampleId: string): Promise<any[]> {
    try {
      // Read FASTA file and analyze sequences
      const fastaContent = await fs.readFile(fastaPath, 'utf-8');
      const sequences = this.parseFasta(fastaContent);
      
      console.log(`Analyzing ${sequences.length} sequences from sample ${sampleId}`);

      const detections = [];

      for (const sequence of sequences) {
        // Simulate species identification (in production, use BLAST or ML models)
        const speciesMatch = await this.identifySpecies(sequence);
        
        if (speciesMatch) {
          const detection = await storage.createDetection({
            sampleId,
            speciesId: speciesMatch.id,
            confidence: speciesMatch.confidence,
            abundance: 1
          });

          detections.push(detection);

          // Check if this species triggers any alerts
          await this.checkForAlerts(detection, speciesMatch);
        }
      }

      return detections;
    } catch (error) {
      console.error("Error analyzing sequences:", error);
      throw error;
    }
  }

  private parseFasta(content: string): Array<{ header: string; sequence: string }> {
    const sequences = [];
    const lines = content.split('\n');
    let currentSequence = { header: '', sequence: '' };

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('>')) {
        if (currentSequence.header && currentSequence.sequence) {
          sequences.push(currentSequence);
        }
        currentSequence = { header: trimmedLine, sequence: '' };
      } else if (trimmedLine) {
        currentSequence.sequence += trimmedLine;
      }
    }

    if (currentSequence.header && currentSequence.sequence) {
      sequences.push(currentSequence);
    }

    return sequences;
  }

  private async identifySpecies(sequence: { header: string; sequence: string }): Promise<any | null> {
    // Simplified species identification simulation
    // In production, this would use BLAST against reference databases or ML models
    
    const allSpecies = await storage.getAllSpecies();
    if (allSpecies.length === 0) {
      return null;
    }

    // Simple simulation based on sequence characteristics
    const gcContent = this.calculateGCContent(sequence.sequence);
    const sequenceLength = sequence.sequence.length;

    // Simulate species matching logic
    let bestMatch = null;
    let bestConfidence = 0;

    for (const species of allSpecies) {
      // Simulate confidence scoring based on sequence properties
      let confidence = Math.random() * 0.3 + 0.4; // Base confidence 40-70%

      // Adjust confidence based on GC content (different species have different patterns)
      if (species.category === 'fish' && gcContent > 0.45 && gcContent < 0.55) {
        confidence += 0.2;
      } else if (species.category === 'coral' && gcContent > 0.38 && gcContent < 0.48) {
        confidence += 0.2;
      } else if (species.category === 'algae' && gcContent > 0.35 && gcContent < 0.45) {
        confidence += 0.2;
      }

      // Adjust for sequence length
      if (sequenceLength > 200 && sequenceLength < 1000) {
        confidence += 0.1;
      }

      confidence = Math.min(confidence, 0.95); // Cap at 95%

      if (confidence > bestConfidence && confidence > 0.6) {
        bestMatch = { ...species, confidence };
        bestConfidence = confidence;
      }
    }

    return bestMatch;
  }

  private calculateGCContent(sequence: string): number {
    const gcCount = (sequence.match(/[GC]/gi) || []).length;
    return gcCount / sequence.length;
  }

  private async checkForAlerts(detection: any, species: any): Promise<void> {
    try {
      if (species.isEndangered) {
        await storage.createAlert({
          detectionId: detection.id,
          type: 'endangered',
          severity: 'high',
          message: `Endangered species detected: ${species.scientificName}`,
          location: detection.location || { lat: 0, lng: 0 }
        });
      }

      if (species.isInvasive) {
        await storage.createAlert({
          detectionId: detection.id,
          type: 'invasive',
          severity: 'medium',
          message: `Invasive species detected: ${species.scientificName}`,
          location: detection.location || { lat: 0, lng: 0 }
        });
      }
    } catch (error) {
      console.error("Error creating alerts:", error);
    }
  }
}

export const fileProcessor = new FileProcessor();
