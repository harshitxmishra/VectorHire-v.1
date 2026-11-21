import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import csv

candidates_data = [
    {
        "s_no": 1,
        "name": "Rishabh Chawla",
        "email": "rishabh.chawla@dtu.ac.in",
        "college": "Delhi Technological University",
        "branch": "Computer Science & Engineering",
        "cgpa": 8.94,
        "best_ai_project": "Developed an end-to-end RAG system with hybrid semantic search using LangChain, pgvector, and Gemini 1.5 Pro with dynamic reranking for multi-document enterprise knowledge extraction.",
        "research_publication": "Hierarchical Context Retrieval in Large Language Models for Long-Document QA (IEEE Access 2024)",
        "github": "https://github.com/karpathy",
        "resume": "https://drive.google.com/file/d/1G8qavC6pyQoyS-B-k_UxbjcMQn3N5d2m/view?usp=sharing",
        "test_la": 88,
        "test_code": 96
    },
    {
        "s_no": 2,
        "name": "Pragya Mishra",
        "email": "pragya.mishra@nsut.ac.in",
        "college": "Netaji Subhas University of Technology",
        "branch": "Artificial Intelligence & Data Science",
        "cgpa": 9.21,
        "best_ai_project": "Built an autonomous multi-agent code refactoring engine powered by Tree-of-Thought prompting, AST validation, and AST-guided linting loops reducing code smell by 42%.",
        "research_publication": "Self-Correcting Multi-Agent Code Generation with AST Feedback Loops (NeurIPS Workshop 2024)",
        "github": "https://github.com/pragyamishra",
        "resume": "https://drive.google.com/file/d/1egKsimTl7Z1sboQlbA1SQ-yJuVUSnulG/view?usp=sharing",
        "test_la": 92,
        "test_code": 94
    },
    {
        "s_no": 3,
        "name": "Aman Srivastava",
        "email": "aman.srivastava@iitd.ac.in",
        "college": "Indian Institute of Technology Delhi",
        "branch": "Computer Science & Engineering",
        "cgpa": 9.55,
        "best_ai_project": "Implemented a distributed Vision Transformer (ViT) model for multi-class retinal OCT scan diagnosis with self-supervised masked autoencoder pretraining.",
        "research_publication": "InViTNet: Masked Autoencoding for Micro-Lesion Detection in Ophthalmic Imaging (CVPR 2024)",
        "github": "https://github.com/amansrivastava",
        "resume": "https://drive.google.com/file/d/1sdUb4xAeHCxnAzs4N0gLqqWA-InjoA7u/view?usp=sharing",
        "test_la": 95,
        "test_code": 98
    },
    {
        "s_no": 4,
        "name": "Ananya Sharma",
        "email": "ananya.sharma@iiitd.ac.in",
        "college": "Indraprastha Institute of Information Technology Delhi",
        "branch": "Computer Science & Applied Mathematics",
        "cgpa": 8.78,
        "best_ai_project": "Designed a low-latency real-time video super-resolution pipeline utilizing spatial-temporal recurrent convolutional networks deployed via TensorRT.",
        "research_publication": "Sub-pixel Temporal Fusion for 4K Super Resolution on Embedded GPUs (ICCV 2023)",
        "github": "https://github.com/ananyasharma",
        "resume": "https://drive.google.com/file/d/1G8qavC6pyQoyS-B-k_UxbjcMQn3N5d2m/view?usp=sharing",
        "test_la": 82,
        "test_code": 91
    },
    {
        "s_no": 5,
        "name": "Devansh Gupta",
        "email": "devansh.gupta@dtu.ac.in",
        "college": "Delhi Technological University",
        "branch": "Software Engineering",
        "cgpa": 8.45,
        "best_ai_project": "Engineered an AI-driven automated API testing agent that leverages vector embeddings of OpenAPI specs to synthesize edge-case fuzz payloads.",
        "research_publication": "Autonomous Vulnerability Discovery in Microservices Using Reinforcement Learning (ACM SIGSOFT 2024)",
        "github": "https://github.com/devanshgupta",
        "resume": "https://drive.google.com/file/d/1egKsimTl7Z1sboQlbA1SQ-yJuVUSnulG/view?usp=sharing",
        "test_la": 78,
        "test_code": 89
    },
    {
        "s_no": 6,
        "name": "Ishaan Saxena",
        "email": "ishaan.saxena@bits-pilani.ac.in",
        "college": "Birla Institute of Technology and Science, Pilani",
        "branch": "Electronics & Instrumentation",
        "cgpa": 8.62,
        "best_ai_project": "Created an Edge-AI neuromorphic computing framework on FPGA for real-time robotic drone obstacle avoidance with spiking neural networks (SNN).",
        "research_publication": "Spike-Driven Ultra-Low-Power Edge Perception for Autonomous UAV Navigation (IEEE Trans. on Robotics 2024)",
        "github": "https://github.com/ishaansaxena",
        "resume": "https://drive.google.com/file/d/1sdUb4xAeHCxnAzs4N0gLqqWA-InjoA7u/view?usp=sharing",
        "test_la": 85,
        "test_code": 87
    },
    {
        "s_no": 7,
        "name": "Nishant Kumar",
        "email": "nishant.kumar@nsut.ac.in",
        "college": "Netaji Subhas University of Technology",
        "branch": "Mathematics & Computing",
        "cgpa": 9.12,
        "best_ai_project": "Built a high-frequency algorithmic market-making simulation using Deep Q-Networks (DQN) and transformer-based order book price prediction.",
        "research_publication": "Order Book Dynamics and Microstructure Alpha Prediction with Temporal Graph Attention (ICML 2024)",
        "github": "https://github.com/nishantkumar",
        "resume": "https://drive.google.com/file/d/1G8qavC6pyQoyS-B-k_UxbjcMQn3N5d2m/view?usp=sharing",
        "test_la": 94,
        "test_code": 95
    },
    {
        "s_no": 8,
        "name": "Tanvi Deshmukh",
        "email": "tanvi.deshmukh@iitb.ac.in",
        "college": "Indian Institute of Technology Bombay",
        "branch": "Computer Science & Engineering",
        "cgpa": 9.68,
        "best_ai_project": "Developed a zero-shot multimodal document parsing pipeline combining LayoutLMv3 with local fine-tuned Qwen-VL for extracting structured financial tables.",
        "research_publication": "Cross-Lingual Visual Document Understanding in Heterogeneous Legal Corpora (ACL 2024)",
        "github": "https://github.com/tanvideshmukh",
        "resume": "https://drive.google.com/file/d/1egKsimTl7Z1sboQlbA1SQ-yJuVUSnulG/view?usp=sharing",
        "test_la": 96,
        "test_code": 100
    },
    {
        "s_no": 9,
        "name": "Rohan Arora",
        "email": "rohan.arora@dtu.ac.in",
        "college": "Delhi Technological University",
        "branch": "Information Technology",
        "cgpa": 8.35,
        "best_ai_project": "Built a federated learning framework for medical records preserving patient privacy using Differential Privacy and Homomorphic Encryption.",
        "research_publication": "Privacy-Preserving Collaborative Deep Learning on Distributed Healthcare Repositories (IEEE TIFS 2023)",
        "github": "https://github.com/rohanarora",
        "resume": "https://drive.google.com/file/d/1sdUb4xAeHCxnAzs4N0gLqqWA-InjoA7u/view?usp=sharing",
        "test_la": 74,
        "test_code": 86
    },
    {
        "s_no": 10,
        "name": "Shubham Verma",
        "email": "shubham.verma@dtu.ac.in",
        "college": "Delhi Technological University",
        "branch": "Electronics & Communication Engineering",
        "cgpa": 7.92,
        "best_ai_project": "Engineered an IoT acoustic anomaly detection system using 1D-CNNs deployed on STM32 microcontrollers for predictive industrial machinery maintenance.",
        "research_publication": "TinyML Acoustic Anomaly Classification in High-Noise Industrial Environments (IEEE Sensors 2024)",
        "github": "https://github.com/shubhamverma18",
        "resume": "https://drive.google.com/file/d/1G8qavC6pyQoyS-B-k_UxbjcMQn3N5d2m/view?usp=sharing",
        "test_la": 68,
        "test_code": 82
    },
    {
        "s_no": 11,
        "name": "Kunal Kushwaha",
        "email": "kunal.kushwaha@dtu.ac.in",
        "college": "Delhi Technological University",
        "branch": "Computer Science & Engineering",
        "cgpa": 8.85,
        "best_ai_project": "Developed a distributed cloud-native LLM serving gateway using vLLM, continuous batching, PagedAttention, and automated multi-region failover.",
        "research_publication": "High-Throughput Serving of Multi-Tenant Large Language Models in Kubernetes (CloudCom 2024)",
        "github": "https://github.com/kunal-kushwaha",
        "resume": "https://drive.google.com/file/d/1egKsimTl7Z1sboQlbA1SQ-yJuVUSnulG/view?usp=sharing",
        "test_la": 89,
        "test_code": 97
    },
    {
        "s_no": 12,
        "name": "Sebastian Ramirez",
        "email": "tiangolo.dev@nsut.ac.in",
        "college": "Netaji Subhas University of Technology",
        "branch": "Software Engineering",
        "cgpa": 9.15,
        "best_ai_project": "Architected an asynchronous streaming inference engine with automated Pydantic schema validation and OpenAPI spec generation for GenAI backends.",
        "research_publication": "Declarative Typing and Fast Asynchronous Serialization in Web-Scale APIs (SoftwareX 2023)",
        "github": "https://github.com/tiangolo",
        "resume": "https://drive.google.com/file/d/1sdUb4xAeHCxnAzs4N0gLqqWA-InjoA7u/view?usp=sharing",
        "test_la": 93,
        "test_code": 99
    },
    {
        "s_no": 13,
        "name": "Sebastian Raschka",
        "email": "s.raschka@iitd.ac.in",
        "college": "Indian Institute of Technology Delhi",
        "branch": "Artificial Intelligence & Data Science",
        "cgpa": 9.42,
        "best_ai_project": "Designed efficient parameter-efficient fine-tuning (PEFT/LoRA) algorithms for open-weights 70B LLMs on consumer-grade GPU clusters.",
        "research_publication": "Understanding LoRA Hyperparameters and Rank Scaling for Instruction Tuning (EMNLP 2024)",
        "github": "https://github.com/rasbt",
        "resume": "https://drive.google.com/file/d/1G8qavC6pyQoyS-B-k_UxbjcMQn3N5d2m/view?usp=sharing",
        "test_la": 91,
        "test_code": 96
    },
    {
        "s_no": 14,
        "name": "Phil Wang",
        "email": "lucidrains.ai@iiit.ac.in",
        "college": "International Institute of Information Technology, Hyderabad",
        "branch": "Computer Science & Engineering",
        "cgpa": 9.75,
        "best_ai_project": "Open-source reproduction and architectural optimization of state-of-the-art diffusion transformers, sparse attention mechanisms, and flow matching models.",
        "research_publication": "Scalable Flow-Matching Generative Models for Multi-Modal Generation (ArXiv preprint 2024)",
        "github": "https://github.com/lucidrains",
        "resume": "https://drive.google.com/file/d/1egKsimTl7Z1sboQlbA1SQ-yJuVUSnulG/view?usp=sharing",
        "test_la": 97,
        "test_code": 100
    },
    {
        "s_no": 15,
        "name": "Harrison Chase",
        "email": "harrison.chase@dtu.ac.in",
        "college": "Delhi Technological University",
        "branch": "Mathematics & Computing",
        "cgpa": 8.90,
        "best_ai_project": "Designed a cyclical multi-agent graph orchestration engine for complex workflows, long-term memory retrieval, and human-in-the-loop validation.",
        "research_publication": "State Machine Formulations for Resilient Agentic LLM Orchestration (AAAI Workshop 2024)",
        "github": "https://github.com/hwchase17",
        "resume": "https://drive.google.com/file/d/1sdUb4xAeHCxnAzs4N0gLqqWA-InjoA7u/view?usp=sharing",
        "test_la": 86,
        "test_code": 93
    },
    {
        "s_no": 16,
        "name": "George Hotz",
        "email": "geohot.autonomous@nsut.ac.in",
        "college": "Netaji Subhas University of Technology",
        "branch": "Electrical Engineering",
        "cgpa": 9.05,
        "best_ai_project": "Built a minimal, highly parallel deep learning tensor compiler and neural network training runtime targeting custom GPU kernels and Apple Silicon.",
        "research_publication": "Lazy Evaluation and Kernel Fusion in Lightweight Deep Learning Compilers (SysML 2024)",
        "github": "https://github.com/geohot",
        "resume": "https://drive.google.com/file/d/1G8qavC6pyQoyS-B-k_UxbjcMQn3N5d2m/view?usp=sharing",
        "test_la": 98,
        "test_code": 99
    },
    {
        "s_no": 17,
        "name": "Francois Chollet",
        "email": "fchollet.deeplearning@iitb.ac.in",
        "college": "Indian Institute of Technology Bombay",
        "branch": "Computer Science & Engineering",
        "cgpa": 9.80,
        "best_ai_project": "Developed program synthesis benchmarks and compositional abstraction solvers for evaluating General Intelligence on the ARC challenge.",
        "research_publication": "On the Measure of Intelligence and Program Synthesis Benchmarks (ArXiv 2024)",
        "github": "https://github.com/fchollet",
        "resume": "https://drive.google.com/file/d/1egKsimTl7Z1sboQlbA1SQ-yJuVUSnulG/view?usp=sharing",
        "test_la": 99,
        "test_code": 98
    },
    {
        "s_no": 18,
        "name": "David Ha",
        "email": "hardmaru.neuro@dtu.ac.in",
        "college": "Delhi Technological University",
        "branch": "Engineering Physics",
        "cgpa": 8.65,
        "best_ai_project": "Constructed World Models for reinforcement learning where an agent learns an internal generative predictive representation of its environment in latent space.",
        "research_publication": "Recurrent World Models Facilitate Policy Evolution in Complex Environments (NeurIPS 2023)",
        "github": "https://github.com/hardmaru",
        "resume": "https://drive.google.com/file/d/1sdUb4xAeHCxnAzs4N0gLqqWA-InjoA7u/view?usp=sharing",
        "test_la": 84,
        "test_code": 88
    },
    {
        "s_no": 19,
        "name": "Soumith Chintala",
        "email": "soumith.torch@iitd.ac.in",
        "college": "Indian Institute of Technology Delhi",
        "branch": "Computer Science & Engineering",
        "cgpa": 9.60,
        "best_ai_project": "Engineered dynamic computational graph execution graphs with autograd differentiation and distributed tensor parallelism for trillion-parameter models.",
        "research_publication": "PyTorch 2.0: Fast Dynamic Graphs with Just-In-Time Compilation (ACM ASPLOS 2023)",
        "github": "https://github.com/soumith",
        "resume": "https://drive.google.com/file/d/1G8qavC6pyQoyS-B-k_UxbjcMQn3N5d2m/view?usp=sharing",
        "test_la": 96,
        "test_code": 99
    },
    {
        "s_no": 20,
        "name": "Hitesh Choudhary",
        "email": "hitesh.choudhary@dtu.ac.in",
        "college": "Delhi Technological University",
        "branch": "Information Technology",
        "cgpa": 8.10,
        "best_ai_project": "Developed a full-stack AI coding companion using Next.js, WebSockets, Monaco Editor, and containerized sandboxed code execution environments.",
        "research_publication": "Full-Stack Web Architectures for Interactive AI Developer Tooling (IEEE Software 2024)",
        "github": "https://github.com/hiteshchoudhary",
        "resume": "https://drive.google.com/file/d/1egKsimTl7Z1sboQlbA1SQ-yJuVUSnulG/view?usp=sharing",
        "test_la": 76,
        "test_code": 90
    },
    {
        "s_no": 21,
        "name": "Tania Rascia",
        "email": "tania.rascia@nsut.ac.in",
        "college": "Netaji Subhas University of Technology",
        "branch": "Software Engineering",
        "cgpa": 8.52,
        "best_ai_project": "Created a lightweight web component library and reactive state management system optimized for accessible frontend dashboards and zero bundle overhead.",
        "research_publication": "Modern Vanilla JS Patterns for High-Performance Client Applications (JS Conf Proceedings 2023)",
        "github": "https://github.com/taniarascia",
        "resume": "https://drive.google.com/file/d/1sdUb4xAeHCxnAzs4N0gLqqWA-InjoA7u/view?usp=sharing",
        "test_la": 81,
        "test_code": 92
    },
    {
        "s_no": 22,
        "name": "Shawn Swyx Wang",
        "email": "swyx.ai@iiitd.ac.in",
        "college": "Indraprastha Institute of Information Technology Delhi",
        "branch": "Computer Science & Engineering",
        "cgpa": 8.95,
        "best_ai_project": "Built an AI Engineer workbench with automated evaluation harnesses, prompt regression testing, and real-time cost telemetry for production LLM deployments.",
        "research_publication": "Evaluation Frameworks and Benchmark Drift in Production GenAI Systems (IEEE AI-Ops 2024)",
        "github": "https://github.com/swyxio",
        "resume": "https://drive.google.com/file/d/1G8qavC6pyQoyS-B-k_UxbjcMQn3N5d2m/view?usp=sharing",
        "test_la": 87,
        "test_code": 94
    },
    {
        "s_no": 23,
        "name": "Dan Abramov",
        "email": "dan.abramov@dtu.ac.in",
        "college": "Delhi Technological University",
        "branch": "Software Engineering",
        "cgpa": 8.80,
        "best_ai_project": "Engineered time-travel debugging algorithms for predictive deterministic state replay in modern concurrent UI frameworks.",
        "research_publication": "Predictable State Management and Hot Reloading in Distributed Web UIs (ECOOP 2023)",
        "github": "https://github.com/gaearon",
        "resume": "https://drive.google.com/file/d/1egKsimTl7Z1sboQlbA1SQ-yJuVUSnulG/view?usp=sharing",
        "test_la": 85,
        "test_code": 98
    },
    {
        "s_no": 24,
        "name": "Guillermo Rauch",
        "email": "guillermo.rauch@iitd.ac.in",
        "college": "Indian Institute of Technology Delhi",
        "branch": "Computer Science & Engineering",
        "cgpa": 9.30,
        "best_ai_project": "Designed an edge-computing serverless runtime with instantaneous cold starts and isolated V8 isolates for AI streaming endpoints.",
        "research_publication": "Sub-millisecond Serverless Execution on Global Edge Networks (ACM SIGCOMM 2024)",
        "github": "https://github.com/rauchg",
        "resume": "https://drive.google.com/file/d/1sdUb4xAeHCxnAzs4N0gLqqWA-InjoA7u/view?usp=sharing",
        "test_la": 93,
        "test_code": 97
    },
    {
        "s_no": 25,
        "name": "Addy Osmani",
        "email": "addy.osmani@bits-pilani.ac.in",
        "college": "Birla Institute of Technology and Science, Pilani",
        "branch": "Computer Science & Engineering",
        "cgpa": 9.18,
        "best_ai_project": "Created an AI-guided automated web performance optimizer that analyzes Chrome DevTools traces and refactors bundle chunks dynamically.",
        "research_publication": "Machine Learning for Automated Web Performance and Critical Path Optimization (IEEE Software 2024)",
        "github": "https://github.com/addyosmani",
        "resume": "https://drive.google.com/file/d/1G8qavC6pyQoyS-B-k_UxbjcMQn3N5d2m/view?usp=sharing",
        "test_la": 90,
        "test_code": 95
    },
    {
        "s_no": 26,
        "name": "Kent C Dodds",
        "email": "kent.dodds@nsut.ac.in",
        "college": "Netaji Subhas University of Technology",
        "branch": "Information Technology",
        "cgpa": 8.68,
        "best_ai_project": "Constructed an automated end-to-end integration test synthesizer using AST instrumentation and accessibility tree mapping.",
        "research_publication": "Behavior-Driven Automated Testing of Complex Single Page Applications (ICST 2023)",
        "github": "https://github.com/kentcdodds",
        "resume": "https://drive.google.com/file/d/1egKsimTl7Z1sboQlbA1SQ-yJuVUSnulG/view?usp=sharing",
        "test_la": 83,
        "test_code": 91
    },
    {
        "s_no": 27,
        "name": "Sindre Sorhus",
        "email": "sindre.sorhus@dtu.ac.in",
        "college": "Delhi Technological University",
        "branch": "Computer Science & Engineering",
        "cgpa": 9.02,
        "best_ai_project": "Developed cross-platform CLI toolchains and asynchronous event loops for terminal developer tools and automated CI/CD runners.",
        "research_publication": "Modular Micro-Packaging and Dependency Optimization in Node.js Ecosystems (FSE 2024)",
        "github": "https://github.com/sindresorhus",
        "resume": "https://drive.google.com/file/d/1sdUb4xAeHCxnAzs4N0gLqqWA-InjoA7u/view?usp=sharing",
        "test_la": 88,
        "test_code": 96
    },
    {
        "s_no": 28,
        "name": "Lee Robinson",
        "email": "lee.robinson@iiit.ac.in",
        "college": "International Institute of Information Technology, Hyderabad",
        "branch": "Computer Science & Engineering",
        "cgpa": 9.25,
        "best_ai_project": "Architected hybrid server-client rendering architectures with React Server Components, streaming SSR, and incremental static revalidation.",
        "research_publication": "Optimizing Hydration and Streaming Server Rendering in Full-Stack Web Frameworks (WWW 2024)",
        "github": "https://github.com/leerob",
        "resume": "https://drive.google.com/file/d/1G8qavC6pyQoyS-B-k_UxbjcMQn3N5d2m/view?usp=sharing",
        "test_la": 91,
        "test_code": 95
    }
]

