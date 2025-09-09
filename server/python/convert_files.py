#!/usr/bin/env python3
"""
BioDiversity Analytics Platform - File Conversion Service
Converts .tar.gz genomic data files to FASTA format for eDNA analysis
"""

import sys
import os
import tarfile
import gzip
import argparse
from pathlib import Path
from Bio import SeqIO
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def extract_tar_gz(tar_path, extract_to):
    """Extract .tar.gz file to specified directory"""
    try:
        with tarfile.open(tar_path, 'r:gz') as tar:
            tar.extractall(extract_to)
            logger.info(f"Extracted {tar_path} to {extract_to}")
            return [os.path.join(extract_to, name) for name in tar.getnames()]
    except Exception as e:
        logger.error(f"Error extracting {tar_path}: {e}")
        raise

def process_fastq_to_fasta(fastq_file, output_fasta, quality_threshold=20):
    """Convert FASTQ to FASTA with quality filtering"""
    sequences_written = 0
    sequences_filtered = 0
    
    try:
        # Handle gzipped FASTQ files
        if fastq_file.endswith('.gz'):
            file_handle = gzip.open(fastq_file, 'rt')
        else:
            file_handle = open(fastq_file, 'r')
        
        with file_handle as handle:
            with open(output_fasta, 'a') as output_handle:
                for record in SeqIO.parse(handle, "fastq"):
                    # Calculate average quality score
                    if hasattr(record, 'letter_annotations') and 'phred_quality' in record.letter_annotations:
                        avg_quality = sum(record.letter_annotations['phred_quality']) / len(record.letter_annotations['phred_quality'])
                        
                        if avg_quality >= quality_threshold:
                            # Convert to FASTA record
                            fasta_record = SeqRecord(
                                record.seq,
                                id=record.id,
                                description=f"avg_qual={avg_quality:.1f} {record.description}"
                            )
                            SeqIO.write(fasta_record, output_handle, "fasta")
                            sequences_written += 1
                        else:
                            sequences_filtered += 1
                    else:
                        # No quality information, include all sequences
                        fasta_record = SeqRecord(
                            record.seq,
                            id=record.id,
                            description=record.description
                        )
                        SeqIO.write(fasta_record, output_handle, "fasta")
                        sequences_written += 1
        
        logger.info(f"Converted {sequences_written} sequences from {fastq_file}")
        logger.info(f"Filtered out {sequences_filtered} low-quality sequences")
        
    except Exception as e:
        logger.error(f"Error processing FASTQ file {fastq_file}: {e}")
        raise

def process_generic_sequences(input_file, output_fasta):
    """Process other sequence file formats"""
    sequences_written = 0
    
    try:
        # Try to detect file format
        formats_to_try = ['fasta', 'genbank', 'embl', 'swiss']
        
        for fmt in formats_to_try:
            try:
                with open(input_file, 'r') as handle:
                    sequences = list(SeqIO.parse(handle, fmt))
                    if sequences:
                        logger.info(f"Detected {fmt} format in {input_file}")
                        
                        with open(output_fasta, 'a') as output_handle:
                            for record in sequences:
                                SeqIO.write(record, output_handle, "fasta")
                                sequences_written += 1
                        break
            except:
                continue
        
        if sequences_written == 0:
            logger.warning(f"Could not parse {input_file} - unknown format")
        else:
            logger.info(f"Converted {sequences_written} sequences from {input_file}")
            
    except Exception as e:
        logger.error(f"Error processing file {input_file}: {e}")
        raise

