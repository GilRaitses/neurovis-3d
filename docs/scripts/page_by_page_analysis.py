#!/usr/bin/env python3
"""
PAGE-BY-PAGE LARVAL CONNECTOME ANALYSIS
Extracts full page content with figures matched to captions
"""

import fitz  # PyMuPDF
import pdfplumber
import json
import re
from pathlib import Path
from PIL import Image
import io
from datetime import datetime

class PageByPageAnalyzer:
    def __init__(self, pdf_dir="docs/larvaconnectome"):
        self.pdf_dir = Path(pdf_dir)
        self.output_dir = Path("docs/page_analysis")
        self.output_dir.mkdir(exist_ok=True)
        
    def extract_page_with_figures(self, pdf_path, page_num):
        """Extract complete page content with figures and captions matched"""
        doc = fitz.open(pdf_path)
        page = doc[page_num]
        
        # Extract full page text
        page_text = page.get_text()
        
        # Extract all images on this page
        image_list = page.get_images()
        page_figures = []
        
        for img_index, img in enumerate(image_list):
            # Extract image
            xref = img[0]
            pix = fitz.Pixmap(doc, xref)
            
            if pix.n - pix.alpha < 4:  # GRAY or RGB
                img_data = pix.tobytes("png")
                img_filename = f"page_{page_num+1}_fig_{img_index+1}.png"
                img_path = self.output_dir / "figures" / img_filename
                img_path.parent.mkdir(exist_ok=True)
                
                with open(img_path, "wb") as f:
                    f.write(img_data)
                
                # Find caption for this figure
                caption = self.find_figure_caption(page_text, img_index + 1, page_num + 1)
                
                page_figures.append({
                    "figure_file": img_filename,
                    "caption": caption,
                    "image_index": img_index + 1,
                    "dimensions": (pix.width, pix.height)
                })
            
            pix = None
        
        doc.close()
        
        return {
            "page_number": page_num + 1,
            "full_text": page_text,
            "figures": page_figures,
            "figure_count": len(page_figures)
        }
    
    def find_figure_caption(self, page_text, fig_num, page_num):
        """Find caption text for a specific figure"""
        # Common caption patterns
        patterns = [
            rf"Figure\s+{fig_num}[.\s:]+([^.]+(?:\.[^.]*?)*?)(?=\n\n|\nFigure|\n[A-Z]|$)",
            rf"Fig\.?\s+{fig_num}[.\s:]+([^.]+(?:\.[^.]*?)*?)(?=\n\n|\nFig|\n[A-Z]|$)",
            rf"Panel\s+[A-Z][.\s:]+([^.]+(?:\.[^.]*?)*?)(?=\n\n|\nPanel|\n[A-Z]|$)",
            rf"\([A-Z]\)\s*([^.]+(?:\.[^.]*?)*?)(?=\n\n|\([A-Z]\)|\n[A-Z]|$)",
        ]
        
        for pattern in patterns:
            try:
                match = re.search(pattern, page_text, re.IGNORECASE | re.DOTALL)
                if match:
                    caption = match.group(1).strip()
                    # Clean up caption
                    caption = re.sub(r'\s+', ' ', caption)
                    caption = caption.replace('\n', ' ')
                    return caption[:500] + "..." if len(caption) > 500 else caption
            except re.error:
                continue
        
        # Fallback: look for any caption-like text near figures
        caption_patterns = [
            r"(?:Figure|Fig\.?|Panel)\s+\w+[.\s:]+([^.]+(?:\.[^.]*?)*?)(?=\n\n|\n[A-Z]|$)",
            r"\([A-Z]\)\s*([^.]+(?:\.[^.]*?)*?)(?=\n\n|\([A-Z]\)|\n[A-Z]|$)",
        ]
        
        for pattern in caption_patterns:
            try:
                matches = re.findall(pattern, page_text, re.IGNORECASE | re.DOTALL)
                if matches and len(matches) >= fig_num:
                    caption = matches[fig_num-1].strip()
                    caption = re.sub(r'\s+', ' ', caption)
                    return caption[:500] + "..." if len(caption) > 500 else caption
            except re.error:
                continue
        
        # Simple fallback: extract any text around figures
        lines = page_text.split('\n')
        for i, line in enumerate(lines):
            if any(word in line.lower() for word in ['figure', 'fig', 'panel']):
                # Get next few lines as potential caption
                caption_lines = lines[i:i+3]
                caption = ' '.join(caption_lines).strip()
                if len(caption) > 20:  # Minimum caption length
                    caption = re.sub(r'\s+', ' ', caption)
                    return caption[:500] + "..." if len(caption) > 500 else caption
        
        return f"[Caption not found for figure {fig_num} on page {page_num}]"
    
    def analyze_page_content(self, page_data):
        """Analyze page content for neural circuits, connectivity, and larval data"""
        text = page_data["full_text"].lower()
        
        # Neural circuit keywords
        circuit_score = 0
        circuit_keywords = [
            "synapse", "neuron", "circuit", "connectivity", "pathway", 
            "dendrite", "axon", "presynaptic", "postsynaptic", "innervation"
        ]
        for keyword in circuit_keywords:
            circuit_score += text.count(keyword)
        
        # Larval-specific keywords
        larval_score = 0
        larval_keywords = [
            "larva", "larval", "l1", "l2", "l3", "instar", "development",
            "bolwig", "mechanosensory", "chemosensory", "crawling"
        ]
        for keyword in larval_keywords:
            larval_score += text.count(keyword)
        
        # Connectome keywords
        connectome_score = 0
        connectome_keywords = [
            "connectome", "connectomic", "reconstruction", "em", "electron microscopy",
            "serial section", "volume", "segmentation"
        ]
        for keyword in connectome_keywords:
            connectome_score += text.count(keyword)
        
        # Extract specific neuron types mentioned
        neuron_types = []
        neuron_patterns = [
            r"(\w+)\s+neuron",
            r"(\w+)\s+interneuron", 
            r"(\w+)\s+motor\s+neuron",
            r"(\w+)\s+sensory\s+neuron"
        ]
        
        for pattern in neuron_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            neuron_types.extend([match.lower() for match in matches])
        
        return {
            "circuit_relevance": min(circuit_score, 10),
            "larval_relevance": min(larval_score, 10), 
            "connectome_relevance": min(connectome_score, 10),
            "neuron_types_mentioned": list(set(neuron_types)),
            "key_concepts": self.extract_key_concepts(text)
        }
    
    def extract_key_concepts(self, text):
        """Extract key technical concepts from page text"""
        concepts = []
        
        # Circuit topology terms
        topology_terms = [
            "feed-forward", "feedback", "lateral inhibition", "convergence", 
            "divergence", "recurrent", "hierarchical", "parallel"
        ]
        
        # Measurement terms
        measurement_terms = [
            "calcium imaging", "optogenetics", "patch clamp", "two-photon",
            "confocal", "immunostaining", "in situ hybridization"
        ]
        
        # Behavioral terms
        behavioral_terms = [
            "locomotion", "orientation", "avoidance", "attraction", "feeding",
            "escape", "turn", "speed", "direction", "response"
        ]
        
        all_terms = topology_terms + measurement_terms + behavioral_terms
        
        for term in all_terms:
            if term in text:
                concepts.append(term)
        
        return concepts
    
    def process_pdf_page_by_page(self, pdf_path):
        """Process entire PDF page by page with figures and captions"""
        print(f"\n📖 Processing: {pdf_path.name}")
        
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        doc.close()
        
        pdf_analysis = {
            "pdf_name": pdf_path.name,
            "total_pages": total_pages,
            "processed_date": datetime.now().isoformat(),
            "pages": []
        }
        
        for page_num in range(total_pages):
            print(f"  Page {page_num + 1}/{total_pages}")
            
            # Extract page with figures and captions
            page_data = self.extract_page_with_figures(pdf_path, page_num)
            
            # Analyze content
            analysis = self.analyze_page_content(page_data)
            page_data["analysis"] = analysis
            
            pdf_analysis["pages"].append(page_data)
        
        # Save detailed analysis
        output_file = self.output_dir / f"{pdf_path.stem}_page_analysis.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(pdf_analysis, f, indent=2)
        
        print(f"Saved page analysis: {output_file}")
        
        return pdf_analysis
    
    def generate_page_summary_report(self, pdf_analysis):
        """Generate human-readable page-by-page summary"""
        pdf_name = pdf_analysis["pdf_name"]
        report_file = self.output_dir / f"{Path(pdf_name).stem}_page_summary.md"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(f"# Page-by-Page Analysis: {pdf_name}\n\n")
            f.write(f"**Total Pages**: {pdf_analysis['total_pages']}\n")
            f.write(f"**Processed**: {pdf_analysis['processed_date']}\n\n")
            
            # Summary statistics
            total_figures = sum(len(page["figures"]) for page in pdf_analysis["pages"])
            high_circuit_pages = sum(1 for page in pdf_analysis["pages"] 
                                   if page["analysis"]["circuit_relevance"] >= 3)
            high_larval_pages = sum(1 for page in pdf_analysis["pages"] 
                                  if page["analysis"]["larval_relevance"] >= 3)
            
            f.write(f"## Summary Statistics\n")
            f.write(f"- **Total Figures**: {total_figures}\n")
            f.write(f"- **High Circuit Content Pages**: {high_circuit_pages}\n")
            f.write(f"- **High Larval Content Pages**: {high_larval_pages}\n\n")
            
            # Page by page details
            f.write(f"## Page-by-Page Details\n\n")
            
            for page in pdf_analysis["pages"]:
                page_num = page["page_number"]
                analysis = page["analysis"]
                
                f.write(f"### Page {page_num}\n")
                f.write(f"**Figures**: {page['figure_count']} | ")
                f.write(f"**Circuit Score**: {analysis['circuit_relevance']}/10 | ")
                f.write(f"**Larval Score**: {analysis['larval_relevance']}/10\n\n")
                
                if page["figures"]:
                    f.write(f"**Figures with Captions**:\n")
                    for fig in page["figures"]:
                        f.write(f"- `{fig['figure_file']}`: {fig['caption']}\n")
                    f.write("\n")
                
                if analysis["neuron_types_mentioned"]:
                    f.write(f"**Neuron Types**: {', '.join(analysis['neuron_types_mentioned'])}\n")
                
                if analysis["key_concepts"]:
                    f.write(f"**Key Concepts**: {', '.join(analysis['key_concepts'])}\n")
                
                # Show text excerpt if high relevance
                if (analysis["circuit_relevance"] >= 5 or 
                    analysis["larval_relevance"] >= 5):
                    text_excerpt = page["full_text"][:300].replace('\n', ' ')
                    f.write(f"**Text Excerpt**: {text_excerpt}...\n")
                
                f.write("\n---\n\n")
        
        print(f"Generated summary report: {report_file}")
    
    def process_all_pdfs(self):
        """Process all PDFs in the directory"""
        pdf_files = list(self.pdf_dir.glob("*.pdf"))
        
        if not pdf_files:
            print(f"❌ No PDF files found in {self.pdf_dir}")
            return
        
        print(f"🔍 Found {len(pdf_files)} PDF files")
        
        all_analyses = {}
        
        for pdf_path in pdf_files:
            analysis = self.process_pdf_page_by_page(pdf_path)
            all_analyses[pdf_path.name] = analysis
            
            # Generate summary report for each PDF
            self.generate_page_summary_report(analysis)
        
        # Save combined analysis
        combined_file = self.output_dir / "all_pdfs_page_analysis.json"
        with open(combined_file, 'w', encoding='utf-8') as f:
            json.dump(all_analyses, f, indent=2)
        
        print(f"\nAll page analyses complete. Combined file: {combined_file}")
        
        return all_analyses

if __name__ == "__main__":
    print("Starting Page-by-Page Connectome Analysis")
    print("Extracting figures WITH captions and full context")
    
    analyzer = PageByPageAnalyzer()
    results = analyzer.process_all_pdfs()
    
    print("\nANALYSIS COMPLETE")
    print("- Full page text extracted")
    print("- Figures matched with captions") 
    print("- Circuit/larval content scored")
    print("- Individual page reports generated") 