# 1. Create Excel Workbook (.xlsx)
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Candidates"

# Ensure gridlines are visible
ws.views.sheetView[0].showGridLines = True

headers = [
    "s_no",
    "name",
    "email",
    "college",
    "branch",
    "cgpa",
    "best_ai_project",
    "research_publication",
    "github",
    "resume",
    "test_la",
    "test_code"
]

ws.append(headers)

# Style Header
header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
thin_border = Border(
    left=Side(style='thin', color='D9D9D9'),
    right=Side(style='thin', color='D9D9D9'),
    top=Side(style='thin', color='D9D9D9'),
    bottom=Side(style='thin', color='D9D9D9')
)

for col_num in range(1, len(headers) + 1):
    cell = ws.cell(row=1, column=col_num)
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

# Add Candidate Rows
zebra_fill = PatternFill(start_color="F2F5F9", end_color="F2F5F9", fill_type="solid")
link_font = Font(name="Calibri", size=10, color="0563C1", underline="single")
normal_font = Font(name="Calibri", size=10)

for r_idx, c in enumerate(candidates_data, start=2):
    row_values = [
        c["s_no"],
        c["name"],
        c["email"],
        c["college"],
        c["branch"],
        c["cgpa"],
        c["best_ai_project"],
        c["research_publication"],
        c["github"],
        c["resume"],
        c["test_la"],
        c["test_code"]
    ]
    ws.append(row_values)
    
    is_even = (r_idx % 2 == 0)
    
    for col_idx, val in enumerate(row_values, start=1):
        cell = ws.cell(row=r_idx, column=col_idx)
        cell.border = thin_border
        
        # Zebra striping
        if not is_even:
            cell.fill = zebra_fill
            
        # Alignments & Styles
        if col_idx in [1, 6, 11, 12]:  # s_no, cgpa, test_la, test_code
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.font = normal_font
        elif col_idx in [9, 10]:  # github, resume
            cell.alignment = Alignment(horizontal="left", vertical="center")
            cell.font = link_font
        elif col_idx in [7, 8]:  # best_ai_project, research_publication
            cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            cell.font = normal_font
        else:
            cell.alignment = Alignment(horizontal="left", vertical="center")
            cell.font = normal_font

# Adjust column widths
col_widths = {
    1: 8,    # s_no
    2: 22,   # name
    3: 32,   # email
    4: 38,   # college
    5: 32,   # branch
    6: 10,   # cgpa
    7: 55,   # best_ai_project
    8: 45,   # research_publication
    9: 35,   # github
    10: 45,  # resume
    11: 12,  # test_la
    12: 12   # test_code
}

for col_idx, width in col_widths.items():
    col_letter = get_column_letter(col_idx)
    ws.column_dimensions[col_letter].width = width

xlsx_path = r"c:\Users\SujeetMishra\Music\VectorHire\VectorHire-v.1\candidates_dataset_test.xlsx"
csv_path = r"c:\Users\SujeetMishra\Music\VectorHire\VectorHire-v.1\candidates_dataset_test.csv"

wb.save(xlsx_path)
print(f"Excel workbook created successfully at {xlsx_path}")

# 2. Also Create CSV file
with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    for row in candidates_data:
        writer.writerow(row)

print(f"CSV file created successfully at {csv_path}")
