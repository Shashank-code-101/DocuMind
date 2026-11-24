"""
Verification test suite for LLM Response Formatting across diverse document scenarios:
1. Multiple unrelated topics in one response
2. Technical / Computer specifications
3. Academic assignments with numbered questions and marks
4. Long explanatory answers with subsections and steps
5. Bullet lists
6. Comparison Tables
7. Short conversational answers
"""
import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.llm_service import llm_service


def run_test_case(name: str, question: str, chunks: list):
    print("\n" + "=" * 65)
    print(f"TEST CASE: {name}")
    print(f"Question: {question}")
    print("=" * 65)
    t0 = time.time()
    answer = llm_service.generate_grounded_answer(
        question=question,
        retrieved_chunks=chunks,
    )
    duration = round(time.time() - t0, 2)
    print(f"[Done in {duration}s]\n")
    print(answer)
    print("-" * 65)
    return answer


def main():
    print("=" * 65)
    print("DOCUMIND AI RESPONSE FORMATTING TEST SUITE")
    print("=" * 65)

    # 1. Multiple Unrelated Topics
    c1 = [
        {
            "document_name": "Course_Overview.pdf",
            "page_number": 1,
            "text": "Topic A - Quantum Cryptography: Uses quantum mechanics principles such as Heisenberg uncertainty to guarantee secure key distribution via BB84 protocol."
        },
        {
            "document_name": "Course_Overview.pdf",
            "page_number": 4,
            "text": "Topic B - Relational Database Optimization: B-Tree indexes provide logarithmic search times O(log N) for equality and range queries on indexed columns."
        },
        {
            "document_name": "Course_Overview.pdf",
            "page_number": 8,
            "text": "Topic C - Docker Containerization: Containers package an application and its dependencies together to ensure consistency across computing environments using Linux cgroups and namespaces."
        }
    ]
    ans1 = run_test_case(
        "1. Multiple Unrelated Topics",
        "Summarize the three core topics covered in this document: Quantum Cryptography, Relational Database Optimization, and Docker Containerization.",
        c1,
    )
    assert "###" in ans1 or "##" in ans1, "Expected headings in multi-topic response"

    # 2. Computer Specifications
    c2 = [
        {
            "document_name": "Workstation_Specs.pdf",
            "page_number": 2,
            "text": "Workstation Hardware Specs:\nProcessor: AMD Ryzen 9 7950X, 16 Cores, 32 Threads, up to 5.7 GHz boost.\nMemory: 64GB DDR5-6000 MHz ECC RAM.\nStorage: 2TB PCIe Gen 4 NVMe M.2 SSD (7,000 MB/s read).\nGraphics: NVIDIA RTX 4090 24GB GDDR6X.\nPower Supply: 1000W 80-Plus Titanium PSU.\nOperating System: Ubuntu 24.04 LTS."
        }
    ]
    ans2 = run_test_case(
        "2. Computer Specifications",
        "List all hardware specifications for this workstation.",
        c2,
    )
    assert "**" in ans2, "Expected bold formatting for specs"

    # 3. Academic Assignment with Numbered Questions
    c3 = [
        {
            "document_name": "CS401_Assignment2.pdf",
            "page_number": 1,
            "text": "Assignment 2: Distributed Systems Algorithms\nDue Date: Friday at 11:59 PM. Total Marks: 50.\n\nSection A: Consensus (20 Marks)\n1. Explain the difference between Safety and Liveness in the Raft consensus protocol. (10 marks)\n2. Describe the election timeout mechanism used to trigger leader election. (10 marks)\n\nSection B: Vector Clocks (30 Marks)\n3. Given three concurrent processes P1, P2, and P3, calculate the vector timestamps for the following sequence of events. (15 marks)\n4. Prove that vector clocks capture causal relationships whereas Lamport logical clocks do not. (15 marks)"
        }
    ]
    ans3 = run_test_case(
        "3. Academic Assignment with Numbered Questions",
        "What are the assignment questions, sections, marks, and instructions in this document?",
        c3,
    )
    assert any(num in ans3 for num in ["1.", "2.", "3."]), "Expected numbered list for questions"
    assert "Section" in ans3, "Expected sections in assignment"

    # 4. Long Explanation with Subsections
    c4 = [
        {
            "document_name": "Attention_Mechanism.pdf",
            "page_number": 5,
            "text": "Scaled Dot-Product Attention operates on query Q, key K, and value V matrices.\nStep 1: Compute matrix multiplication between Q and K transpose to obtain raw compatibility scores.\nStep 2: Scale scores by dividing by square root of key dimension d_k to prevent vanishing gradients.\nStep 3: Apply softmax function along rows to obtain normalized attention weights between 0 and 1.\nStep 4: Multiply attention weights by value matrix V to yield the final context representation.\nMulti-Head Attention projects Q, K, and V into h different representation subspaces, allowing the model to jointly attend to information from different representation positions."
        }
    ]
    ans4 = run_test_case(
        "4. Long Explanation with Subsections and Steps",
        "Explain how Scaled Dot-Product Attention works step-by-step.",
        c4,
    )
    assert any(step in ans4.lower() for step in ["step", "1.", "2."]), "Expected step breakdown"

    # 5. Tables Comparison
    c5 = [
        {
            "document_name": "AI_Hardware.pdf",
            "page_number": 3,
            "text": "Hardware Comparison:\n- CPU: Best for general-purpose serial processing, latency-critical operations, few powerful cores.\n- GPU: Best for massively parallel matrix operations, graphics rendering, high memory bandwidth, thousands of cores.\n- TPU: Google custom ASIC tailored strictly for tensor operations and deep learning training/inference, matrix multiply unit (MXU)."
        }
    ]
    ans5 = run_test_case(
        "5. Table Comparison",
        "Provide a comparison table contrasting CPU, GPU, and TPU architectures and use cases.",
        c5,
    )
    assert "|" in ans5, "Expected markdown table formatting"

    # 6. Short Conversational Answer
    c6 = [
        {
            "document_name": "Company_Profile.pdf",
            "page_number": 1,
            "text": "DocuMind was founded in 2024 by an international team of researchers."
        }
    ]
    ans6 = run_test_case(
        "6. Short Conversational Answer",
        "When was DocuMind founded?",
        c6,
    )
    assert "2024" in ans6, "Expected 2024 in short answer"

    print("\n" + "=" * 65)
    print("ALL FORMATTING TEST CASES EXECUTED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    main()