def convert_tar_to_fasta(input_tar_path, output_fasta_path):
    """Main conversion function"""
    try:
        # Create temporary extraction directory
        extract_dir = f"{input_tar_path}_extracted"
        os.makedirs(extract_dir, exist_ok=True)
        
        logger.info(f"Starting conversion of {input_tar_path}")
        
        # Extract tar.gz file
        extracted_files = extract_tar_gz(input_tar_path, extract_dir)
        
        # Initialize output FASTA file
        with open(output_fasta_path, 'w') as f:
            f.write(f"# Converted from {os.path.basename(input_tar_path)}\n")
            f.write(f"# Conversion timestamp: {os.popen('date').read().strip()}\n")
        
        total_sequences = 0
        
        # Process each extracted file
        for file_path in extracted_files:
            if os.path.isfile(file_path):
                file_lower = file_path.lower()
                
                if file_lower.endswith(('.fastq', '.fastq.gz', '.fq', '.fq.gz')):
                    logger.info(f"Processing FASTQ file: {file_path}")
                    process_fastq_to_fasta(file_path, output_fasta_path)
                    
                elif file_lower.endswith(('.fasta', '.fasta.gz', '.fa', '.fa.gz', '.fas')):
                    logger.info(f"Processing FASTA file: {file_path}")
                    if file_path.endswith('.gz'):
                        with gzip.open(file_path, 'rt') as gz_handle:
                            with open(output_fasta_path, 'a') as out_handle:
                                for record in SeqIO.parse(gz_handle, "fasta"):
                                    SeqIO.write(record, out_handle, "fasta")
                                    total_sequences += 1
                    else:
                        with open(file_path, 'r') as in_handle:
                            with open(output_fasta_path, 'a') as out_handle:
                                for record in SeqIO.parse(in_handle, "fasta"):
                                    SeqIO.write(record, out_handle, "fasta")
                                    total_sequences += 1
                    
                elif file_lower.endswith(('.gb', '.gbk', '.genbank')):
                    logger.info(f"Processing GenBank file: {file_path}")
                    process_generic_sequences(file_path, output_fasta_path)
                    
                elif file_lower.endswith('.txt'):
                    logger.info(f"Attempting to process text file: {file_path}")
                    process_generic_sequences(file_path, output_fasta_path)
                    
                else:
                    logger.info(f"Skipping unknown file type: {file_path}")
        
        # Cleanup extraction directory
        import shutil
        shutil.rmtree(extract_dir)
        
        # Verify output file
        if os.path.exists(output_fasta_path):
            file_size = os.path.getsize(output_fasta_path)
            logger.info(f"Conversion completed successfully!")
            logger.info(f"Output file: {output_fasta_path} ({file_size} bytes)")
            
            # Count sequences in final file
            with open(output_fasta_path, 'r') as f:
                seq_count = len([line for line in f if line.startswith('>')])
            logger.info(f"Total sequences in output: {seq_count}")
            
        else:
            raise Exception("Output file was not created")
            
    except Exception as e:
        logger.error(f"Conversion failed: {e}")
        # Cleanup on error
        if os.path.exists(extract_dir):
            shutil.rmtree(extract_dir)
        raise

def validate_dependencies():
    """Check if required dependencies are available"""
    try:
        import Bio
        logger.info(f"BioPython version: {Bio.__version__}")
        return True
    except ImportError:
        logger.error("BioPython not found. Please install: pip install biopython")
        return False

def main():
    parser = argparse.ArgumentParser(description='Convert .tar.gz genomic files to FASTA format')
    parser.add_argument('input_file', help='Input .tar.gz file path')
    parser.add_argument('output_file', help='Output .fasta file path')
    parser.add_argument('--quality-threshold', type=int, default=20, 
                       help='Minimum average quality score for FASTQ sequences (default: 20)')
    
    args = parser.parse_args()
    
    # Validate dependencies
    if not validate_dependencies():
        sys.exit(1)
    
    # Validate input file
    if not os.path.exists(args.input_file):
        logger.error(f"Input file not found: {args.input_file}")
        sys.exit(1)
    
    if not args.input_file.lower().endswith(('.tar.gz', '.tgz')):
        logger.error("Input file must be a .tar.gz or .tgz archive")
        sys.exit(1)
    
    # Create output directory if needed
    output_dir = os.path.dirname(args.output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    try:
        convert_tar_to_fasta(args.input_file, args.output_file)
        logger.info("File conversion completed successfully!")
        print(f"SUCCESS: Converted {args.input_file} to {args.output_file}")
    except Exception as e:
        logger.error(f"Conversion failed: {e}")
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
