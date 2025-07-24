#!/usr/bin/env python3
"""
Larva Connectome PDF Processor
Extracts text, figures, and metadata from connectome research papers
"""

import fitz  # PyMuPDF
import os
import json
from pathlib import Path
from PIL import Image
import pdfplumber
from datetime import datetime
import re

class LarvaConnectomePDFProcessor:
    def __init__(self, pdf_dir="docs/larvaconnectome", output_dir="docs/processed_papers"):
        self.pdf_dir = Path(pdf_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        (self.output_dir / "figures").mkdir(exist_ok=True)
        (self.output_dir / "text").mkdir(exist_ok=True)
        (self.output_dir / "metadata").mkdir(exist_ok=True)
        
    def extract_figures_from_pdf(self, pdf_path, paper_name):
        """Extract high-quality figures from PDF"""
        doc = fitz.open(pdf_path)
        figures = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Get image list
            image_list = page.get_images(full=True)
            
            for img_index, img in enumerate(image_list):
                # Get image data
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)
                
                # Convert to PIL Image if not CMYK
                if pix.n - pix.alpha < 4:
                    img_data = pix.tobytes("png")
                    
                    # Save figure
                    figure_name = f"{paper_name}_page{page_num+1}_fig{img_index+1}.png"
                    figure_path = self.output_dir / "figures" / figure_name
                    
                    with open(figure_path, "wb") as f:
                        f.write(img_data)
                    
                    # Get image dimensions and context
                    width, height = pix.width, pix.height
                    
                    figures.append({
                        "filename": figure_name,
                        "page": page_num + 1,
                        "width": width,
                        "height": height,
                        "size_bytes": len(img_data),
                        "context": self.extract_figure_context(page, img_index)
                    })
                
                pix = None
        
        doc.close()
        return figures
    
    def extract_figure_context(self, page, img_index):
        """Extract text around figures for context"""
        text_blocks = page.get_text("dict")
        # Simple context extraction - can be enhanced
        page_text = page.get_text()
        
        # Look for figure captions
        figure_patterns = [
            r"Figure\s+\d+[.:]\s*([^\n]+)",
            r"Fig\.\s+\d+[.:]\s*([^\n]+)",
            r"Panel\s+[A-Z][.:]\s*([^\n]+)"
        ]
        
        captions = []
        for pattern in figure_patterns:
            matches = re.findall(pattern, page_text, re.IGNORECASE)
            captions.extend(matches)
        
        return {
            "captions": captions,
            "page_text_snippet": page_text[:500]  # First 500 chars for context
        }
    
    def extract_text_content(self, pdf_path):
        """Extract structured text content from PDF"""
        content = {
            "title": "",
            "authors": "",
            "abstract": "",
            "sections": {},
            "references": [],
            "full_text": ""
        }
        
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    full_text += f"\n--- PAGE {page_num + 1} ---\n"
                    full_text += page_text
            
            content["full_text"] = full_text
            
            # Extract title (usually on first page)
            if pdf.pages:
                first_page_text = pdf.pages[0].extract_text()
                if first_page_text:
                    lines = first_page_text.split('\n')
                    # Title is often the first substantial line
                    for line in lines:
                        if len(line.strip()) > 20 and not line.strip().isupper():
                            content["title"] = line.strip()
                            break
            
            # Extract abstract
            abstract_match = re.search(r"ABSTRACT\s*(.*?)(?=\n[A-Z]+|\n\n|\nINTRODUCTION)", full_text, re.DOTALL | re.IGNORECASE)
            if abstract_match:
                content["abstract"] = abstract_match.group(1).strip()
        
        return content
    
    def analyze_connectome_relevance(self, text_content):
        """Analyze if this is truly larval connectome data"""
        larval_keywords = [
            "larva", "larval", "drosophila larva", "first instar", "third instar",
            "l1", "l2", "l3", "larval brain", "larval nervous system"
        ]
        
        flywire_keywords = [
            "flywire", "adult fly", "adult brain", "imaginal", "compound eye",
            "wing", "leg", "adult drosophila", "mature fly"
        ]
        
        connectome_keywords = [
            "connectome", "neural circuit", "synaptic connectivity", "brain wiring",
            "neural network", "circuit mapping", "connectomics"
        ]
        
        text_lower = text_content["full_text"].lower()
        
        larval_score = sum(1 for keyword in larval_keywords if keyword in text_lower)
        flywire_score = sum(1 for keyword in flywire_keywords if keyword in text_lower)
        connectome_score = sum(1 for keyword in connectome_keywords if keyword in text_lower)
        
        analysis = {
            "is_larval": larval_score > 0,
            "is_adult_flywire": flywire_score > 0,
            "is_connectome": connectome_score > 0,
            "larval_score": larval_score,
            "flywire_score": flywire_score,
            "connectome_score": connectome_score,
            "confidence": "high" if larval_score > 3 else "medium" if larval_score > 0 else "low"
        }
        
        return analysis
    
    def process_all_pdfs(self):
        """Process all PDFs in the directory"""
        results = {}
        
        for pdf_file in self.pdf_dir.glob("*.pdf"):
            print(f"Processing: {pdf_file.name}")
            
            paper_name = pdf_file.stem
            paper_results = {
                "filename": pdf_file.name,
                "processed_at": datetime.now().isoformat(),
                "figures": [],
                "text_content": {},
                "connectome_analysis": {}
            }
            
            try:
                # Extract figures
                paper_results["figures"] = self.extract_figures_from_pdf(pdf_file, paper_name)
                print(f"  Extracted {len(paper_results['figures'])} figures")
                
                # Extract text
                paper_results["text_content"] = self.extract_text_content(pdf_file)
                print(f"  Extracted text content")
                
                # Analyze connectome relevance
                paper_results["connectome_analysis"] = self.analyze_connectome_relevance(paper_results["text_content"])
                print(f"  Larval relevance: {paper_results['connectome_analysis']['confidence']}")
                
                # Save individual paper results
                output_file = self.output_dir / "metadata" / f"{paper_name}.json"
                with open(output_file, 'w') as f:
                    json.dump(paper_results, f, indent=2)
                
                # Save text content separately
                text_file = self.output_dir / "text" / f"{paper_name}.txt"
                with open(text_file, 'w', encoding='utf-8') as f:
                    f.write(f"TITLE: {paper_results['text_content']['title']}\n\n")
                    f.write(f"ABSTRACT: {paper_results['text_content']['abstract']}\n\n")
                    f.write("FULL TEXT:\n")
                    f.write(paper_results['text_content']['full_text'])
                
            except Exception as e:
                print(f"  Error processing {pdf_file.name}: {e}")
                paper_results["error"] = str(e)
            
            results[paper_name] = paper_results
        
        # Save combined results
        combined_file = self.output_dir / "combined_analysis.json"
        with open(combined_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        return results

def main():
    processor = LarvaConnectomePDFProcessor()
    results = processor.process_all_pdfs()
    
    print("\n=== PROCESSING COMPLETE ===")
    print(f"Results saved to: {processor.output_dir}")
    
    # Summary
    for paper_name, data in results.items():
        if "error" not in data:
            analysis = data["connectome_analysis"]
            print(f"\n{paper_name}:")
            print(f"  Larval: {analysis['is_larval']} (score: {analysis['larval_score']})")
            print(f"  FlyWire/Adult: {analysis['is_adult_flywire']} (score: {analysis['flywire_score']})")
            print(f"  Connectome: {analysis['is_connectome']} (score: {analysis['connectome_score']})")
            print(f"  Figures extracted: {len(data['figures'])}")

if __name__ == "__main__":
    main() 