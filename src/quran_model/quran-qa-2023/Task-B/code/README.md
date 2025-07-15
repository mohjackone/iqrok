## [Reader script](https://gitlab.com/bigirqu/quran-qa-2023/-/blob/main/Task-B/code/read_write_qrcd.py)

The script simply reads the tuples in the **JSONL** formatted QRCD dataset into object instances of the `PassageQuestion` class and  then writes them back to another JSONL file.

To execute the reader script:

    ```
    python read_write_qrcd.py \
       --input_file=.../data/QQA23_TaskB_qrcd_v1.2_train.jsonl \
       --output_file=.../temp_file.jsonl
    ```

## [Submission checker script](https://gitlab.com/bigirqu/quran-qa-2023/-/blob/main/Task-B/code/QQA23_TaskB_submission_checker.py)

It is mandatory to use this script to verify your ***run file*** (prior to submission) with respect to: the file name, the correctness of its format, utf-8 encoding, number of answers per question (not to exceed 10), names of the key fields, etc.

The expected run file is in **JSON** format. It has a list of passage-question ids (pq_id) along with their respective ranked lists of returned answers. For each passage-question pair, the system should return **up to 10** predicted answers, or **abstain** from providing an answer to questions that do not have answers in the Holy Qur'an (i.e., nor in the accompanying Qur'anic passage). We refer to such a question as a **"zero-answer"** question.

For questions that do have answers, the list of answers should include the answers' text, ranks, estimated scores, and the start and end token indices (i.e., positions) of each answer offsetted from the beginning of the accompanying Qur'anic passage. Only the **ranks** and the **start/end token indices** are used in the evaluation (**not** the estimated scores). The run file format is shown below for a sample of three questions (the third being a zero-answer question).

**Important Note**: Before computing the token indices at which each answer starts/ends, the accompanying Qur'anic passages should be *preprocessed* such that full stops used to separate verses in these passages are embraced with white space (*e.g., the full stop in the second answer for the passage-question "74:32-48_330" in the sample run file shown below is embraced with white space*). As such, each full stop in the passage should be considered a token whose position should count towards the computed start/end token indices/positions of the answers extracted from that passage (offsetted from position zero).

The name of each submitted run file should follow the below **naming format**.

<**TeamID_RunID.json**>

such that:

* **TeamID** can be an alphanumeric with a length between 3 and 9 characters
* **RunID**  can be an alphanumeric with a length between 2 and 9 characters

For example, *bigIR_run01.json*

#### Format of the Run File

```
{
    "38:41-44_105": [
        {
            "answer": "أيوب",
            "rank": 1,
            "score": 0.9586813087043423,
            "strt_token_indx": 2,
            "end_token_indx": 2
        },
        {
            "answer": "إنه أواب",
            "rank": 2,
            "score": 0.014768138560114058,
            "strt_token_indx": 42,
            "end_token_indx": 43
        },
        {
            "answer": "ولا تحنث إنا وجدناه صابرا نعم العبد إنه أواب",
            "rank": 3,
            "score": 0.0052241458173706255,
            "strt_token_indx": 35,
            "end_token_indx": 43
        },
        {
            "answer": "واذكر عبدنا أيوب",
            "rank": 4,
            "score": 0.0026888978292958256,
            "strt_token_indx": 0,
            "end_token_indx": 2
        }
    ],
    "74:32-48_330": [
        {
            "answer": "كل نفس بما كسبت رهينة",
            "rank": 1,
            "score": 0.7335555760226602,
            "strt_token_indx": 26,
            "end_token_indx": 30
        },
        {
            "answer": "لمن شاء منكم أن يتقدم أو يتأخر . كل نفس بما كسبت رهينة",
            "rank": 2,
            "score": 0.19330937303913176,
            "strt_token_indx": 18,
            "end_token_indx": 30
        },
        {
            "answer": "لمن شاء منكم أن يتقدم أو يتأخر",
            "rank": 3,
            "score": 0.07103693247802075,
            "strt_token_indx": 18,
            "end_token_indx": 24
        }   
    ],
    "28:85-88_322": []  
}
```

