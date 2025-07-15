import sys
import os

def load_qrels(qrels_path):
    qrels = {}
    with open(qrels_path, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 4:
                continue
            qid, _, docid, rel = parts
            if int(rel) > 0:
                qrels.setdefault(qid, set()).add(docid)
    print(f"Loaded {len(qrels)} queries from qrels file")
    return qrels

def load_system_results(results_path):
    system_results = {}
    with open(results_path, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) < 2:
                continue
            qid = parts[0]
            doc_ids = parts[1:]
            system_results[qid] = doc_ids
    print(f"Loaded {len(system_results)} queries from system results")
    return system_results

def compute_map_at_k(results, relevant_docs, k=10, qid=None):
    hits = 0
    sum_precisions = 0.0
    for i, doc_id in enumerate(results[:k]):
        if doc_id in relevant_docs:
            hits += 1
            sum_precisions += hits / (i + 1)
    if hits == 0:
        print(f"Query {qid}: No relevant documents found in top {k} results")
        return 0.0
    return sum_precisions / hits

def compute_mrr(results, relevant_docs, qid=None):
    for i, doc_id in enumerate(results):
        if doc_id in relevant_docs:
            return 1.0 / (i + 1)
    print(f"Query {qid}: No relevant documents found in results")
    return 0.0

def evaluate(system_results, qrels, k=10):
    map_scores = []
    mrr_scores = []
    
    # Check for query ID mismatches
    system_qids = set(system_results.keys())
    qrels_qids = set(qrels.keys())
    missing_qids = qrels_qids - system_qids
    extra_qids = system_qids - qrels_qids
    
    if missing_qids:
        print(f"Warning: {len(missing_qids)} queries in qrels but not in system results")
    if extra_qids:
        print(f"Warning: {len(extra_qids)} queries in system results but not in qrels")
    
    for qid, results in system_results.items():
        relevant_docs = qrels.get(qid, set())
        if not relevant_docs:
            print(f"Query {qid}: No relevant documents in qrels")
            continue
            
        print(f"\nProcessing query {qid}")
        print(f"Number of relevant docs: {len(relevant_docs)}")
        print(f"First few relevant docs: {list(relevant_docs)[:3]}")
        print(f"First few system results: {results[:3]}")
        
        map_score = compute_map_at_k(results, relevant_docs, k, qid)
        mrr_score = compute_mrr(results, relevant_docs, qid)
        
        print(f"Query {qid} scores - MAP@{k}: {map_score:.4f}, MRR: {mrr_score:.4f}")
        
        map_scores.append(map_score)
        mrr_scores.append(mrr_score)
    
    mean_map = sum(map_scores) / len(map_scores) if map_scores else 0.0
    mean_mrr = sum(mrr_scores) / len(mrr_scores) if mrr_scores else 0.0
    return mean_map, mean_mrr

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: python {os.path.basename(__file__)} <qrels_file> <system_results_file>")
        sys.exit(1)
    qrels_file = sys.argv[1]
    system_results_file = sys.argv[2]
    print(f"\nEvaluating IR results")
    print(f"Qrels file: {qrels_file}")
    print(f"System results file: {system_results_file}\n")
    
    qrels = load_qrels(qrels_file)
    system_results = load_system_results(system_results_file)
    mean_map, mean_mrr = evaluate(system_results, qrels, k=10)
    print(f"\nFinal Scores:")
    print(f"MAP@10: {mean_map:.4f}")
    print(f"MRR: {mean_mrr:.4f}") 