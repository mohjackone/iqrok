import requests
import json
import time

url = "https://iqrok-production.up.railway.app/api/search"
encoders = [
    "firqaaa/indo-sentence-bert-base",
    "indobenchmark/indobert-base-p1",
    "msmarco-distilbert-base-tas-b",
    "aubmindlab/bert-base-arabert",
    "text-embedding-ada-002"
]

def test_encoder(encoder):
    data = {
        "query": "sholat subuh",
        "encoder": encoder,
        "search_type": "translation",
        "top_k": 5
    }

    try:
        print(f"\n{'='*50}")
        print(f"Testing Encoder: {encoder}")
        print('='*50)
        
        start_time = time.time()
        response = requests.post(url, json=data)
        response.raise_for_status()
        
        result = response.json()
        print(f"Query: {result['query']}")
        print(f"Search Type: {result['search_type']}")
        print(f"Processing Time: {result['processing_time']:.2f} seconds")
        print(f"Total Time (including network): {time.time() - start_time:.2f} seconds")
        print(f"Encoder: {result['encoder']}")
        print("\nTop 5 Results:")
        
        for i, verse in enumerate(result['results'], 1):
            print(f"\n{i}. Verse {verse['verse_id']}")
            print(f"Search Score: {verse['search_score']:.4f}")
            print(f"Rank Score: {verse['rank_score']:.4f}")
            print(f"Final Score: {verse['final_score']:.4f}")
            if verse.get('arabic_text'):
                print(f"Arabic: {verse['arabic_text']}")
            if verse.get('translation'):
                print(f"Translation: {verse['translation']}")
            
    except requests.exceptions.RequestException as e:
        print(f"Error testing {encoder}: {str(e)}")
    except Exception as e:
        print(f"Unexpected error testing {encoder}: {str(e)}")
    print("\n")

def main():
    print("\nStarting API Tests...")
    for encoder in encoders:
        test_encoder(encoder)
    print("Testing complete!")

if __name__ == "__main__":
    main() 