**Note**: It is worth emphasizing that the `strt_token_indx` and `end_token_indx`represent token positions (**not** character positions) in the accompanying passage. Whereas the `start_char` in the train and dev datasets represents the start character position of the answer in the accompanying passage, as shown in the [sample format](https://gitlab.com/bigirqu/quran-qa-2023/-/blob/main/Task-B/data/README.md).

Here is an example of executing the submission checker script:

```
python QQA23_TaskB_submission_checker.py \
    --run_file= .../runs/teamId_run01.json
```

## [Evaluation (scorer) script](https://gitlab.com/bigirqu/quran-qa-2023/-/blob/main/Task-B/code/QQA23_TaskB_eval.py)

We use **partial Average Precision** (**pAP**) [1] as the **official** evaluation measure for Task B. It is a variant of the traditional *Average Precision* evaluation metric. *pAP* is a rank-based measure that integrates partial matching to give credit to a QA system that may retrieve an answer that is not necessarily at the first rank and/or *partially* (i.e., not exactly) match one of the gold answers. Moreover, *pAP* can be used in evaluating questions that may have one or more answers in the accompanying passage. This makes *pAP* more suitable to the RC task of Qur'an QA 2023 than partial Reciprocal Rank (*pRR*) [2], which was the main evaluation measure for [Qur&#39;an QA 2022](https://sites.google.com/view/quran-qa-2022/home?authuser=0), because participating systems in the latter task were only required to return any answer to a given question even if it has more than one answer in the accompanying passage.

Similar to the PR task, the no-answer cases will be handled simply by giving full credit to ``no answers'' system output and zero otherwise.

To get an overall evaluation score, the measure is averaged over all questions.

Here is an example of executing the evaluation script:

A [preprocessed version of the gold QQA23_TaskB_qrcd_v1.2_dev.jsonl](https://gitlab.com/bigirqu/quran-qa-2023/-/blob/main/Task-B/data/QQA23_TaskB_qrcd_v1.2_dev_preprocessed.jsonl) file has been provided for use with the evaluation script.

```
python QQA23_TaskB_eval.py \
    --gold_answers_file=.../data/QQA23_TaskB_qrcd_v1.2_dev_preprocessed.jsonl \
    --run_file=.../runs/teamId_run01.json
```

The preprocessed version has the `start_char` for each answer adjusted to cater for the white space introduced to embrace the full stops that separate the verses of the Qur'anic passages from which the answers are extracted.

**Note**: The script used in preprpcessing the gold dev set above is almost identical to the [qrcd_preprocessing.py](https://github.com/RanaMalhas/QRCD/blob/main/code/arabert/qrcd_preprocessing.py) script released in the main [GitHub for the original QRCD dataset](https://github.com/RanaMalhas/QRCD/tree/main) [1] (that adopts a SQuAD-like JSON format rather than the JSONL format adopted for the Qur'an QA shared tasks).

## [Whole passage baseline](https://gitlab.com/bigirqu/quran-qa-2023/-/blob/main/Task-B/code/whole_passage_baseline.ipynb)

In this notebook, we provide a baseline to compare your work against. Basically, the baseline is giving the full passage as an answer to the accompanying question. We demonstrate how we developed the baseline. Then, we show the evaluation results of the baseline at the end of the notebook.


## References

[1] Malhas, R. and Elsayed, T., 2022. [Arabic Machine Reading Comprehension on the Holy Qur’an using CL-AraBERT](https://www.sciencedirect.com/science/article/pii/S0306457322001704). *Information Processing & Management*, 59(6), p.103068.

[2] Malhas, R. and Elsayed, T., 2020. [*AyaTEC*: Building a Reusable Verse-based Test Collection for Arabic Question Answering on the Holy Qur’an](https://www.sciencedirect.com/science/article/pii/S0306457322001704). *ACM Transactions on Asian and Low-Resource Language Information Processing (TALLIP)*, 19(6), pp.1-21.
